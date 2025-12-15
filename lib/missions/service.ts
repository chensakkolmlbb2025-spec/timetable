/**
 * Mission Service
 * All Supabase queries for the 3-Level Mission System
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Mission,
  MissionFormData,
  MissionUpdateData,
  MissionStatus,
  MissionsByLevel,
  MissionFilters,
  MissionSort,
  MissionStats
} from './types'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Supabase client instance
 */
function getClient() {
  return createClient()
}

/**
 * Get the start of today in Cambodia timezone
 */
function getTodayStart(): string {
  const now = new Date()
  // Cambodia is UTC+7
  const cambodiaOffset = 7 * 60 * 60 * 1000
  const cambodiaTime = new Date(now.getTime() + cambodiaOffset)
  cambodiaTime.setUTCHours(0, 0, 0, 0)
  return cambodiaTime.toISOString()
}

/**
 * Get the end of today in Cambodia timezone
 */
function getTodayEnd(): string {
  const now = new Date()
  const cambodiaOffset = 7 * 60 * 60 * 1000
  const cambodiaTime = new Date(now.getTime() + cambodiaOffset)
  cambodiaTime.setUTCHours(23, 59, 59, 999)
  return cambodiaTime.toISOString()
}

// ============================================================================
// HELPER: Create Timeblock for Mission
// ============================================================================

// Color mapping for categories
const CATEGORY_COLORS: Record<string, string> = {
  work: '#3B82F6',      // blue
  personal: '#8B5CF6',  // purple
  health: '#F43F5E',    // rose
  learning: '#10B981',  // emerald
  social: '#F59E0B',    // amber
  other: '#6B7280',     // gray
}

/**
 * Create a timeblock for a scheduled mission
 */
async function createTimeblockForMission(
  supabase: ReturnType<typeof getClient>,
  userId: string,
  missionTitle: string,
  missionDescription: string | null,
  scheduledDate: string,
  scheduledStartTime: string,
  scheduledEndTime: string,
  category: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'other' = 'work'
): Promise<string> {
  const timeblockId = crypto.randomUUID()
  
  const { error } = await supabase
    .from('time_blocks')
    .insert({
      id: timeblockId,
      user_id: userId,
      title: `🎯 ${missionTitle}`,
      description: missionDescription || `Mission: ${missionTitle}`,
      date: scheduledDate,
      start_time: scheduledStartTime,
      end_time: scheduledEndTime,
      category: category,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
      completed: false,
      repeat_daily: false,
      created_at: new Date().toISOString(),
    })
  
  if (error) {
    console.error('Failed to create timeblock for mission:', error)
    throw new Error(`Failed to create timeblock: ${error.message}`)
  }
  
  return timeblockId
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new mission
 * If scheduling data is provided, auto-creates a linked timeblock
 */
export async function createMission(
  userId: string,
  data: MissionFormData
): Promise<Mission> {
  const supabase = getClient()
  
  let timeblockId = data.timeblock_id || null
  
  // If scheduling data is provided, create a timeblock first
  if (data.scheduled_date && data.scheduled_start_time && data.scheduled_end_time) {
    timeblockId = await createTimeblockForMission(
      supabase,
      userId,
      data.title,
      data.description || null,
      data.scheduled_date,
      data.scheduled_start_time,
      data.scheduled_end_time,
      data.category || 'work'
    )
  }
  
  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      deadline: data.deadline,
      priority: data.priority,
      difficulty: data.difficulty,
      timeblock_id: timeblockId,
      notes: data.notes || null,
      tags: data.tags || [],
      status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to create mission:', error)
    throw new Error(error.message)
  }
  
  return mission
}

/**
 * Get all missions for a user
 */
export async function getMissions(
  userId: string,
  filters?: MissionFilters,
  sort?: MissionSort
): Promise<Mission[]> {
  const supabase = getClient()
  
  let query = supabase
    .from('missions')
    .select('*')
    .eq('user_id', userId)
  
  // Apply filters
  if (filters?.status?.length) {
    query = query.in('status', filters.status)
  }
  
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority)
  }
  
  if (filters?.difficulty?.length) {
    query = query.in('difficulty', filters.difficulty)
  }
  
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  if (filters?.dateRange) {
    query = query
      .gte('deadline', filters.dateRange.start)
      .lte('deadline', filters.dateRange.end)
  }
  
  // Apply sorting
  const sortField = sort?.field || 'deadline'
  const sortOrder = sort?.order === 'desc' ? { ascending: false } : { ascending: true }
  query = query.order(sortField, sortOrder)
  
  const { data, error } = await query
  
  if (error) {
    console.error('Failed to fetch missions:', error)
    throw new Error(error.message)
  }
  
  return data || []
}

/**
 * Get missions grouped by level
 */
export async function getMissionsByLevel(userId: string): Promise<MissionsByLevel> {
  const missions = await getMissions(userId)
  
  return {
    pending: missions.filter(m => m.status === 'pending'),
    today: missions.filter(m => m.status === 'today'),
    completed: missions
      .filter(m => m.status === 'completed')
      .sort((a, b) => 
        new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
      )
      .slice(0, 10), // Only last 10 completed
    failed: missions.filter(m => m.status === 'failed')
  }
}

/**
 * Get a single mission by ID
 */
export async function getMission(missionId: string): Promise<Mission | null> {
  const supabase = getClient()
  
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', missionId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Failed to fetch mission:', error)
    throw new Error(error.message)
  }
  
  return data
}

/**
 * Update a mission
 */
export async function updateMission(
  missionId: string,
  data: MissionUpdateData
): Promise<Mission> {
  const supabase = getClient()
  
  const { data: mission, error } = await supabase
    .from('missions')
    .update(data)
    .eq('id', missionId)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to update mission:', error)
    throw new Error(error.message)
  }
  
  return mission
}

/**
 * Delete a mission
 */
export async function deleteMission(missionId: string): Promise<void> {
  const supabase = getClient()
  
  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId)
  
  if (error) {
    console.error('Failed to delete mission:', error)
    throw new Error(error.message)
  }
}

// ============================================================================
// STATUS TRANSITIONS
// ============================================================================

/**
 * Complete a mission (Level 2 → Level 3)
 */
export async function completeMission(missionId: string): Promise<Mission> {
  return updateMission(missionId, {
    status: 'completed',
    completed_at: new Date().toISOString()
  })
}

/**
 * Fail a mission (Level 2 → Failed)
 */
export async function failMission(missionId: string): Promise<Mission> {
  return updateMission(missionId, {
    status: 'failed',
    failed_at: new Date().toISOString()
  })
}

/**
 * Move mission to today (Level 1 → Level 2)
 */
export async function moveMissionToToday(missionId: string): Promise<Mission> {
  return updateMission(missionId, {
    status: 'today'
  })
}

/**
 * Move mission back to pool (any → Level 1)
 */
export async function moveMissionToPool(missionId: string): Promise<Mission> {
  return updateMission(missionId, {
    status: 'pending',
    completed_at: null,
    failed_at: null
  })
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Move all pending missions with deadline today to "today" status
 */
export async function promotePendingMissionsToToday(userId: string): Promise<number> {
  const supabase = getClient()
  const todayEnd = getTodayEnd()
  
  const { data, error } = await supabase
    .from('missions')
    .update({ status: 'today' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lte('deadline', todayEnd)
    .select()
  
  if (error) {
    console.error('Failed to promote missions:', error)
    throw new Error(error.message)
  }
  
  return data?.length || 0
}

/**
 * Mark all overdue "today" missions as failed
 */
export async function failOverdueMissions(userId: string): Promise<number> {
  const supabase = getClient()
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('missions')
    .update({
      status: 'failed',
      failed_at: now
    })
    .eq('user_id', userId)
    .eq('status', 'today')
    .lt('deadline', now)
    .select()
  
  if (error) {
    console.error('Failed to fail overdue missions:', error)
    throw new Error(error.message)
  }
  
  return data?.length || 0
}

/**
 * Clean up old completed missions (keep only last 10)
 */
export async function cleanupCompletedMissions(userId: string): Promise<number> {
  const supabase = getClient()
  
  // First, get all completed missions sorted by completion date
  const { data: completed, error: fetchError } = await supabase
    .from('missions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
  
  if (fetchError) {
    console.error('Failed to fetch completed missions:', fetchError)
    throw new Error(fetchError.message)
  }
  
  if (!completed || completed.length <= 10) {
    return 0
  }
  
  // Delete missions beyond the first 10
  const idsToDelete = completed.slice(10).map(m => m.id)
  
  const { error: deleteError } = await supabase
    .from('missions')
    .delete()
    .in('id', idsToDelete)
  
  if (deleteError) {
    console.error('Failed to cleanup missions:', deleteError)
    throw new Error(deleteError.message)
  }
  
  return idsToDelete.length
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get mission statistics for a user
 */
export async function getMissionStats(userId: string): Promise<MissionStats> {
  const missions = await getMissions(userId)
  const today = new Date().toISOString().split('T')[0]
  
  const pending = missions.filter(m => m.status === 'pending')
  const todayMissions = missions.filter(m => m.status === 'today')
  const completedToday = missions.filter(
    m => m.status === 'completed' && 
    m.completed_at?.startsWith(today)
  )
  const failedToday = missions.filter(
    m => m.status === 'failed' && 
    m.failed_at?.startsWith(today)
  )
  
  const totalToday = todayMissions.length + completedToday.length + failedToday.length
  const completionRate = totalToday > 0 
    ? Math.round((completedToday.length / totalToday) * 100) 
    : 0
  
  return {
    totalPending: pending.length,
    totalToday: todayMissions.length,
    completedToday: completedToday.length,
    failedToday: failedToday.length,
    completionRate,
    streak: 0 // TODO: Calculate streak from historical data
  }
}

// ============================================================================
// TIMEBLOCK INTEGRATION
// ============================================================================

/**
 * Link a mission to a timeblock
 */
export async function linkMissionToTimeblock(
  missionId: string,
  timeblockId: string
): Promise<Mission> {
  return updateMission(missionId, { timeblock_id: timeblockId })
}

/**
 * Unlink a mission from its timeblock
 */
export async function unlinkMissionFromTimeblock(missionId: string): Promise<Mission> {
  return updateMission(missionId, { timeblock_id: null })
}

/**
 * Get missions linked to a specific timeblock
 */
export async function getMissionsByTimeblock(timeblockId: string): Promise<Mission[]> {
  const supabase = getClient()
  
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('timeblock_id', timeblockId)
  
  if (error) {
    console.error('Failed to fetch missions by timeblock:', error)
    throw new Error(error.message)
  }
  
  return data || []
}
