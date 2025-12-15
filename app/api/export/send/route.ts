import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { generatePDF } from "@/lib/pdf-export"
import { sendPdf } from "@/lib/telegram/sender"
import { getTelegramConfig } from "@/lib/telegram/config"
import { getExportRecord, upsertExportRecord, incrementAttempt } from "@/lib/exports"
import { getTimeBlocksForDateFromAdmin } from "@/lib/storage"

export async function POST(req: Request) {
  try {
    const { date } = await req.json().catch(() => ({}))
    if (!date || typeof date !== "string") {
      return NextResponse.json({ success: false, message: "Missing or invalid date" }, { status: 400 })
    }

    // Verify session and get current user id - try multiple methods
    const supabase = await createServerClient()
    
    // Method 1: Try getSession
    let userId: string | null = null
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (!sessionError && sessionData?.session?.user?.id) {
      userId = sessionData.session.user.id
      console.log("export/send: Got user from getSession:", userId)
    } else {
      // Method 2: Try getUser (more reliable on some deployments)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (!userError && userData?.user?.id) {
        userId = userData.user.id
        console.log("export/send: Got user from getUser:", userId)
      } else {
        console.error("export/send: Failed to get user via both methods", { 
          sessionError, 
          userError,
          hasSession: !!sessionData?.session,
          hasUser: !!userData?.user
        })
        return NextResponse.json({ 
          success: false, 
          message: "Not authenticated. Please sign in again." 
        })
      }
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Not authenticated. Please sign in again." 
      })
    }

  // Fetch blocks using admin client to avoid RLS surprises but scoped to this user
    const admin = createAdminClient()
    const blocks = await getTimeBlocksForDateFromAdmin(admin, userId, date)

    if (blocks.length === 0) {
      return NextResponse.json({ success: false, message: "No data for that date" }, { status: 204 })
    }

    // Idempotency: if there's already a success record for this user/date, skip
    try {
      const existing = await getExportRecord(userId, date)
      if (existing && existing.status === "success") {
        return NextResponse.json({ success: true, message: "Already sent" })
      }
    } catch (e) {
      console.error("Failed to check existing export record:", e)
    }

    // Get profile name
    const { data: profile } = await admin.from("profiles").select("name").eq("id", userId).single()
    const userName = (profile && (profile as any).name) || "User"

    const doc = generatePDF(blocks, date, userName)
    const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer
    const buffer = Buffer.from(arrayBuffer)

    try {
      const { botToken, chatId } = getTelegramConfig()
      if (!botToken) {
        const msg = "Missing Telegram bot token (LIP_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN)"
        console.error("export/send:", msg)
        return NextResponse.json({ success: false, message: msg }, { status: 500 })
      }
      if (!chatId) {
        const msg = "Missing Telegram chat ID (LIP_TELEGRAM_CHAT_ID or TELEGRAM_CHAT_ID)"
        console.error("export/send:", msg)
        return NextResponse.json({ success: false, message: msg }, { status: 500 })
      }

      const result = await sendPdf(botToken, chatId, buffer, `daily-plan-${date}.pdf`, `Daily Plan — ${date}`)
      // Log success and persist message id + raw response when available
      const messageId = result?.messageId
      console.info("export/send: delivered via", result?.method, "messageId=", messageId)
      if (!messageId) console.warn("export/send: Telegram send returned no message id; delivery may have failed silently", result?.raw)
      await upsertExportRecord(userId, date, "success", {
        telegramMessageId: messageId ? String(messageId) : undefined,
        telegramResponse: result?.raw,
      })
      return NextResponse.json({ success: true, messageId: messageId ?? null })
    } catch (err) {
      const errorMsg = String(err)
      console.error("export/send: Failed to send PDF via Telegram:", errorMsg)
      // record failed attempt
      await incrementAttempt(userId, date, errorMsg)
      await upsertExportRecord(userId, date, "failed", { error: errorMsg })
      return NextResponse.json({ success: false, message: errorMsg }, { status: 502 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}
