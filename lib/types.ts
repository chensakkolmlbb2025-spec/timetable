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
  repeatDays?: number[] // Array of day indices: 0=Sunday, 1=Monday, ..., 6=Saturday
  createdAt: string
}

// Day of week constants for repeatDays
export const DAYS_OF_WEEK = [
  { index: 0, short: "Sun", full: "Sunday" },
  { index: 1, short: "Mon", full: "Monday" },
  { index: 2, short: "Tue", full: "Tuesday" },
  { index: 3, short: "Wed", full: "Wednesday" },
  { index: 4, short: "Thu", full: "Thursday" },
  { index: 5, short: "Fri", full: "Friday" },
  { index: 6, short: "Sat", full: "Saturday" },
] as const

export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

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
