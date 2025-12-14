import { createAdminClient } from "./supabase/admin"

type ExportStatus = "pending" | "success" | "failed"

export async function getExportRecord(userId: string, date: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.from("exports").select("*").eq("user_id", userId).eq("report_date", date).single()
  if (error) {
    // don't throw to keep callers robust; log upstream
    return null
  }
  return data as any
}

export async function upsertExportRecord(userId: string, date: string, status: ExportStatus, opts?: { error?: string; telegramMessageId?: string; telegramResponse?: any }) {
  const admin = createAdminClient()
  const { error } = await admin.from("exports").upsert(
    {
      user_id: userId,
      report_date: date,
      status,
      last_error: opts?.error ?? null,
      telegram_message_id: opts?.telegramMessageId ?? null,
      telegram_response: opts?.telegramResponse ? JSON.stringify(opts.telegramResponse) : null,
    },
    { onConflict: "user_id,report_date" }
  )

  if (error) {
    console.error("Failed to upsert export record:", error)
    return null
  }
  return true
}

export async function incrementAttempt(userId: string, date: string, errorMsg?: string) {
  const admin = createAdminClient()
  try {
    const { data } = await admin.from("exports").select("*").eq("user_id", userId).eq("report_date", date).single()
    if (!data) {
      await admin.from("exports").insert({ user_id: userId, report_date: date, attempt_count: 1, last_error: errorMsg ?? null, status: "failed" })
    } else {
      await admin
        .from("exports")
        .update({ attempt_count: (data.attempt_count || 0) + 1, last_error: errorMsg ?? null, status: "failed" })
        .eq("user_id", userId)
        .eq("report_date", date)
    }
  } catch (e) {
    console.error("Failed to increment attempt:", e)
  }
}

export {}
