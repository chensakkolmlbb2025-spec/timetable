/**
 * Mission Types
 * Type definitions for the 3-Level Mission System
 */

// ============================================================================
// ENUMS
// ============================================================================

export type MissionStatus = 'pending' | 'today' | 'completed' | 'failed'
export type MissionPriority = 'low' | 'medium' | 'high' | 'critical'
export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'extreme'

// ============================================================================
// MISSION ENTITY
// ============================================================================

export interface Mission {
  id: string
  user_id: string
  title: string
  description: string | null
  deadline: string // ISO timestamp
  status: MissionStatus
  priority: MissionPriority
  difficulty: MissionDifficulty
  timeblock_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  failed_at: string | null
  notes: string | null
  tags: string[]
}

// ============================================================================
// FORM DATA
// ============================================================================

export interface MissionFormData {
  title: string
  description: string
  deadline: string
  priority: MissionPriority
  difficulty: MissionDifficulty
  timeblock_id?: string | null
  notes?: string
  tags?: string[]
  // Scheduling - auto-creates a timeblock
  scheduled_date?: string      // YYYY-MM-DD
  scheduled_start_time?: string // HH:mm
  scheduled_end_time?: string   // HH:mm
  category?: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'other'
}

export interface MissionUpdateData extends Partial<MissionFormData> {
  status?: MissionStatus
  completed_at?: string | null
  failed_at?: string | null
}

// ============================================================================
// REALTIME EVENTS
// ============================================================================

export type MissionEventType =
  | 'MISSION_ADDED'
  | 'MISSION_UPDATED'
  | 'MISSION_DELETED'
  | 'MISSION_MOVED_TO_TODAY'
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'

export interface MissionRealtimeEvent {
  type: MissionEventType
  mission: Mission
  timestamp: string
}

// ============================================================================
// GROUPED MISSIONS
// ============================================================================

export interface MissionsByLevel {
  pending: Mission[] // Level 1 - Pool
  today: Mission[]   // Level 2 - Today's Missions
  completed: Mission[] // Level 3 - Completed
  failed: Mission[]  // Failed missions
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface MissionStats {
  totalPending: number
  totalToday: number
  completedToday: number
  failedToday: number
  completionRate: number
  streak: number
}

// ============================================================================
// FILTER & SORT
// ============================================================================

export interface MissionFilters {
  status?: MissionStatus[]
  priority?: MissionPriority[]
  difficulty?: MissionDifficulty[]
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}

export type MissionSortField = 'deadline' | 'priority' | 'difficulty' | 'created_at' | 'title'
export type MissionSortOrder = 'asc' | 'desc'

export interface MissionSort {
  field: MissionSortField
  order: MissionSortOrder
}

// ============================================================================
// UI STATE
// ============================================================================

export interface MissionUIState {
  isAddModalOpen: boolean
  isEditModalOpen: boolean
  selectedMission: Mission | null
  isLoading: boolean
  error: string | null
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PRIORITY_CONFIG: Record<MissionPriority, {
  label: string
  color: string
  bgColor: string
  icon: string
}> = {
  low: {
    label: 'Low',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/20',
    icon: '○'
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    icon: '◐'
  },
  high: {
    label: 'High',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    icon: '●'
  },
  critical: {
    label: 'Critical',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    icon: '🔥'
  }
}

export const DIFFICULTY_CONFIG: Record<MissionDifficulty, {
  label: string
  color: string
  bgColor: string
  stars: number
}> = {
  easy: {
    label: 'Easy',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/20',
    stars: 1
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    stars: 2
  },
  hard: {
    label: 'Hard',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    stars: 3
  },
  extreme: {
    label: 'Extreme',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    stars: 4
  }
}

export const STATUS_CONFIG: Record<MissionStatus, {
  label: string
  color: string
  bgColor: string
  glassColor: string
}> = {
  pending: {
    label: 'Pool',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    glassColor: 'from-blue-500/10 to-blue-600/5'
  },
  today: {
    label: "Today's Mission",
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    glassColor: 'from-amber-500/10 to-orange-600/5'
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    glassColor: 'from-emerald-500/10 to-green-600/5'
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    glassColor: 'from-red-500/10 to-rose-600/5'
  }
}
