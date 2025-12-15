'use client'

import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3,
  Star,
  Zap,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Mission, MissionPriority, MissionDifficulty } from '@/lib/missions/types'

// Light/dark theme variants by level
const levelStyles = {
  // Level 1: Mission Pool - Blue
  pool: {
    container: 'bg-white dark:bg-blue-500/10 border-blue-200 dark:border-blue-400/20 hover:border-blue-400 dark:hover:border-blue-400/40 shadow-sm hover:shadow-md',
    gradient: 'from-blue-50 dark:from-blue-500/20 via-transparent to-cyan-50 dark:to-cyan-500/10',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-400/30',
  },
  // Level 2: Today's Missions - Gold
  today: {
    container: 'bg-white dark:bg-amber-500/10 border-amber-200 dark:border-amber-400/20 hover:border-amber-400 dark:hover:border-amber-400/40 shadow-sm hover:shadow-md',
    gradient: 'from-amber-50 dark:from-amber-500/20 via-transparent to-orange-50 dark:to-orange-500/10',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-400/30',
  },
  // Level 3: Completed - Emerald
  completed: {
    container: 'bg-white dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-400/20 hover:border-emerald-400 dark:hover:border-emerald-400/40 shadow-sm hover:shadow-md',
    gradient: 'from-emerald-50 dark:from-emerald-500/20 via-transparent to-green-50 dark:to-green-500/10',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30',
  },
  // Failed state - Red
  failed: {
    container: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-400/20',
    gradient: 'from-red-50 dark:from-red-500/20 via-transparent to-rose-50 dark:to-rose-500/10',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-400/30',
  },
}

// Priority icons and colors
const priorityConfig: Record<MissionPriority, { icon: typeof Zap; color: string; label: string }> = {
  critical: { icon: Zap, color: 'text-red-600 dark:text-red-400', label: 'Critical' },
  high: { icon: Star, color: 'text-amber-600 dark:text-amber-400', label: 'High' },
  medium: { icon: Target, color: 'text-blue-600 dark:text-blue-400', label: 'Medium' },
  low: { icon: Clock, color: 'text-gray-500 dark:text-slate-400', label: 'Low' },
}

// Difficulty badges
const difficultyConfig: Record<MissionDifficulty, { color: string; label: string }> = {
  easy: { color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-200 dark:border-green-400/30', label: 'Easy' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-400/30', label: 'Medium' },
  hard: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-400/30', label: 'Hard' },
  extreme: { color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-200 dark:border-red-400/30', label: 'Extreme' },
}

interface MissionCardProps {
  mission: Mission
  level: 'pool' | 'today' | 'completed'
  onComplete?: (id: string) => void
  onFail?: (id: string) => void
  onEdit?: (mission: Mission) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

export function MissionCard({
  mission,
  level,
  onComplete,
  onFail,
  onEdit,
  onDelete,
  isLoading = false,
}: MissionCardProps) {
  const effectiveLevel = mission.status === 'failed' ? 'failed' : level
  const styles = levelStyles[effectiveLevel]
  const priority = priorityConfig[mission.priority] || priorityConfig.medium
  const difficulty = difficultyConfig[mission.difficulty] || difficultyConfig.medium
  const PriorityIcon = priority.icon

  const formatDeadline = (date: string) => {
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = () => {
    if (mission.status === 'completed' || mission.status === 'failed') return false
    const deadline = new Date(mission.deadline)
    const now = new Date()
    return deadline < now
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        layout: { duration: 0.3 }
      }}
      className={cn(
        // Base card
        'relative overflow-hidden rounded-xl border p-4',
        'transition-all duration-300 ease-out',
        // Level-specific styles
        styles.container,
        // Loading state
        isLoading && 'opacity-50 pointer-events-none',
        // Overdue state
        isOverdue() && 'ring-2 ring-red-500/50'
      )}
    >
      {/* Gradient overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
          styles.gradient
        )} 
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header: Priority + Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('mt-0.5 flex-shrink-0', priority.color)}>
            <PriorityIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold text-gray-900 dark:text-white/90 leading-tight',
              mission.status === 'completed' && 'line-through opacity-60'
            )}>
              {mission.title}
            </h3>
            {mission.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-white/60 line-clamp-2">
                {mission.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta: Deadline + Difficulty */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Deadline badge */}
          <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
            styles.badge,
            isOverdue() && 'bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-400/50'
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDeadline(mission.deadline)}</span>
          </div>

          {/* Difficulty badge */}
          <div className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border',
            difficulty.color
          )}>
            {difficulty.label}
          </div>

          {/* Timeblock link indicator - shows when scheduled to timetable */}
          {mission.timeblock_id && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/30">
              <Clock className="w-3 h-3" />
              <span>📅 On Timetable</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {(level === 'pool' || level === 'today') && (
          <div className="flex items-center gap-2">
            {/* Complete button */}
            {onComplete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onComplete(mission.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
                  'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30',
                  'border border-emerald-200 dark:border-emerald-400/30',
                  'text-emerald-700 dark:text-emerald-300 text-sm font-medium',
                  'transition-all duration-200'
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete</span>
              </motion.button>
            )}

            {/* Fail button (only for today's missions) */}
            {level === 'today' && onFail && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onFail(mission.id)}
                className={cn(
                  'px-3 py-2 rounded-lg',
                  'bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30',
                  'border border-red-200 dark:border-red-400/30',
                  'text-red-700 dark:text-red-300',
                  'transition-all duration-200'
                )}
              >
                <XCircle className="w-4 h-4" />
              </motion.button>
            )}

            {/* Edit button */}
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(mission)}
                className={cn(
                  'px-3 py-2 rounded-lg',
                  'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10',
                  'border border-gray-200 dark:border-white/10',
                  'text-gray-600 hover:text-gray-800 dark:text-white/60 dark:hover:text-white/80',
                  'transition-all duration-200'
                )}
              >
                <Edit3 className="w-4 h-4" />
              </motion.button>
            )}

            {/* Delete button */}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(mission.id)}
                className={cn(
                  'px-3 py-2 rounded-lg',
                  'bg-gray-100 hover:bg-red-100 dark:bg-white/5 dark:hover:bg-red-500/20',
                  'border border-gray-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-400/30',
                  'text-gray-600 hover:text-red-600 dark:text-white/60 dark:hover:text-red-300',
                  'transition-all duration-200'
                )}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}

        {/* Completed state actions */}
        {level === 'completed' && (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400/80 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed {mission.completed_at && new Date(mission.completed_at).toLocaleDateString()}</span>
            </div>
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(mission.id)}
                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-red-100 dark:bg-white/5 dark:hover:bg-red-500/20 text-gray-500 hover:text-red-600 dark:text-white/40 dark:hover:text-red-300 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MissionCard
