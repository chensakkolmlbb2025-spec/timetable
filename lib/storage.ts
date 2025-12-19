import type { TimeBlock, UserPreferences, DayStats, DefaultTemplate } from "./types"
import { createClient as createBrowserClient } from "./supabase/client"

function ensureError(e: unknown): Error {
  if (!e) return new Error("Unknown error")
  if (e instanceof Error) return e
  try {
    if (typeof e === "string") return new Error(e)
    // Prefer explicit message property if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyE = e as any
    const msg = anyE?.message ?? JSON.stringify(anyE)
    return new Error(msg)
  } catch {
    return new Error(String(e))
  }
}

const BLOCKS_KEY = "timetable_blocks"
const PREFERENCES_KEY = "timetable_preferences"
const TEMPLATES_KEY = "timetable_templates"

// Time Blocks
export async function getTimeBlocks(userId: string): Promise<TimeBlock[]> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("time_blocks").select("*").eq("user_id", userId)
    if (error || !data) return []
    return data.map((d: any) => {
      // Ensure repeatDays is an array or undefined
      const repeatDays = d.repeat_days && Array.isArray(d.repeat_days) && d.repeat_days.length > 0
        ? d.repeat_days
        : undefined
      
      return {
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
        repeatDays,
        createdAt: d.created_at,
      }
    })
  }

  if (typeof window === "undefined") return []

  const data = localStorage.getItem(BLOCKS_KEY)
  if (!data) return []

  try {
    const allBlocks: TimeBlock[] = JSON.parse(data)
    return allBlocks.filter((block) => block.userId === userId)
  } catch {
    return []
  }
}

/**
 * Helper function to get the day of week (0-6) from a date string
 */
function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00")
  return date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

/**
 * Check if a block should appear on a specific date based on its repeat settings
 */
function shouldBlockAppearOnDate(block: TimeBlock, dateStr: string): boolean {
  // If it's a regular block with exact date match
  if (block.date === dateStr) return true
  
  // If it repeats daily
  if (block.repeatDaily) return true
  
  // If it repeats on specific days of the week
  if (block.repeatDays && block.repeatDays.length > 0) {
    const dayOfWeek = getDayOfWeek(dateStr)
    return block.repeatDays.includes(dayOfWeek)
  }
  
  return false
}

/**
 * Get all time blocks for a specific date, auto-creating instances of repeating blocks if needed.
 * This ensures that repeat_daily and repeat_days blocks appear on appropriate days without manual duplication.
 */
export async function getTimeBlocksForDate(userId: string, dateStr: string): Promise<TimeBlock[]> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    
    // Get all blocks for the user (both repeating and regular blocks)
    const { data, error } = await supabase.from("time_blocks").select("*").eq("user_id", userId)
    if (error || !data) return []
    
    const allBlocks: TimeBlock[] = data.map((d: any) => {
      // Ensure repeatDays is an array or undefined
      const repeatDays = d.repeat_days && Array.isArray(d.repeat_days) && d.repeat_days.length > 0
        ? d.repeat_days
        : undefined
      
      return {
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
        repeatDays,
        createdAt: d.created_at,
      }
    })
    
    const result: TimeBlock[] = []
    const addedIds = new Set<string>()
    
    // First, add all blocks with exact date match
    for (const block of allBlocks) {
      if (block.date === dateStr) {
        result.push(block)
        addedIds.add(block.id)
      }
    }
    
    // Then, add instances of repeating blocks (daily or specific days)
    for (const block of allBlocks) {
      // Skip if already added via exact date match
      if (addedIds.has(block.id)) continue
      
      // Check if this block should appear on this date
      const isRepeating = block.repeatDaily || (block.repeatDays && block.repeatDays.length > 0)
      if (isRepeating && shouldBlockAppearOnDate(block, dateStr)) {
        // Create an instance of the repeat block for this date
        result.push({
          ...block,
          date: dateStr,
          completed: false, // reset completed status for new day
          id: `${block.id}-${dateStr}`, // unique id per date to avoid conflicts
        })
      }
    }
    
    return result
  }

  // Fallback for server-side or when Supabase is not available
  const data = localStorage.getItem(BLOCKS_KEY)
  if (!data) return []

  try {
    const allBlocks: TimeBlock[] = JSON.parse(data)
    const userBlocks = allBlocks.filter((block) => block.userId === userId)
    
    const result: TimeBlock[] = []
    const addedIds = new Set<string>()
    
    // First, add blocks with exact date match
    for (const block of userBlocks) {
      if (block.date === dateStr) {
        result.push(block)
        addedIds.add(block.id)
      }
    }
    
    // Then, add instances of repeating blocks
    for (const block of userBlocks) {
      if (addedIds.has(block.id)) continue
      
      const isRepeating = block.repeatDaily || (block.repeatDays && block.repeatDays.length > 0)
      if (isRepeating && shouldBlockAppearOnDate(block, dateStr)) {
        result.push({
          ...block,
          date: dateStr,
          completed: false,
          id: `${block.id}-${dateStr}`,
        })
      }
    }
    
    return result
  } catch {
    return []
  }
}

/**
 * Server-side helper to fetch blocks for a specific date, including repeating instances.
 * Used by cron and API endpoints. Requires passing a Supabase admin client.
 */
export async function getTimeBlocksForDateFromAdmin(
  adminClient: any,
  userId: string,
  dateStr: string
): Promise<TimeBlock[]> {
  // Get all blocks for the user
  const { data, error } = await adminClient.from("time_blocks").select("*").eq("user_id", userId)
  if (error || !data) return []

  const allBlocks: TimeBlock[] = (data as any[]).map((d: any) => {
    // Ensure repeatDays is an array or undefined
    const repeatDays = d.repeat_days && Array.isArray(d.repeat_days) && d.repeat_days.length > 0
      ? d.repeat_days
      : undefined
    
    return {
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
      repeatDays,
      createdAt: d.created_at,
    }
  })

  const result: TimeBlock[] = []
  const addedIds = new Set<string>()

  // First, add all blocks with exact date match
  for (const block of allBlocks) {
    if (block.date === dateStr) {
      result.push(block)
      addedIds.add(block.id)
    }
  }

  // Then, add instances of repeating blocks
  for (const block of allBlocks) {
    if (addedIds.has(block.id)) continue
    
    const isRepeating = block.repeatDaily || (block.repeatDays && block.repeatDays.length > 0)
    if (isRepeating && shouldBlockAppearOnDate(block, dateStr)) {
      result.push({
        ...block,
        date: dateStr,
        completed: false,
        id: `${block.id}-${dateStr}`,
      })
    }
  }

  return result
}

export async function saveTimeBlock(block: TimeBlock): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    // upsert into supabase: map fields to snake_case
    
    // Ensure repeatDays is properly formatted as array or null
    let repeatDaysValue = null
    if (block.repeatDays && Array.isArray(block.repeatDays) && block.repeatDays.length > 0) {
      // Make sure all values are valid integers 0-6
      repeatDaysValue = block.repeatDays.filter(d => typeof d === 'number' && d >= 0 && d <= 6)
      if (repeatDaysValue.length === 0) repeatDaysValue = null
    }
    
    const dbRow = {
      id: block.id,
      user_id: block.userId,
      title: block.title,
      description: block.description ?? null,
      date: block.date,
      start_time: block.startTime,
      end_time: block.endTime,
      category: block.category,
      color: block.color,
      completed: block.completed,
      repeat_daily: !!block.repeatDaily,
      repeat_days: repeatDaysValue,
      created_at: block.createdAt,
    }
    
    console.log('[saveTimeBlock] Saving block:', { id: block.id, repeatDaily: dbRow.repeat_daily, repeatDays: dbRow.repeat_days })
    
    const { error } = await supabase.from("time_blocks").upsert(dbRow)
    if (error) {
      console.error('[saveTimeBlock] Error:', error)
      throw ensureError(error)
    }
    return
  }

  const data = localStorage.getItem(BLOCKS_KEY)
  const allBlocks: TimeBlock[] = data ? JSON.parse(data) : []

  const existingIndex = allBlocks.findIndex((b) => b.id === block.id)
  if (existingIndex >= 0) {
    allBlocks[existingIndex] = block
  } else {
    allBlocks.push(block)
  }

  localStorage.setItem(BLOCKS_KEY, JSON.stringify(allBlocks))
}

// Backwards-compatible alias for saving/updating a time block
export async function updateTimeBlock(block: TimeBlock): Promise<void> {
  return saveTimeBlock(block)
}

export async function deleteTimeBlock(blockId: string): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("time_blocks").delete().eq("id", blockId)
    if (error) throw ensureError(error)
    return
  }
  const data = localStorage.getItem(BLOCKS_KEY)
  if (!data) return

  const allBlocks: TimeBlock[] = JSON.parse(data)
  const filtered = allBlocks.filter((b) => b.id !== blockId)
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(filtered))
}

// Preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
  const { data, error } = await supabase.from("preferences").select("*").eq("user_id", userId).single()
  if (error || !data) return getDefaultPreferences(userId)
    return {
      userId: data.user_id,
      theme: data.theme,
      weekStartDay: data.week_start_day,
      defaultDayStart: data.default_day_start,
      defaultDayEnd: data.default_day_end,
      notifications: data.notifications,
    }
  }

  const data = localStorage.getItem(PREFERENCES_KEY)
  if (!data) return getDefaultPreferences(userId)

  try {
    const allPrefs: UserPreferences[] = JSON.parse(data)
    const userPrefs = allPrefs.find((p) => p.userId === userId)
    return userPrefs || getDefaultPreferences(userId)
  } catch {
    return getDefaultPreferences(userId)
  }
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const dbRow = {
      user_id: prefs.userId,
      theme: prefs.theme,
      week_start_day: prefs.weekStartDay,
      default_day_start: prefs.defaultDayStart,
      default_day_end: prefs.defaultDayEnd,
      notifications: prefs.notifications,
    }
    const { error } = await supabase.from("preferences").upsert(dbRow)
    if (error) {
      // If RLS prevents client-side upsert, fall back to a secure server-side admin endpoint
      const msg = String(error.message || error)
      if (msg.toLowerCase().includes('row-level') || msg.toLowerCase().includes('row level') || msg.toLowerCase().includes('violates row-level')) {
        try {
          // Get current session access token to prove the user identity to the server endpoint
          // Handle multiple possible response shapes from supabase auth client and fail fast if missing.
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            throw new Error(`Unable to retrieve session: ${sessionError.message || String(sessionError)}`)
          }

          // sessionData may be either { session: { access_token } } (older/newer shapes) or the session object
          // Normalize by trying a few common locations.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sd: any = sessionData ?? {}
          const accessToken = sd?.session?.access_token || sd?.access_token || sd?.accessToken || ''

          if (!accessToken) {
            // Fail early with a helpful message instead of calling the server with an empty token
            throw new Error('No active session found. Please sign in or reload the page so your session is available.')
          }

          const res = await fetch('/api/preferences/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-supabase-access-token': accessToken },
            body: JSON.stringify(dbRow),
          })
          if (!res.ok) {
            const j = await res.json().catch(() => ({}))
            throw new Error(`Server upsert failed: ${j?.error || res.statusText}`)
          }
          return
        } catch (e) {
          throw ensureError(e)
        }
      }
      throw ensureError(error)
    }
    return
  }

  const data = localStorage.getItem(PREFERENCES_KEY)
  const allPrefs: UserPreferences[] = data ? JSON.parse(data) : []

  const existingIndex = allPrefs.findIndex((p) => p.userId === prefs.userId)
  if (existingIndex >= 0) {
    allPrefs[existingIndex] = prefs
  } else {
    allPrefs.push(prefs)
  }

  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allPrefs))
}

function getDefaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: "auto",
    weekStartDay: 1,
    defaultDayStart: "06:00",
    defaultDayEnd: "22:00",
    notifications: true,
  }
}

// Templates
export async function getDefaultTemplates(userId: string): Promise<DefaultTemplate[]> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("default_templates").select("*").eq("user_id", userId)
    if (error || !data) return []
    return (
      (data as any[]) || []
    ).map((t) => ({ id: t.id, userId: t.user_id, name: t.name, dayOfWeek: t.day_of_week, blocks: t.blocks, createdAt: t.created_at }))
  }

  if (typeof window === "undefined") return []

  const data = localStorage.getItem(TEMPLATES_KEY)
  if (!data) return []

  try {
    const allTemplates: DefaultTemplate[] = JSON.parse(data)
    return allTemplates.filter((template) => template.userId === userId)
  } catch {
    return []
  }
}

export async function saveDefaultTemplate(template: DefaultTemplate): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const dbRow = {
      id: template.id,
      user_id: template.userId,
      name: template.name,
      day_of_week: template.dayOfWeek,
      blocks: template.blocks,
      created_at: template.createdAt,
    }
    const { error } = await supabase.from("default_templates").upsert(dbRow)
    if (error) throw ensureError(error)
    return
  }

  const data = localStorage.getItem(TEMPLATES_KEY)
  const allTemplates: DefaultTemplate[] = data ? JSON.parse(data) : []

  const existingIndex = allTemplates.findIndex((t) => t.id === template.id)
  if (existingIndex >= 0) {
    allTemplates[existingIndex] = template
  } else {
    allTemplates.push(template)
  }

  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(allTemplates))
}

export async function deleteDefaultTemplate(templateId: string): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const { error } = await supabase.from("default_templates").delete().eq("id", templateId)
    if (error) throw ensureError(error)
    return
  }
  const data = localStorage.getItem(TEMPLATES_KEY)
  if (!data) return

  const allTemplates: DefaultTemplate[] = JSON.parse(data)
  const filtered = allTemplates.filter((t) => t.id !== templateId)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered))
}

export async function applyTemplateToWeek(userId: string, startDate: Date): Promise<void> {
  const templates = await getDefaultTemplates(userId)
  const existingBlocks = await getTimeBlocks(userId)

  // Generate blocks for the entire week based on templates
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    const dayOfWeek = currentDate.getDay()
    const dateStr = currentDate.toISOString().split("T")[0]

    // Find template for this day of week
    const template = templates.find((t) => t.dayOfWeek === dayOfWeek)
    if (!template) continue

    // Remove existing blocks for this date to avoid duplicates
    const filteredBlocks = existingBlocks.filter((b) => b.date !== dateStr)

    // Add new blocks from template
  template.blocks.forEach((blockTemplate) => {
      const newBlock: TimeBlock = {
        id: crypto.randomUUID(),
        userId,
        date: dateStr,
        completed: false,
        createdAt: new Date().toISOString(),
        ...blockTemplate,
      }
      filteredBlocks.push(newBlock)
    })

    if (typeof window !== "undefined") {
      const supabase = createBrowserClient()
      // Replace existing blocks for the date
      // Delete existing on the date
      await supabase.from("time_blocks").delete().eq("user_id", userId).eq("date", dateStr)

      // Insert new blocks
      const toInsert = filteredBlocks.map((b) => ({
        id: b.id,
        user_id: b.userId,
        title: b.title,
        description: b.description || null,
        date: b.date,
        start_time: b.startTime,
        end_time: b.endTime,
        category: b.category,
        color: b.color,
        completed: b.completed,
        repeat_daily: !!b.repeatDaily,
        created_at: b.createdAt,
      }))
      if (toInsert.length > 0) {
        await supabase.from("time_blocks").insert(toInsert)
      }
  } else {
      localStorage.setItem(BLOCKS_KEY, JSON.stringify(filteredBlocks))
    }
  }
}

// Analytics
export function calculateDayStats(blocks: TimeBlock[], date: string): DayStats {
  const dayBlocks = blocks.filter((b) => b.date === date)
  const completed = dayBlocks.filter((b) => b.completed)

  const totalMinutes = dayBlocks.reduce((sum, block) => {
    const start = new Date(`2000-01-01T${block.startTime}`)
    const end = new Date(`2000-01-01T${block.endTime}`)
    return sum + (end.getTime() - start.getTime()) / 60000
  }, 0)

  const completedMinutes = completed.reduce((sum, block) => {
    const start = new Date(`2000-01-01T${block.startTime}`)
    const end = new Date(`2000-01-01T${block.endTime}`)
    return sum + (end.getTime() - start.getTime()) / 60000
  }, 0)

  const categories: Record<string, number> = {}
  dayBlocks.forEach((block) => {
    categories[block.category] = (categories[block.category] || 0) + 1
  })

  return {
    date,
    totalBlocks: dayBlocks.length,
    completedBlocks: completed.length,
    totalMinutes,
    completedMinutes,
    categories,
  }
}
