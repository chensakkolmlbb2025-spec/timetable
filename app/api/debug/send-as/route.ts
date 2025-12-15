import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generatePDF } from "@/lib/pdf-export"
import { sendPdf } from "@/lib/telegram/sender"
import { getTelegramConfig } from "@/lib/telegram/config"
import { upsertExportRecord, incrementAttempt } from "@/lib/exports"
import { getReportDateUTCPlus7 } from "@/lib/telegram/utils"
import { getTimeBlocksForDateFromAdmin } from "@/lib/storage"

// Debug-only route to send an export as a specific user (useful for local testing).
// Protected by CRON_SECRET header or only enabled in non-production environments.
export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET
    if (process.env.NODE_ENV === 'production' && secret) {
      const header = req.headers.get('x-cron-secret')
      if (!header || header !== secret) {
        return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 401 })
      }
    }

    const { userId, date } = await req.json().catch(() => ({}))
    if (!userId) return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 })

    const sendDate = date || getReportDateUTCPlus7()

    const admin = createAdminClient()
    const blocks = await getTimeBlocksForDateFromAdmin(admin, userId, sendDate)

    if (blocks.length === 0) return NextResponse.json({ success: false, message: 'No blocks for date' }, { status: 204 })

    const { data: profile } = await admin.from('profiles').select('name').eq('id', userId).single()
    const userName = (profile && (profile as any).name) || 'User'

    const doc = generatePDF(blocks, sendDate, userName)
    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
    const buffer = Buffer.from(arrayBuffer)

    try {
      const { botToken, chatId } = getTelegramConfig()
      if (!botToken || !chatId) throw new Error('Missing Telegram configuration')
      const result = await sendPdf(botToken, chatId, buffer, `daily-plan-${sendDate}.pdf`, `Daily Plan — ${sendDate}`)
      const messageId = result?.messageId
      await upsertExportRecord(userId, sendDate, 'success', { telegramMessageId: messageId ? String(messageId) : undefined })
      return NextResponse.json({ success: true, result, messageId })
    } catch (e) {
      await incrementAttempt(userId, sendDate, String(e))
      await upsertExportRecord(userId, sendDate, 'failed', { error: String(e) })
      return NextResponse.json({ success: false, message: String(e) }, { status: 502 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 })
  }
}

export {}
