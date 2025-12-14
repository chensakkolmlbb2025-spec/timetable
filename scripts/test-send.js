#!/usr/bin/env node
/* Test sending a PDF for EXPORT_DEFAULT_USER_ID on today's date (UTC+7) */
const { createClient } = require('@supabase/supabase-js')
const { jsPDF } = require('jspdf')
const fetch = global.fetch || require('node-fetch')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const userId = process.env.EXPORT_DEFAULT_USER_ID
  if (!url || !key || !userId) {
    console.error('Missing env vars')
    process.exit(1)
  }
  const supabase = createClient(url, key)

  const now = new Date()
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const yyyy = shifted.getUTCFullYear()
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(shifted.getUTCDate()).padStart(2, '0')
  const date = `${yyyy}-${mm}-${dd}`

  console.log('Checking blocks for', userId, 'date', date)
  const { data: rows, error } = await supabase.from('time_blocks').select('*').eq('user_id', userId).eq('date', date)
  if (error) {
    console.error('DB error', error)
    process.exit(1)
  }
  if (!rows || rows.length === 0) {
    console.log('No blocks', rows)
    process.exit(0)
  }

  const blocks = rows.map((d) => ({
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

  const profileRes = await supabase.from('profiles').select('name').eq('id', userId).single()
  const userName = profileRes.data?.name || 'User'

  console.log('Generating simple test PDF...')
  const doc = new jsPDF()
  doc.setFontSize(12)
  doc.text(`Daily Plan — ${date}`, 15, 15)
  doc.text(`User: ${userName}`, 15, 24)
  doc.text(`Blocks: ${blocks.length}`, 15, 32)
  let y = 44
  for (const b of blocks) {
    doc.setFontSize(10)
    doc.text(`- ${b.start_time || b.startTime} ${b.title}`, 15, y)
    y += 7
  }
  const arrayBuffer = doc.output('arraybuffer')
  const buffer = Buffer.from(arrayBuffer)

  const botToken = process.env.LIP_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.LIP_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID
  console.log('Got botToken?', !!botToken, 'chatId', chatId)

  try {
    // Build multipart/form-data body manually
    const boundary = '----nodeformboundary' + Math.random().toString(16).slice(2)
    const CRLF = '\r\n'
    const parts = []
    parts.push(Buffer.from(`--${boundary}${CRLF}`))
    parts.push(Buffer.from(`Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}`))
    parts.push(Buffer.from(String(botToken ? chatId : chatId)))
    parts.push(Buffer.from(CRLF))

    parts.push(Buffer.from(`--${boundary}${CRLF}`))
    parts.push(Buffer.from(`Content-Disposition: form-data; name="document"; filename="daily-plan-${date}.pdf"${CRLF}`))
    parts.push(Buffer.from(`Content-Type: application/pdf${CRLF}${CRLF}`))
    parts.push(Buffer.from(buffer))
    parts.push(Buffer.from(CRLF))
    parts.push(Buffer.from(`--${boundary}--${CRLF}`))

    const body = Buffer.concat(parts)
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': String(body.length) }, body })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        console.error('Telegram send failed', res.status, json)
        process.exit(1)
      }
      console.log('Send succeeded', json.result && json.result.message_id)
    } catch (e) {
      console.error('fetch failed, falling back to curl:', e)
      // fallback to curl
      const { spawn } = require('child_process')
      await new Promise((resolve, reject) => {
        const curl = spawn('curl', ['-sS', '-X', 'POST', url, '-F', `chat_id=${chatId}`, '-F', `document=@-;filename=daily-plan-${date}.pdf`])
        let stderr = ''
        curl.stderr.on('data', (d) => { stderr += d.toString() })
        curl.on('error', (err) => reject(err))
        curl.on('close', (code) => {
          if (code !== 0) return reject(new Error('curl exit ' + code + ': ' + stderr))
          return resolve()
        })
        curl.stdin.write(buffer)
        curl.stdin.end()
      }).then(() => console.log('curl send succeeded')).catch((err) => { console.error('curl send failed', err); process.exit(1) })
    }
  } catch (e) {
    console.error('Send failed error:', e)
    if (e instanceof Error) console.error(e.stack)
    process.exit(1)
  }
}

main().catch((e) => { console.error('Fatal error', e); process.exit(1) })
