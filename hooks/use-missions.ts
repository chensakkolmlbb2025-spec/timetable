"use client"

/**
 * useMissions Hook
 * Real-time mission management with Supabase WebSockets
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import {
  getMissionsByLevel,
  createMission,
  updateMission,
  deleteMission,
  completeMission,
  failMission,
  moveMissionToToday,
  moveMissionToPool,
  promotePendingMissionsToToday,
  failOverdueMissions,
  getMissionStats
} from '@/lib/missions/service'
import type {
  Mission,
  MissionFormData,
  MissionUpdateData,
  MissionsByLevel,
  MissionStats,
  MissionEventType
} from '@/lib/missions/types'

// ============================================================================
// TYPES
// ============================================================================

interface UseMissionsReturn {
  // Data
  missions: MissionsByLevel
  stats: MissionStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  addMission: (data: MissionFormData) => Promise<Mission | null>
  editMission: (id: string, data: MissionUpdateData) => Promise<Mission | null>
  removeMission: (id: string) => Promise<boolean>
  complete: (id: string) => Promise<Mission | null>
  fail: (id: string) => Promise<Mission | null>
  moveToToday: (id: string) => Promise<Mission | null>
  moveToPool: (id: string) => Promise<Mission | null>
  
  // Bulk actions
  promoteToToday: () => Promise<number>
  failOverdue: () => Promise<number>
  
  // Refresh
  refresh: () => Promise<void>
  
  // Connection status
  isConnected: boolean
}

// ============================================================================
// HOOK
// ============================================================================

export function useMissions(userId: string | null): UseMissionsReturn {
  const [missions, setMissions] = useState<MissionsByLevel>({
    pending: [],
    today: [],
    completed: [],
    failed: []
  })
  const [stats, setStats] = useState<MissionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())
  
  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  
  const fetchMissions = useCallback(async () => {
    if (!userId) return
    
    try {
      setError(null)
      const [missionData, statsData] = await Promise.all([
        getMissionsByLevel(userId),
        getMissionStats(userId)
      ])
      setMissions(missionData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch missions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch missions')
    } finally {
      setIsLoading(false)
    }
  }, [userId])
  
  const refresh = useCallback(async () => {
    setIsLoading(true)
    await fetchMissions()
  }, [fetchMissions])
  
  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================
  
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }
    
    // Initial fetch
    fetchMissions()
    
    // Set up realtime subscription
    const channel = supabaseRef.current
      .channel(`missions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
          filter: `user_id=eq.${userId}`
        },
        (payload: RealtimePostgresChangesPayload<Mission>) => {
          handleRealtimeEvent(payload)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        console.log('Missions channel status:', status)
      })
    
    channelRef.current = channel
    
    // Cleanup
    return () => {
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, fetchMissions])
  
  // ============================================================================
  // REALTIME EVENT HANDLER
  // ============================================================================
  
  const handleRealtimeEvent = useCallback((
    payload: RealtimePostgresChangesPayload<Mission>
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    console.log('Realtime event:', eventType, newRecord || oldRecord)
    
    setMissions(prev => {
      const updated = { ...prev }
      
      switch (eventType) {
        case 'INSERT': {
          const mission = newRecord as Mission
          const level = mission.status === 'completed' ? 'completed' 
            : mission.status === 'failed' ? 'failed'
            : mission.status === 'today' ? 'today' 
            : 'pending'
          updated[level] = [mission, ...updated[level]]
          break
        }
        
        case 'UPDATE': {
          const mission = newRecord as Mission
          const oldMission = oldRecord as Mission
          
          // Remove from old level
          const oldLevel = oldMission.status === 'completed' ? 'completed'
            : oldMission.status === 'failed' ? 'failed'
            : oldMission.status === 'today' ? 'today'
            : 'pending'
          updated[oldLevel] = updated[oldLevel].filter(m => m.id !== mission.id)
          
          // Add to new level
          const newLevel = mission.status === 'completed' ? 'completed'
            : mission.status === 'failed' ? 'failed'
            : mission.status === 'today' ? 'today'
            : 'pending'
          
          // For completed, maintain only last 10
          if (newLevel === 'completed') {
            updated[newLevel] = [mission, ...updated[newLevel]]
              .sort((a, b) => 
                new Date(b.completed_at || 0).getTime() - 
                new Date(a.completed_at || 0).getTime()
              )
              .slice(0, 10)
          } else {
            const existingIndex = updated[newLevel].findIndex(m => m.id === mission.id)
            if (existingIndex >= 0) {
              updated[newLevel][existingIndex] = mission
            } else {
              updated[newLevel] = [mission, ...updated[newLevel]]
            }
          }
          break
        }
        
        case 'DELETE': {
          const mission = oldRecord as Mission
          const level = mission.status === 'completed' ? 'completed'
            : mission.status === 'failed' ? 'failed'
            : mission.status === 'today' ? 'today'
            : 'pending'
          updated[level] = updated[level].filter(m => m.id !== mission.id)
          break
        }
      }
      
      return updated
    })
    
    // Refresh stats after changes
    if (userId) {
      getMissionStats(userId).then(setStats).catch(console.error)
    }
  }, [userId])
  
  // ============================================================================
  // OPTIMISTIC UPDATE HELPERS
  // ============================================================================
  
  const optimisticAdd = useCallback((mission: Mission) => {
    setMissions(prev => ({
      ...prev,
      pending: [mission, ...prev.pending]
    }))
  }, [])
  
  const optimisticUpdate = useCallback((id: string, updates: Partial<Mission>) => {
    setMissions(prev => {
      const updated = { ...prev }
      for (const level of ['pending', 'today', 'completed', 'failed'] as const) {
        const index = updated[level].findIndex(m => m.id === id)
        if (index >= 0) {
          updated[level][index] = { ...updated[level][index], ...updates }
          break
        }
      }
      return updated
    })
  }, [])
  
  const optimisticRemove = useCallback((id: string) => {
    setMissions(prev => ({
      pending: prev.pending.filter(m => m.id !== id),
      today: prev.today.filter(m => m.id !== id),
      completed: prev.completed.filter(m => m.id !== id),
      failed: prev.failed.filter(m => m.id !== id)
    }))
  }, [])
  
  // ============================================================================
  // CRUD ACTIONS
  // ============================================================================
  
  const addMission = useCallback(async (data: MissionFormData): Promise<Mission | null> => {
    if (!userId) return null
    
    try {
      setError(null)
      const mission = await createMission(userId, data)
      // Realtime will handle the update, but we can optimistically add
      return mission
    } catch (err) {
      console.error('Failed to add mission:', err)
      setError(err instanceof Error ? err.message : 'Failed to add mission')
      return null
    }
  }, [userId])
  
  const editMission = useCallback(async (
    id: string,
    data: MissionUpdateData
  ): Promise<Mission | null> => {
    try {
      setError(null)
      optimisticUpdate(id, data as Partial<Mission>)
      const mission = await updateMission(id, data)
      return mission
    } catch (err) {
      console.error('Failed to edit mission:', err)
      setError(err instanceof Error ? err.message : 'Failed to edit mission')
      await fetchMissions() // Revert optimistic update
      return null
    }
  }, [optimisticUpdate, fetchMissions])
  
  const removeMission = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      optimisticRemove(id)
      await deleteMission(id)
      return true
    } catch (err) {
      console.error('Failed to remove mission:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove mission')
      await fetchMissions() // Revert optimistic update
      return false
    }
  }, [optimisticRemove, fetchMissions])
  
  // ============================================================================
  // STATUS TRANSITIONS
  // ============================================================================
  
  const complete = useCallback(async (id: string): Promise<Mission | null> => {
    try {
      setError(null)
      optimisticUpdate(id, { 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      const mission = await completeMission(id)
      return mission
    } catch (err) {
      console.error('Failed to complete mission:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete mission')
      await fetchMissions()
      return null
    }
  }, [optimisticUpdate, fetchMissions])
  
  const fail = useCallback(async (id: string): Promise<Mission | null> => {
    try {
      setError(null)
      optimisticUpdate(id, { 
        status: 'failed', 
        failed_at: new Date().toISOString() 
      })
      const mission = await failMission(id)
      return mission
    } catch (err) {
      console.error('Failed to fail mission:', err)
      setError(err instanceof Error ? err.message : 'Failed to fail mission')
      await fetchMissions()
      return null
    }
  }, [optimisticUpdate, fetchMissions])
  
  const moveToToday = useCallback(async (id: string): Promise<Mission | null> => {
    try {
      setError(null)
      optimisticUpdate(id, { status: 'today' })
      const mission = await moveMissionToToday(id)
      return mission
    } catch (err) {
      console.error('Failed to move mission to today:', err)
      setError(err instanceof Error ? err.message : 'Failed to move mission')
      await fetchMissions()
      return null
    }
  }, [optimisticUpdate, fetchMissions])
  
  const moveToPool = useCallback(async (id: string): Promise<Mission | null> => {
    try {
      setError(null)
      optimisticUpdate(id, { 
        status: 'pending', 
        completed_at: null, 
        failed_at: null 
      })
      const mission = await moveMissionToPool(id)
      return mission
    } catch (err) {
      console.error('Failed to move mission to pool:', err)
      setError(err instanceof Error ? err.message : 'Failed to move mission')
      await fetchMissions()
      return null
    }
  }, [optimisticUpdate, fetchMissions])
  
  // ============================================================================
  // BULK ACTIONS
  // ============================================================================
  
  const promoteToToday = useCallback(async (): Promise<number> => {
    if (!userId) return 0
    
    try {
      setError(null)
      const count = await promotePendingMissionsToToday(userId)
      await fetchMissions()
      return count
    } catch (err) {
      console.error('Failed to promote missions:', err)
      setError(err instanceof Error ? err.message : 'Failed to promote missions')
      return 0
    }
  }, [userId, fetchMissions])
  
  const failOverdue = useCallback(async (): Promise<number> => {
    if (!userId) return 0
    
    try {
      setError(null)
      const count = await failOverdueMissions(userId)
      await fetchMissions()
      return count
    } catch (err) {
      console.error('Failed to fail overdue missions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fail overdue missions')
      return 0
    }
  }, [userId, fetchMissions])
  
  // ============================================================================
  // AUTO-PROMOTION CHECK
  // ============================================================================
  
  useEffect(() => {
    if (!userId) return
    
    // Check for missions that need to be promoted every minute
    const interval = setInterval(() => {
      const now = new Date()
      const cambodiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      const todayStr = cambodiaTime.toISOString().split('T')[0]
      
      // Check if any pending missions should be today
      const shouldPromote = missions.pending.some(m => {
        const deadlineDate = m.deadline.split('T')[0]
        return deadlineDate <= todayStr
      })
      
      if (shouldPromote) {
        promoteToToday()
      }
      
      // Check if any today missions are overdue
      const shouldFail = missions.today.some(m => {
        return new Date(m.deadline) < now
      })
      
      if (shouldFail) {
        failOverdue()
      }
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [userId, missions.pending, missions.today, promoteToToday, failOverdue])
  
  return {
    missions,
    stats,
    isLoading,
    error,
    addMission,
    editMission,
    removeMission,
    complete,
    fail,
    moveToToday,
    moveToPool,
    promoteToToday,
    failOverdue,
    refresh,
    isConnected
  }
}
