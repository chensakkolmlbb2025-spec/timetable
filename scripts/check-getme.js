#!/usr/bin/env node
const token = process.env.LIP_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('Missing token env')
  process.exit(1)
}
(async () => {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    console.log('status', res.status)
    const j = await res.json()
    console.log(j)
  } catch (e) {
    console.error('fetch error', e)
    process.exit(1)
  }
})()
