export function getTelegramConfig() {
  // Prefer namespaced env vars for project @lip/telegram, fall back to legacy names
  const botToken = process.env.LIP_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.LIP_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return { botToken: botToken ?? null, chatId: chatId ?? null }
  }

  return { botToken, chatId }
}

export {}
