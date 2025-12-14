export class TelegramSendError extends Error {
  public status?: number
  public description?: string

  constructor(message: string, status?: number, description?: string) {
    super(message)
    this.name = "TelegramSendError"
    this.status = status
    this.description = description
  }
}

export type RetryCallbackData = `retry:${string}`

export interface TelegramUpdate {
  update_id: number
  callback_query?: {
    id: string
    from: Record<string, unknown>
    data?: string
    message?: { chat?: { id?: number | string } }
  }
}

export {}
