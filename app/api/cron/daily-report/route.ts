import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generatePDF } from "@/lib/pdf-export"
import { sendPdf, sendFailureAlert } from "@/lib/telegram/sender"
import { getReportDateUTCPlus7 } from "@/lib/telegram/utils"
import { getExportRecord, upsertExportRecord, incrementAttempt } from "@/lib/exports"
import { getTimeBlocksForDateFromAdmin } from "@/lib/storage"

export async function POST(req: Request) {
  try {
    // Optional secret protection
    const secret = process.env.CRON_SECRET
    if (secret) {
      const header = req.headers.get("x-cron-secret")
      if (!header || header !== secret) {
        return NextResponse.json({ success: false, message: "Invalid cron secret" }, { status: 401 })
      }
    }

    const date = getReportDateUTCPlus7()
    const userId = process.env.EXPORT_DEFAULT_USER_ID
    if (!userId) {
      return NextResponse.json({ success: false, message: "Missing EXPORT_DEFAULT_USER_ID" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch blocks for the date (includes repeat_daily blocks)
    const blocks = await getTimeBlocksForDateFromAdmin(admin, userId, date)

    if (blocks.length === 0) {
      return NextResponse.json({ success: true, message: "No data for date" })
    }

    // Idempotency: skip if already success
    try {
      const existing = await getExportRecord(userId, date)
      if (existing && existing.status === "success") {
        return NextResponse.json({ success: true, message: "Already sent" })
      }
    } catch (e) {
      console.error("Failed to check export record:", e)
    }

    // Fetch user name if available
    const { data: profile } = await admin.from("profiles").select("name").eq("id", userId).single()
    const userName = (profile && (profile as any).name) || "User"

    // Generate PDF (jsPDF instance)
    const doc = generatePDF(blocks, date, userName)
    const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer
    const buffer = Buffer.from(arrayBuffer)

    // PDF size check
    const maxSize = 50 * 1024 * 1024
    if (buffer.length > maxSize) {
      console.error("PDF too large", { size: buffer.length })
      const { botToken: fb, chatId: fc } = (await import("@/lib/telegram/config")).getTelegramConfig()
      await sendFailureAlert(fb!, fc!, date)
      return NextResponse.json({ success: false, message: "PDF too large" }, { status: 413 })
    }

    try {
      const { botToken, chatId } = (await import("@/lib/telegram/config")).getTelegramConfig()
      if (!botToken || !chatId) throw new Error("Missing Telegram configuration")

      // Try multiple times before giving up (helps transient network issues)
      const maxAttempts = 3
      let lastError: any = null
      let finalResult: any = null
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const r = await sendPdf(botToken, chatId, buffer, `daily-plan-${date}.pdf`, `Daily Plan — ${date}`)
          finalResult = r
          console.info(`cron/daily-report: send attempt ${attempt} succeeded via`, r?.method, "messageId=", r?.messageId)
          break
        } catch (e) {
          lastError = e
          console.warn(`cron/daily-report: send attempt ${attempt} failed:`, String(e))
          // record attempt increment for observability
          try {
            await incrementAttempt(userId, date, String(e))
          } catch (ie) {
            console.error("cron/daily-report: failed to increment attempt:", ie)
          }
          // exponential backoff (short) before next attempt
          if (attempt < maxAttempts) await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt - 1)))
        }
      }

      if (!finalResult) {
        console.error("cron/daily-report: all send attempts failed:", lastError)
        try {
          await upsertExportRecord(userId, date, "failed", { error: String(lastError) })
        } catch (e) {
          console.error("cron/daily-report: failed to upsert failed record:", e)
        }
        try {
          const { botToken: fb, chatId: fc } = (await import("@/lib/telegram/config")).getTelegramConfig()
          await sendFailureAlert(fb!, fc!, date)
        } catch (e) {
          console.error("cron/daily-report: failed to send failure alert:", e)
        }
        return NextResponse.json({ success: false, message: "Send failed after retries", error: String(lastError) }, { status: 502 })
      }

      // Success
      const messageId = finalResult?.messageId
      console.info("cron/daily-report: delivered via", finalResult?.method, "messageId=", messageId)
      if (!messageId) console.warn("cron/daily-report: Telegram send returned no message id; delivery may have failed silently", finalResult?.raw)
      await upsertExportRecord(userId, date, "success", {
        telegramMessageId: messageId ? String(messageId) : undefined,
        telegramResponse: finalResult?.raw,
      })

      const debug = req.headers.get("x-debug") === "1"
      return NextResponse.json({ success: true, method: debug ? finalResult?.method : undefined, messageId: debug ? messageId : undefined })
    } catch (err) {
      console.error(err)
      return NextResponse.json({ success: false, message: String(err) }, { status: 500 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}
