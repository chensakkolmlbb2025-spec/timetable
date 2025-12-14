import { NextResponse } from "next/server"
import type { TelegramUpdate } from "@/lib/telegram/types"
import { parseRetryCallback } from "@/lib/telegram/utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { generatePDF } from "@/lib/pdf-export"
import { sendPdf, answerCallbackQuery } from "@/lib/telegram/sender"
import { getExportRecord, upsertExportRecord, incrementAttempt } from "@/lib/exports"

export async function POST(req: Request) {
  try {
    const update = (await req.json()) as TelegramUpdate

    if (!update.callback_query) {
      return NextResponse.json({ ok: true, message: "ignored" })
    }

    const cb = update.callback_query
    const callbackId = cb.id
    const data = cb.data

    const date = parseRetryCallback(data)
    if (!date) {
      // invalid data
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN!, callbackId, "Invalid retry data")
      return NextResponse.json({ ok: false, message: "invalid callback" }, { status: 400 })
    }

    const userId = process.env.EXPORT_DEFAULT_USER_ID
    if (!userId) {
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN!, callbackId, "No export user configured")
      return NextResponse.json({ ok: false, message: "no user" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: rows, error } = await admin.from("time_blocks").select("*").eq("user_id", userId).eq("date", date)
    if (error) {
      console.error("DB error on retry:", error)
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN!, callbackId, "Failed to fetch data for retry")
      return NextResponse.json({ ok: false, message: "db error" }, { status: 500 })
    }

    const blocks = (rows || []).map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      title: d.title,
      description: d.description || undefined,
      date: d.date,
      startTime: d.start_time,
      endTime: d.end_time,
      category: d.category,
      color: d.color,
      completed: !!d.completed,
      repeatDaily: !!d.repeat_daily,
      createdAt: d.created_at,
    }))

    if (blocks.length === 0) {
      await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN!, callbackId, "No data for that date")
      return NextResponse.json({ ok: false, message: "no data" })
    }

    // If already sent successfully, inform user
    try {
      const existing = await getExportRecord(userId, date)
      if (existing && existing.status === "success") {
        await answerCallbackQuery(process.env.TELEGRAM_BOT_TOKEN!, callbackId, "Report already sent")
        return NextResponse.json({ ok: true, message: "already sent" })
      }
    } catch (e) {
      console.error("Failed to check export record:", e)
    }

    // fetch profile name
    const { data: profile } = await admin.from("profiles").select("name").eq("id", userId).single()
    const userName = (profile && (profile as any).name) || "User"

    try {
      const doc = generatePDF(blocks, date, userName)
      const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer
      const buffer = Buffer.from(arrayBuffer)

      const { botToken, chatId } = (await import("@/lib/telegram/config")).getTelegramConfig()
      if (!botToken || !chatId) throw new Error("Missing Telegram configuration")
      await sendPdf(botToken, chatId, buffer, `daily-plan-${date}.pdf`, `Daily Plan — ${date}`)
    // log success
    await upsertExportRecord(userId, date, "success")
    await answerCallbackQuery(botToken!, callbackId, "Retry successful — PDF sent")
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error("Retry send failed:", err)
      await incrementAttempt(userId, date, String(err))
      await upsertExportRecord(userId, date, "failed", { error: String(err) })
  const { botToken: failBot } = (await import("@/lib/telegram/config")).getTelegramConfig()
  await answerCallbackQuery(failBot ?? process.env.TELEGRAM_BOT_TOKEN!, callbackId, "Retry failed. Check logs")
      return NextResponse.json({ ok: false, message: "send failed" }, { status: 502 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, message: String(e) }, { status: 500 })
  }
}
