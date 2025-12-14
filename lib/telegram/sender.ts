import { TelegramSendError } from "./types"
import { getTelegramConfig } from "./config"
import type { RetryCallbackData } from "./types"

const TELEGRAM_API_BASE = (token: string) => `https://api.telegram.org/bot${token}`

function ensureEnv(name: string, value?: string | undefined) {
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

/**
 * Send a PDF buffer to Telegram using sendDocument (multipart/form-data).
 * Throws TelegramSendError on failure.
 */
export async function sendPdf(
  token: string,
  chatId: string | number,
  buffer: Buffer,
  filename: string,
  caption?: string,
): Promise<{ method: "fetch" | "curl"; messageId?: number | string; raw?: any }> {
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (buffer.length > maxSize) {
    throw new TelegramSendError("PDF exceeds Telegram 50MB limit", 413, "file_too_large")
  }

  const url = `${TELEGRAM_API_BASE(token)}/sendDocument`

  // Build FormData. Node / Vercel supports global FormData + Blob in modern runtimes.
  const form = new FormData()
  form.append("chat_id", String(chatId))
  if (caption) form.append("caption", caption)
  // append file; third arg sets filename
  // `Blob` works with Buffer/Uint8Array
  // @ts-expect-error Node/Fetch Blob typing may differ between runtimes
  form.append("document", new Blob([buffer]), filename)

    try {
      const res = await fetch(url, { method: "POST", body: form })
      const json = await res.json().catch(() => ({}))

      if (res.ok && json && json.ok) {
        return { method: "fetch", messageId: json?.result?.message_id, raw: json }
      }

      // Non-OK response; attempt curl fallback synchronously
      const description = json?.description || res.statusText
      try {
  const parsed = await sendPdfWithCurl(token, chatId, buffer as unknown as Buffer, filename, caption)
  const mid = parsed?.result?.message_id ?? parsed?.message_id
  return { method: "curl", messageId: mid, raw: parsed }
      } catch (e) {
        throw new TelegramSendError(`Failed to send document to Telegram (fetch: ${description}; curl: ${String(e)})`, res.status, description)
      }
    } catch (fetchErr) {
      // Fetch errored (timeout, DNS, etc.). Try curl fallback synchronously.
      try {
  const parsed = await sendPdfWithCurl(token, chatId, buffer as unknown as Buffer, filename, caption)
  const mid = parsed?.result?.message_id ?? parsed?.message_id
  return { method: "curl", messageId: mid, raw: parsed }
      } catch (curlErr) {
        throw new TelegramSendError(`Failed to send document to Telegram (fetch error: ${String(fetchErr)}; curl error: ${String(curlErr)})`, 502, String(fetchErr))
      }
    }
}

// Fallback implementation using system 'curl' (reads file from stdin) for environments where fetch fails
async function sendPdfWithCurl(botToken: string, chatId: string | number, buffer: Buffer, filename: string, caption?: string) {
  const { spawn } = await import('child_process')
  const url = `https://api.telegram.org/bot${botToken}/sendDocument`
  const args = ['-sS', '-X', 'POST', url, '-F', `chat_id=${chatId}`, '-F', `document=@-;filename=${filename}`]
  if (caption) args.push('-F', `caption=${caption}`)

  return new Promise<any>((resolve, reject) => {
    const curl = spawn('curl', args)
    let stderr = ''
    let stdout = ''
    curl.stderr.on('data', (d) => { stderr += d.toString() })
    curl.stdout.on('data', (d) => { stdout += d.toString() })
    curl.on('error', (err) => reject(new TelegramSendError('curl spawn failed: ' + String(err))))
    curl.on('close', (code) => {
      if (code !== 0) return reject(new TelegramSendError('curl exited with code ' + code + ': ' + stderr))
      try {
        const parsed = JSON.parse(stdout)
        return resolve(parsed)
      } catch (e) {
        return resolve({ ok: true, raw: stdout })
      }
    })
    // pipe the buffer to curl stdin
    curl.stdin.write(buffer)
    curl.stdin.end()
  })
}

/**
 * Send failure alert with an inline 'Retry Send' button. Callback will be `retry:YYYY-MM-DD`.
 */
export async function sendFailureAlert(token: string, chatId: string | number, dateIso: string): Promise<void> {
  const url = `${TELEGRAM_API_BASE(token)}/sendMessage`
  const body = {
    chat_id: chatId,
    text: `Daily report failed to send (${dateIso}).`,
    reply_markup: {
      inline_keyboard: [[{ text: "Retry Send", callback_data: `retry:${dateIso}` }]],
    },
  }

  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !(json && json.ok)) {
    const description = json?.description || res.statusText
    throw new TelegramSendError("Failed to send failure alert to Telegram", res.status, description)
  }
}

/** helper to answer callback queries */
export async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string): Promise<void> {
  const url = `${TELEGRAM_API_BASE(ensureEnv("TELEGRAM_BOT_TOKEN", token))}/answerCallbackQuery`
  const body = { callback_query_id: callbackQueryId, text: text || "" }
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !(json && json.ok)) {
    const description = json?.description || res.statusText
    throw new TelegramSendError("Failed to answer callback query", res.status, description)
  }
}

/** Fetch the bot's getMe info, with curl fallback for environments where fetch fails */
export async function getBotInfo(token: string): Promise<any> {
  const url = `${TELEGRAM_API_BASE(token)}/getMe`
  try {
    const res = await fetch(url)
    const json = await res.json().catch(() => ({}))
    if (res.ok && json && json.ok) return json
    // Non-OK: try curl
    const parsed = await sendGetWithCurl(url)
    return parsed
  } catch (e) {
    // Fetch failed (timeout) -> try curl
    try {
      const parsed = await sendGetWithCurl(url)
      return parsed
    } catch (ce) {
      throw new Error(`Failed to get bot info: ${String(e)}; curl: ${String(ce)}`)
    }
  }
}

async function sendGetWithCurl(url: string) {
  const { spawn } = await import('child_process')
  return new Promise<any>((resolve, reject) => {
    const curl = spawn('curl', ['-sS', url])
    let stdout = ''
    let stderr = ''
    curl.stdout.on('data', (d) => { stdout += d.toString() })
    curl.stderr.on('data', (d) => { stderr += d.toString() })
    curl.on('error', (err) => reject(err))
    curl.on('close', (code) => {
      if (code !== 0) return reject(new Error('curl exit ' + code + ': ' + stderr))
      try {
        const parsed = JSON.parse(stdout)
        return resolve(parsed)
      } catch (e) {
        return reject(e)
      }
    })
  })
}

export {}
