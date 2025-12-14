export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface TimeBlock {
  id: string
  userId: string
  title: string
  description?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  category: "work" | "personal" | "health" | "learning" | "social" | "other"
  color: string
  completed: boolean
  repeatDaily?: boolean
  createdAt: string
}

export interface UserPreferences {
  userId: string
  theme: "light" | "dark" | "auto"
  weekStartDay: 0 | 1 // 0 = Sunday, 1 = Monday
  defaultDayStart: string // HH:mm
  defaultDayEnd: string // HH:mm
  notifications: boolean
}

export interface DayStats {
  date: string
  totalBlocks: number
  completedBlocks: number
  totalMinutes: number
  completedMinutes: number
  categories: Record<string, number>
}

export interface DefaultTemplate {
  id: string
  userId: string
  name: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  blocks: Omit<TimeBlock, "id" | "userId" | "date" | "createdAt" | "completed">[]
  createdAt: string
}
