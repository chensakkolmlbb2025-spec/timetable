import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getTelegramConfig } from "@/lib/telegram/config"
import { getBotInfo } from "@/lib/telegram/sender"

// Protected endpoint to validate environment readiness for deploy & cron.
export async function GET(req: Request) {
  try {
    const secret = process.env.CRON_SECRET
    if (secret) {
      const header = req.headers.get('x-cron-secret')
      if (!header || header !== secret) return NextResponse.json({ ok: false, message: 'Invalid secret' }, { status: 401 })
    }

    const checks: Record<string, any> = {}

    // Supabase config
    checks.supabase = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Export user
    checks.exportDefaultUserId = !!process.env.EXPORT_DEFAULT_USER_ID

    // Telegram
    const { botToken, chatId } = getTelegramConfig()
    checks.telegram = { botToken: !!botToken, chatId: !!chatId }

    // DB connectivity: simple query
    try {
      const admin = createAdminClient()
      const { data: profiles, error: pErr } = await admin.from('profiles').select('id').limit(1)
      checks.db = { profiles: pErr ? { ok: false, error: String(pErr) } : { ok: true, sample: profiles?.[0] ?? null } }
      // check exports table exists (non-fatal)
      const { data: ex, error: exErr } = await admin.from('exports').select('id').limit(1)
      checks.exports = exErr ? { ok: false, error: String(exErr) } : { ok: true, sample: ex?.[0] ?? null }
    } catch (e) {
      checks.db = { ok: false, error: String(e) }
    }

    // Validate Telegram getMe if token present
    if (botToken) {
      try {
        const info = await getBotInfo(botToken)
        checks.telegram.getMe = { ok: !!info?.ok, info: info?.result ?? info }
      } catch (e) {
        checks.telegram.getMe = { ok: false, error: String(e) }
      }
    }

    return NextResponse.json({ ok: true, checks })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export {}
