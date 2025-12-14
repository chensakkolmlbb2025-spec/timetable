// Date and callback parsing utilities for Telegram webhook + cron

/**
 * Return the local date string (YYYY-MM-DD) in UTC+7 (Cambodia) for the given time.
 * If `now` is omitted, uses current time.
 */
export function getReportDateUTCPlus7(now?: Date): string {
  const base = now ? new Date(now) : new Date()
  // shift +7 hours
  const shifted = new Date(base.getTime() + 7 * 60 * 60 * 1000)
  const yyyy = shifted.getUTCFullYear()
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(shifted.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/** Validate a date in the simple ISO YYYY-MM-DD format. */
export function isValidIsoDate(d: string): boolean {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d)
}

/**
 * Parse a callback_data value like `retry:YYYY-MM-DD` and return the date or null.
 */
export function parseRetryCallback(data?: string): string | null {
  if (!data) return null
  const parts = data.split(":")
  if (parts.length !== 2) return null
  const [prefix, date] = parts
  if (prefix !== "retry") return null
  return isValidIsoDate(date) ? date : null
}

export {}
