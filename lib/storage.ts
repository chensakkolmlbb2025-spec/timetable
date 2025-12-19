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
