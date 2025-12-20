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
    
    try {
      // ===== VALIDATION =====
      
      // Validate required fields
      if (!block.id || !block.userId || !block.title?.trim()) {
        throw new Error('Invalid block data: missing required fields (id, userId, or title)')
      }
      
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(block.date)) {
        throw new Error(`Invalid date format: ${block.date}. Expected YYYY-MM-DD`)
      }
      
      // Validate time format (HH:mm)
      if (!/^\d{2}:\d{2}$/.test(block.startTime) || !/^\d{2}:\d{2}$/.test(block.endTime)) {
        throw new Error('Invalid time format. Expected HH:mm')
      }
      
      // Validate time range
      if (block.startTime >= block.endTime) {
        throw new Error('End time must be after start time')
      }
      
      // Validate category
      const validCategories = ['work', 'personal', 'health', 'learning', 'social', 'other']
      if (!validCategories.includes(block.category)) {
        throw new Error(`Invalid category: ${block.category}`)
      }
      
      // ===== PREPARE REPEAT_DAYS =====
      
      let repeatDaysValue = null
      if (block.repeatDays && Array.isArray(block.repeatDays) && block.repeatDays.length > 0) {
        // Validate and filter repeatDays: must be integers 0-6
        const validDays = block.repeatDays.filter(d => 
          typeof d === 'number' && 
          Number.isInteger(d) && 
          d >= 0 && 
          d <= 6
        )
        
        if (validDays.length !== block.repeatDays.length) {
          console.warn('[saveTimeBlock] Some repeat days were invalid and filtered out', {
            original: block.repeatDays,
            filtered: validDays
          })
        }
        
        // Remove duplicates and sort
        repeatDaysValue = validDays.length > 0 
          ? [...new Set(validDays)].sort()
          : null
      }
      
      // Ensure mutual exclusivity: if repeatDaily is true, clear repeatDays
      if (block.repeatDaily && repeatDaysValue) {
        console.warn('[saveTimeBlock] Block has both repeatDaily and repeatDays. Clearing repeatDays in favor of repeatDaily')
        repeatDaysValue = null
      }
      
      // ===== BUILD DATABASE ROW =====
      
      const dbRow = {
        id: block.id,
        user_id: block.userId,
        title: block.title.trim(),
        description: block.description?.trim() || null,
        date: block.date,
        start_time: block.startTime,
        end_time: block.endTime,
        category: block.category,
        color: block.color || '',
        completed: !!block.completed,
        repeat_daily: !!block.repeatDaily,
        repeat_days: repeatDaysValue,
        created_at: block.createdAt || new Date().toISOString(),
      }
      
      console.log('[saveTimeBlock] Saving block:', { 
        id: block.id, 
        title: dbRow.title,
        repeatDaily: dbRow.repeat_daily, 
        repeatDays: dbRow.repeat_days,
        date: dbRow.date
      })
      
      // ===== UPSERT TO DATABASE =====
      
      const { data, error } = await supabase
        .from("time_blocks")
        .upsert(dbRow, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
      
      if (error) {
        console.error('[saveTimeBlock] Database error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          blockId: block.id
        })
        throw ensureError(error)
      }
      
      console.log('[saveTimeBlock] Successfully saved block:', block.id)
      return
      
    } catch (error) {
      console.error('[saveTimeBlock] Failed to save block:', {
        error,
        blockId: block.id,
        blockData: {
          title: block.title,
          date: block.date,
          repeatDaily: block.repeatDaily,
          repeatDays: block.repeatDays
        }
      })
      throw ensureError(error)
    }
  }

  // ===== LOCALSTORAGE FALLBACK =====
  
  try {
    const data = localStorage.getItem(BLOCKS_KEY)
    const allBlocks: TimeBlock[] = data ? JSON.parse(data) : []

    const existingIndex = allBlocks.findIndex((b) => b.id === block.id)
    if (existingIndex >= 0) {
      console.log('[saveTimeBlock] Updating existing block in localStorage:', block.id)
      allBlocks[existingIndex] = block
    } else {
      console.log('[saveTimeBlock] Adding new block to localStorage:', block.id)
      allBlocks.push(block)
    }

    localStorage.setItem(BLOCKS_KEY, JSON.stringify(allBlocks))
  } catch (error) {
    console.error('[saveTimeBlock] localStorage error:', error)
    throw new Error('Failed to save block to local storage')
  }
}

// Backwards-compatible alias for saving/updating a time block
export async function updateTimeBlock(block: TimeBlock): Promise<void> {
  console.log('[updateTimeBlock] Delegating to saveTimeBlock:', block.id)
  return saveTimeBlock(block)
}

/**
 * Delete a time block by ID
 * Handles both repeating and one-time blocks
 * @param blockId - The ID of the block to delete
 * @param options - Optional configuration for delete behavior
 */
export async function deleteTimeBlock(
  blockId: string, 
  options?: {
    /** If true, only logs the operation without deleting (dry run) */
    dryRun?: boolean
    /** User ID for additional verification (optional security check) */
    userId?: string
  }
): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    
    try {
      // ===== VALIDATION =====
      
      if (!blockId || typeof blockId !== 'string' || blockId.trim() === '') {
        throw new Error('Invalid blockId: must be a non-empty string')
      }
      
      // Check if block is a virtual instance (contains date suffix)
      const isVirtualInstance = blockId.includes('-202') // Virtual blocks have format: uuid-YYYY-MM-DD
      if (isVirtualInstance) {
        console.warn('[deleteTimeBlock] Attempting to delete virtual instance:', blockId)
        const baseId = blockId.split('-202')[0] // Extract base ID
        console.log('[deleteTimeBlock] Extracted base ID for repeating block:', baseId)
        
        // Optionally, you might want to handle this differently
        // For now, we'll delete the base repeating block
        // In the future, you could add "exception dates" functionality
        throw new Error(
          'Cannot delete virtual instance of repeating block. ' +
          'Please edit the original block or add exception date functionality.'
        )
      }
      
      console.log('[deleteTimeBlock] Deleting block:', { blockId, options })
      
      // Dry run mode - just log without deleting
      if (options?.dryRun) {
        console.log('[deleteTimeBlock] DRY RUN - Would delete block:', blockId)
        return
      }
      
      // ===== FETCH BLOCK BEFORE DELETE (for logging/verification) =====
      
      const { data: existingBlock, error: fetchError } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("id", blockId)
        .maybeSingle()
      
      if (fetchError) {
        console.error('[deleteTimeBlock] Error fetching block before delete:', fetchError)
      }
      
      if (!existingBlock) {
        console.warn('[deleteTimeBlock] Block not found, may have been already deleted:', blockId)
        // Not throwing error - idempotent delete
        return
      }
      
      // Optional: Verify user ownership if userId provided
      if (options?.userId && existingBlock.user_id !== options.userId) {
        throw new Error(
          `Permission denied: Block ${blockId} does not belong to user ${options.userId}`
        )
      }
      
      console.log('[deleteTimeBlock] Found block to delete:', {
        id: existingBlock.id,
        title: existingBlock.title,
        date: existingBlock.date,
        repeatDaily: existingBlock.repeat_daily,
        repeatDays: existingBlock.repeat_days,
        userId: existingBlock.user_id
      })
      
      // ===== DELETE FROM DATABASE =====
      
      const { error: deleteError, count } = await supabase
        .from("time_blocks")
        .delete({ count: 'exact' })
        .eq("id", blockId)
      
      if (deleteError) {
        console.error('[deleteTimeBlock] Database delete error:', {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
          blockId
        })
        throw ensureError(deleteError)
      }
      
      console.log('[deleteTimeBlock] Successfully deleted block:', {
        blockId,
        rowsAffected: count,
        wasRepeating: existingBlock.repeat_daily || (existingBlock.repeat_days && existingBlock.repeat_days.length > 0)
      })
      
      // Verify deletion
      if (count === 0) {
        console.warn('[deleteTimeBlock] No rows were deleted. Block may not exist:', blockId)
      }
      
      return
      
    } catch (error) {
      console.error('[deleteTimeBlock] Failed to delete block:', {
        error,
        blockId,
        options
      })
      throw ensureError(error)
    }
  }
  
  // ===== LOCALSTORAGE FALLBACK =====
  
  try {
    const data = localStorage.getItem(BLOCKS_KEY)
    if (!data) {
      console.warn('[deleteTimeBlock] No blocks in localStorage')
      return
    }

    const allBlocks: TimeBlock[] = JSON.parse(data)
    const initialLength = allBlocks.length
    const filtered = allBlocks.filter((b) => b.id !== blockId)
    
    if (filtered.length === initialLength) {
      console.warn('[deleteTimeBlock] Block not found in localStorage:', blockId)
    } else {
      console.log('[deleteTimeBlock] Deleted block from localStorage:', {
        blockId,
        beforeCount: initialLength,
        afterCount: filtered.length
      })
    }
    
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('[deleteTimeBlock] localStorage error:', error)
    throw new Error('Failed to delete block from local storage')
  }
}

/**
 * Batch delete multiple time blocks
 * More efficient than calling deleteTimeBlock multiple times
 * @param blockIds - Array of block IDs to delete
 * @param userId - Optional user ID for verification
 * @returns Object with success count and failed block IDs
 */
export async function batchDeleteTimeBlocks(
  blockIds: string[],
  userId?: string
): Promise<{ successCount: number; failedIds: string[]; errors: Error[] }> {
  const results = { successCount: 0, failedIds: [] as string[], errors: [] as Error[] }
  
  if (!blockIds || blockIds.length === 0) {
    console.warn('[batchDeleteTimeBlocks] No block IDs provided')
    return results
  }
  
  console.log('[batchDeleteTimeBlocks] Deleting blocks:', { count: blockIds.length, blockIds })
  
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    
    try {
      // Optional: Verify ownership if userId provided
      if (userId) {
        const { data: blocks, error: fetchError } = await supabase
          .from("time_blocks")
          .select("id, user_id")
          .in("id", blockIds)
        
        if (fetchError) {
          throw fetchError
        }
        
        const unauthorizedBlocks = blocks?.filter(b => b.user_id !== userId) || []
        if (unauthorizedBlocks.length > 0) {
          throw new Error(
            `Permission denied: ${unauthorizedBlocks.length} block(s) do not belong to user ${userId}`
          )
        }
      }
      
      // Batch delete
      const { error, count } = await supabase
        .from("time_blocks")
        .delete({ count: 'exact' })
        .in("id", blockIds)
      
      if (error) {
        throw error
      }
      
      results.successCount = count || 0
      console.log('[batchDeleteTimeBlocks] Successfully deleted:', results.successCount)
      
    } catch (error) {
      console.error('[batchDeleteTimeBlocks] Error:', error)
      results.errors.push(ensureError(error))
      results.failedIds = blockIds
    }
  } else {
    // localStorage fallback
    try {
      const data = localStorage.getItem(BLOCKS_KEY)
      if (!data) return results
      
      const allBlocks: TimeBlock[] = JSON.parse(data)
      const idsSet = new Set(blockIds)
      const filtered = allBlocks.filter((b) => !idsSet.has(b.id))
      
      results.successCount = allBlocks.length - filtered.length
      localStorage.setItem(BLOCKS_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('[batchDeleteTimeBlocks] localStorage error:', error)
      results.errors.push(new Error('Failed to batch delete from local storage'))
      results.failedIds = blockIds
    }
  }
  
  return results
}

/**
 * Batch update/save multiple time blocks
 * More efficient than calling saveTimeBlock multiple times
 * @param blocks - Array of blocks to save
 * @returns Object with success count and failed blocks
 */
export async function batchSaveTimeBlocks(
  blocks: TimeBlock[]
): Promise<{ successCount: number; failedBlocks: TimeBlock[]; errors: Error[] }> {
  const results = { successCount: 0, failedBlocks: [] as TimeBlock[], errors: [] as Error[] }
  
  if (!blocks || blocks.length === 0) {
    console.warn('[batchSaveTimeBlocks] No blocks provided')
    return results
  }
  
  console.log('[batchSaveTimeBlocks] Saving blocks:', blocks.length)
  
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    
    try {
      // Validate and prepare all blocks
      const dbRows = blocks.map(block => {
        // Validate
        if (!block.id || !block.userId || !block.title?.trim()) {
          throw new Error(`Invalid block data: ${block.id}`)
        }
        
        // Prepare repeat_days
        let repeatDaysValue = null
        if (block.repeatDays && Array.isArray(block.repeatDays) && block.repeatDays.length > 0) {
          const validDays = block.repeatDays.filter(d => 
            typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6
          )
          repeatDaysValue = validDays.length > 0 ? [...new Set(validDays)].sort() : null
        }
        
        return {
          id: block.id,
          user_id: block.userId,
          title: block.title.trim(),
          description: block.description?.trim() || null,
          date: block.date,
          start_time: block.startTime,
          end_time: block.endTime,
          category: block.category,
          color: block.color || '',
          completed: !!block.completed,
          repeat_daily: !!block.repeatDaily,
          repeat_days: repeatDaysValue,
          created_at: block.createdAt || new Date().toISOString(),
        }
      })
      
      // Batch upsert
      const { error, count } = await supabase
        .from("time_blocks")
        .upsert(dbRows, { onConflict: 'id', count: 'exact' })
      
      if (error) {
        throw error
      }
      
      results.successCount = count || 0
      console.log('[batchSaveTimeBlocks] Successfully saved:', results.successCount)
      
    } catch (error) {
      console.error('[batchSaveTimeBlocks] Error:', error)
      results.errors.push(ensureError(error))
      results.failedBlocks = blocks
    }
  } else {
    // localStorage fallback
    try {
      const data = localStorage.getItem(BLOCKS_KEY)
      const allBlocks: TimeBlock[] = data ? JSON.parse(data) : []
      
      const blockMap = new Map(allBlocks.map(b => [b.id, b]))
      
      blocks.forEach(block => {
        blockMap.set(block.id, block)
      })
      
      const updatedBlocks = Array.from(blockMap.values())
      localStorage.setItem(BLOCKS_KEY, JSON.stringify(updatedBlocks))
      results.successCount = blocks.length
    } catch (error) {
      console.error('[batchSaveTimeBlocks] localStorage error:', error)
      results.errors.push(new Error('Failed to batch save to local storage'))
      results.failedBlocks = blocks
    }
  }
  
  return results
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

/**
 * Update an entire default template with validation
 * @param template - The template to update
 * @returns Updated template
 */
export async function updateDefaultTemplate(template: DefaultTemplate): Promise<DefaultTemplate> {
  // Validate template
  if (!template.id || !template.userId) {
    throw new Error('Template must have id and userId')
  }
  
  if (template.dayOfWeek < 0 || template.dayOfWeek > 6) {
    throw new Error('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)')
  }
  
  // Validate all blocks
  const validatedBlocks = validateTemplateBlocks(template.blocks)
  
  const updatedTemplate = {
    ...template,
    blocks: validatedBlocks,
  }
  
  // Save using existing saveDefaultTemplate
  await saveDefaultTemplate(updatedTemplate)
  
  return updatedTemplate
}

/**
 * Add a new block to a template with validation
 * @param templateId - Template ID
 * @param block - Block to add (without id, userId, date, completed, createdAt)
 * @returns Updated template
 */
export async function addTemplateBlock(
  templateId: string,
  block: Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>
): Promise<DefaultTemplate> {
  const templates = typeof window !== "undefined" 
    ? await (async () => {
        const supabase = createBrowserClient()
        const { data } = await supabase.from("default_templates").select("*").eq("id", templateId)
        return data ? (data as any[]).map((t) => ({
          id: t.id,
          userId: t.user_id,
          name: t.name,
          dayOfWeek: t.day_of_week,
          blocks: t.blocks,
          createdAt: t.created_at,
        })) : []
      })()
    : (() => {
        const data = localStorage.getItem(TEMPLATES_KEY)
        return data ? JSON.parse(data) : []
      })()
  
  const template = templates.find((t: DefaultTemplate) => t.id === templateId)
  if (!template) {
    throw new Error('Template not found')
  }
  
  // Validate the new block
  const validatedBlock = validateSingleBlock(block)
  
  // Check for time overlaps
  checkTimeOverlaps([...template.blocks, validatedBlock])
  
  const updatedTemplate = {
    ...template,
    blocks: [...template.blocks, validatedBlock],
  }
  
  await saveDefaultTemplate(updatedTemplate)
  return updatedTemplate
}

/**
 * Update a specific block within a template
 * @param templateId - Template ID
 * @param blockIndex - Index of block to update
 * @param updates - Partial block updates
 * @returns Updated template
 */
export async function updateTemplateBlock(
  templateId: string,
  blockIndex: number,
  updates: Partial<Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>>
): Promise<DefaultTemplate> {
  const templates = typeof window !== "undefined" 
    ? await (async () => {
        const supabase = createBrowserClient()
        const { data } = await supabase.from("default_templates").select("*").eq("id", templateId)
        return data ? (data as any[]).map((t) => ({
          id: t.id,
          userId: t.user_id,
          name: t.name,
          dayOfWeek: t.day_of_week,
          blocks: t.blocks,
          createdAt: t.created_at,
        })) : []
      })()
    : (() => {
        const data = localStorage.getItem(TEMPLATES_KEY)
        return data ? JSON.parse(data) : []
      })()
  
  const template = templates.find((t: DefaultTemplate) => t.id === templateId)
  if (!template) {
    throw new Error('Template not found')
  }
  
  if (blockIndex < 0 || blockIndex >= template.blocks.length) {
    throw new Error('Invalid block index')
  }
  
  // Merge updates with existing block
  const updatedBlock = {
    ...template.blocks[blockIndex],
    ...updates,
  }
  
  // Validate the updated block
  const validatedBlock = validateSingleBlock(updatedBlock)
  
  // Create new blocks array with updated block
  const newBlocks = [...template.blocks]
  newBlocks[blockIndex] = validatedBlock
  
  // Check for time overlaps
  checkTimeOverlaps(newBlocks)
  
  const updatedTemplate = {
    ...template,
    blocks: newBlocks,
  }
  
  await saveDefaultTemplate(updatedTemplate)
  return updatedTemplate
}

/**
 * Delete a specific block from a template
 * @param templateId - Template ID
 * @param blockIndex - Index of block to delete
 * @returns Updated template
 */
export async function deleteTemplateBlock(
  templateId: string,
  blockIndex: number
): Promise<DefaultTemplate> {
  const templates = typeof window !== "undefined" 
    ? await (async () => {
        const supabase = createBrowserClient()
        const { data } = await supabase.from("default_templates").select("*").eq("id", templateId)
        return data ? (data as any[]).map((t) => ({
          id: t.id,
          userId: t.user_id,
          name: t.name,
          dayOfWeek: t.day_of_week,
          blocks: t.blocks,
          createdAt: t.created_at,
        })) : []
      })()
    : (() => {
        const data = localStorage.getItem(TEMPLATES_KEY)
        return data ? JSON.parse(data) : []
      })()
  
  const template = templates.find((t: DefaultTemplate) => t.id === templateId)
  if (!template) {
    throw new Error('Template not found')
  }
  
  if (blockIndex < 0 || blockIndex >= template.blocks.length) {
    throw new Error('Invalid block index')
  }
  
  const newBlocks = template.blocks.filter((_block: any, idx: number) => idx !== blockIndex)
  
  const updatedTemplate = {
    ...template,
    blocks: newBlocks,
  }
  
  await saveDefaultTemplate(updatedTemplate)
  return updatedTemplate
}

/**
 * Reorder blocks within a template (for drag-and-drop)
 * @param templateId - Template ID
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 * @returns Updated template
 */
export async function reorderTemplateBlocks(
  templateId: string,
  fromIndex: number,
  toIndex: number
): Promise<DefaultTemplate> {
  const templates = typeof window !== "undefined" 
    ? await (async () => {
        const supabase = createBrowserClient()
        const { data } = await supabase.from("default_templates").select("*").eq("id", templateId)
        return data ? (data as any[]).map((t) => ({
          id: t.id,
          userId: t.user_id,
          name: t.name,
          dayOfWeek: t.day_of_week,
          blocks: t.blocks,
          createdAt: t.created_at,
        })) : []
      })()
    : (() => {
        const data = localStorage.getItem(TEMPLATES_KEY)
        return data ? JSON.parse(data) : []
      })()
  
  const template = templates.find((t: DefaultTemplate) => t.id === templateId)
  if (!template) {
    throw new Error('Template not found')
  }
  
  if (fromIndex < 0 || fromIndex >= template.blocks.length ||
      toIndex < 0 || toIndex >= template.blocks.length) {
    throw new Error('Invalid indices')
  }
  
  const newBlocks = [...template.blocks]
  const [movedBlock] = newBlocks.splice(fromIndex, 1)
  newBlocks.splice(toIndex, 0, movedBlock)
  
  const updatedTemplate = {
    ...template,
    blocks: newBlocks,
  }
  
  await saveDefaultTemplate(updatedTemplate)
  return updatedTemplate
}

/**
 * Duplicate a template to another day of week
 * @param templateId - Source template ID
 * @param targetDayOfWeek - Target day (0-6)
 * @param userId - User ID
 * @returns New template
 */
export async function duplicateTemplate(
  templateId: string,
  targetDayOfWeek: number,
  userId: string
): Promise<DefaultTemplate> {
  const templates = await getDefaultTemplates(userId)
  const sourceTemplate = templates.find(t => t.id === templateId)
  
  if (!sourceTemplate) {
    throw new Error('Source template not found')
  }
  
  if (targetDayOfWeek < 0 || targetDayOfWeek > 6) {
    throw new Error('Invalid target day of week')
  }
  
  // Check if target day already has a template
  const existingTarget = templates.find(t => t.dayOfWeek === targetDayOfWeek)
  
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  const newTemplate: DefaultTemplate = {
    id: existingTarget?.id || crypto.randomUUID(),
    userId,
    name: DAY_NAMES[targetDayOfWeek],
    dayOfWeek: targetDayOfWeek,
    blocks: sourceTemplate.blocks.map(block => ({ ...block })), // Deep copy
    createdAt: new Date().toISOString(),
  }
  
  await saveDefaultTemplate(newTemplate)
  return newTemplate
}

/**
 * Validate a single block
 */
function validateSingleBlock(
  block: Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>
): Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'> {
  // Validate title
  if (!block.title || block.title.trim().length === 0) {
    throw new Error('Block title is required')
  }
  
  if (block.title.length > 200) {
    throw new Error('Block title must be 200 characters or less')
  }
  
  // Validate times
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(block.startTime)) {
    throw new Error('Invalid start time format. Use HH:mm (24-hour format)')
  }
  
  if (!timeRegex.test(block.endTime)) {
    throw new Error('Invalid end time format. Use HH:mm (24-hour format)')
  }
  
  // Validate end time is after start time
  const startMinutes = timeToMinutes(block.startTime)
  const endMinutes = timeToMinutes(block.endTime)
  
  if (endMinutes <= startMinutes) {
    throw new Error('End time must be after start time')
  }
  
  // Validate category
  const validCategories = ['work', 'personal', 'health', 'learning', 'social', 'other']
  if (!validCategories.includes(block.category)) {
    throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`)
  }
  
  // Validate description length
  if (block.description && block.description.length > 500) {
    throw new Error('Block description must be 500 characters or less')
  }
  
  return {
    ...block,
    title: block.title.trim(),
    description: block.description?.trim() || undefined,
  }
}

/**
 * Validate array of blocks (check for overlaps)
 */
function validateTemplateBlocks(
  blocks: Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>[]
): Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>[] {
  const validatedBlocks = blocks.map(block => validateSingleBlock(block))
  checkTimeOverlaps(validatedBlocks)
  return validatedBlocks
}

/**
 * Check for time overlaps in blocks
 */
function checkTimeOverlaps(
  blocks: Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>[]
): void {
  const sortedBlocks = [...blocks].sort((a, b) => 
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )
  
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    const current = sortedBlocks[i]
    const next = sortedBlocks[i + 1]
    
    const currentEnd = timeToMinutes(current.endTime)
    const nextStart = timeToMinutes(next.startTime)
    
    if (currentEnd > nextStart) {
      throw new Error(
        `Time overlap detected: "${current.title}" (${current.startTime}-${current.endTime}) ` +
        `overlaps with "${next.title}" (${next.startTime}-${next.endTime})`
      )
    }
  }
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export async function applyTemplateToWeek(userId: string, startDate: Date): Promise<void> {
  const templates = await getDefaultTemplates(userId)
  
  if (templates.length === 0) {
    console.log('[applyTemplateToWeek] No templates found for user')
    return
  }

  console.log(`[applyTemplateToWeek] Found ${templates.length} templates, applying to week starting ${startDate.toISOString().split('T')[0]}`)

  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    
    // Get all blocks for the user to identify which ones to delete
    const { data: allUserBlocks } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("user_id", userId)
    
    const allBlocks = allUserBlocks || []
    
    // Process each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dayOfWeek = currentDate.getDay()
      const dateStr = currentDate.toISOString().split("T")[0]

      // Find template for this day of week
      const template = templates.find((t) => t.dayOfWeek === dayOfWeek)
      
      if (!template || !template.blocks || template.blocks.length === 0) {
        console.log(`[applyTemplateToWeek] No template for ${dayOfWeek} (${dateStr}), skipping`)
        continue
      }

      console.log(`[applyTemplateToWeek] Applying template for ${dayOfWeek} (${dateStr}) with ${template.blocks.length} blocks`)

      // Find ALL blocks that would appear on this date (including repeating ones)
      const blocksToDelete: string[] = []
      
      for (const block of allBlocks) {
        // Block with exact date match
        if (block.date === dateStr) {
          blocksToDelete.push(block.id)
          continue
        }
        
        // Repeating daily blocks
        if (block.repeat_daily) {
          blocksToDelete.push(block.id)
          continue
        }
        
        // Blocks that repeat on this day of week
        if (block.repeat_days && Array.isArray(block.repeat_days) && block.repeat_days.includes(dayOfWeek)) {
          blocksToDelete.push(block.id)
          continue
        }
      }
      
      // Delete all identified blocks
      if (blocksToDelete.length > 0) {
        console.log(`[applyTemplateToWeek] Deleting ${blocksToDelete.length} blocks for ${dateStr} (including repeating blocks)`)
        const { error: deleteError } = await supabase
          .from("time_blocks")
          .delete()
          .in("id", blocksToDelete)
        
        if (deleteError) {
          console.error(`[applyTemplateToWeek] Error deleting blocks for ${dateStr}:`, deleteError)
          continue
        }
      }

      // Create new blocks from template
      const newBlocks = template.blocks.map((blockTemplate) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        title: blockTemplate.title,
        description: blockTemplate.description || null,
        date: dateStr,
        start_time: blockTemplate.startTime,
        end_time: blockTemplate.endTime,
        category: blockTemplate.category,
        color: blockTemplate.color || '#3B82F6',
        completed: false,
        repeat_daily: false, // Don't set as repeating when applying templates
        repeat_days: null,   // Templates create specific date instances
        created_at: new Date().toISOString(),
      }))

      // Insert new blocks
      const { error: insertError } = await supabase
        .from("time_blocks")
        .insert(newBlocks)
      
      if (insertError) {
        console.error(`[applyTemplateToWeek] Error inserting blocks for ${dateStr}:`, insertError)
      } else {
        console.log(`[applyTemplateToWeek] Successfully created ${newBlocks.length} blocks for ${dateStr}`)
      }
    }
  } else {
    // LocalStorage fallback
    const data = localStorage.getItem(BLOCKS_KEY)
    let allBlocks: TimeBlock[] = data ? JSON.parse(data) : []
    
    // Process each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dayOfWeek = currentDate.getDay()
      const dateStr = currentDate.toISOString().split("T")[0]

      // Find template for this day of week
      const template = templates.find((t) => t.dayOfWeek === dayOfWeek)
      
      if (!template || !template.blocks || template.blocks.length === 0) {
        continue
      }
      
      // Remove ALL blocks that would appear on this date
      allBlocks = allBlocks.filter((b) => {
        // Keep block if it doesn't appear on this date
        if (b.date === dateStr) return false
        if (b.repeatDaily) return false
        if (b.repeatDays && b.repeatDays.includes(dayOfWeek)) return false
        return true
      })
      
      // Add new blocks from template
      template.blocks.forEach((blockTemplate) => {
        const newBlock: TimeBlock = {
          id: crypto.randomUUID(),
          userId,
          date: dateStr,
          completed: false,
          createdAt: new Date().toISOString(),
          ...blockTemplate,
          repeatDaily: false, // Don't set as repeating
          repeatDays: undefined,
        }
        allBlocks.push(newBlock)
      })
    }
    
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(allBlocks))
  }
  
  console.log('[applyTemplateToWeek] Finished applying templates to week')
}

/**
 * Clear all tasks for a specific day
 * Removes ALL time blocks that appear on the specified date, including:
 * - Blocks with exact date match
 * - Blocks with repeat_daily = true
 * - Blocks with repeat_days containing the target day of week
 * 
 * @param userId - User ID
 * @param date - Date to clear (Date object or ISO string)
 */
export async function clearAllTasksForDay(
  userId: string,
  date: Date | string
): Promise<void> {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const dayOfWeek = targetDate.getDay()

  console.log(`[clearAllTasksForDay] Clearing all tasks for ${dateStr} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]})`)

  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()

    // First, fetch all user's blocks to identify which ones appear on this date
    const { data: allBlocks, error: fetchError } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("user_id", userId)

    if (fetchError) {
      console.error('[clearAllTasksForDay] Error fetching blocks:', fetchError)
      throw fetchError
    }

    if (!allBlocks || allBlocks.length === 0) {
      console.log('[clearAllTasksForDay] No blocks found for user')
      return
    }

    // Identify blocks that appear on this date
    const blocksToDelete: string[] = []
    
    allBlocks.forEach((block) => {
      // Block appears on this date if:
      // 1. It has exact date match
      if (block.date === dateStr) {
        blocksToDelete.push(block.id)
        return
      }
      
      // 2. It has repeat_daily = true
      if (block.repeat_daily) {
        blocksToDelete.push(block.id)
        return
      }
      
      // 3. It has repeat_days containing this day of week
      if (block.repeat_days && Array.isArray(block.repeat_days) && block.repeat_days.includes(dayOfWeek)) {
        blocksToDelete.push(block.id)
        return
      }
    })

    if (blocksToDelete.length === 0) {
      console.log('[clearAllTasksForDay] No blocks to delete for this date')
      return
    }

    console.log(`[clearAllTasksForDay] Deleting ${blocksToDelete.length} blocks that appear on ${dateStr}`)

    // Delete all identified blocks
    const { error: deleteError } = await supabase
      .from("time_blocks")
      .delete()
      .in("id", blocksToDelete)

    if (deleteError) {
      console.error('[clearAllTasksForDay] Error deleting blocks:', deleteError)
      throw deleteError
    }

    console.log(`[clearAllTasksForDay] Successfully cleared all tasks for ${dateStr}`)
  } else {
    // LocalStorage fallback
    const data = localStorage.getItem(BLOCKS_KEY)
    let allBlocks: TimeBlock[] = data ? JSON.parse(data) : []

    // Remove all blocks that appear on this date
    const originalCount = allBlocks.length
    allBlocks = allBlocks.filter((block) => {
      // Keep block if it doesn't appear on this date
      if (block.date === dateStr) return false
      if (block.repeatDaily) return false
      if (block.repeatDays && block.repeatDays.includes(dayOfWeek)) return false
      return true
    })

    const deletedCount = originalCount - allBlocks.length
    console.log(`[clearAllTasksForDay] Deleted ${deletedCount} blocks from localStorage`)

    localStorage.setItem(BLOCKS_KEY, JSON.stringify(allBlocks))
  }
}

/**
 * Apply a template to all future instances of a specific day of week
 * @param userId - User ID
 * @param dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @param weeksAhead - Number of weeks to apply template (default: 12 weeks / 3 months)
 */
export async function applyTemplateToAllDays(
  userId: string, 
  dayOfWeek: number, 
  weeksAhead: number = 12
): Promise<number> {
  const templates = await getDefaultTemplates(userId)
  const template = templates.find((t) => t.dayOfWeek === dayOfWeek)
  
  if (!template || !template.blocks || template.blocks.length === 0) {
    throw new Error('No template found for this day of week')
  }

  const existingBlocks = await getTimeBlocks(userId)
  let blocksCreated = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate all future dates for this day of week
  const targetDates: string[] = []
  for (let week = 0; week < weeksAhead; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + (week * 7) + day)
      
      if (currentDate.getDay() === dayOfWeek && currentDate >= today) {
        const dateStr = currentDate.toISOString().split("T")[0]
        targetDates.push(dateStr)
      }
    }
  }

  console.log(`[applyTemplateToAllDays] Applying template to ${targetDates.length} dates`)

  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    
    for (const dateStr of targetDates) {
      // Delete existing blocks for this date
      await supabase
        .from("time_blocks")
        .delete()
        .eq("user_id", userId)
        .eq("date", dateStr)

      // Create new blocks from template
      const newBlocks = template.blocks.map((blockTemplate) => ({
        id: crypto.randomUUID(),
        user_id: userId,
        title: blockTemplate.title,
        description: blockTemplate.description || null,
        date: dateStr,
        start_time: blockTemplate.startTime,
        end_time: blockTemplate.endTime,
        category: blockTemplate.category,
        color: blockTemplate.color || '',
        completed: false,
        repeat_daily: !!blockTemplate.repeatDaily,
        repeat_days: null,
        created_at: new Date().toISOString(),
      }))

      if (newBlocks.length > 0) {
        await supabase.from("time_blocks").insert(newBlocks)
        blocksCreated += newBlocks.length
      }
    }
  } else {
    // LocalStorage fallback
    const allBlocks = existingBlocks.filter(b => !targetDates.includes(b.date))
    
    for (const dateStr of targetDates) {
      template.blocks.forEach((blockTemplate) => {
        const newBlock: TimeBlock = {
          id: crypto.randomUUID(),
          userId,
          date: dateStr,
          completed: false,
          createdAt: new Date().toISOString(),
          ...blockTemplate,
        }
        allBlocks.push(newBlock)
        blocksCreated++
      })
    }
    
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(allBlocks))
  }

  return blocksCreated
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
