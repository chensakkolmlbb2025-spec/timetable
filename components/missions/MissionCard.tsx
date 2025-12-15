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

// iOS 26 Glassmorphism variants by level
const levelStyles = {
  // Level 1: Mission Pool - Blue glass
  pool: {
    container: 'bg-blue-500/10 backdrop-blur-xl border-blue-400/20 hover:border-blue-400/40',
    gradient: 'from-blue-500/20 via-transparent to-cyan-500/10',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  },
  // Level 2: Today's Missions - Gold glass
  today: {
    container: 'bg-amber-500/10 backdrop-blur-xl border-amber-400/20 hover:border-amber-400/40',
    gradient: 'from-amber-500/20 via-transparent to-orange-500/10',
    icon: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
  // Level 3: Completed - Emerald glass
  completed: {
    container: 'bg-emerald-500/10 backdrop-blur-xl border-emerald-400/20 hover:border-emerald-400/40',
    gradient: 'from-emerald-500/20 via-transparent to-green-500/10',
    icon: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  },
  // Failed state - Red glass
  failed: {
    container: 'bg-red-500/10 backdrop-blur-xl border-red-400/20',
    gradient: 'from-red-500/20 via-transparent to-rose-500/10',
    icon: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-400/30',
  },
}

// Priority icons and colors
const priorityConfig: Record<MissionPriority, { icon: typeof Zap; color: string; label: string }> = {
  critical: { icon: Zap, color: 'text-red-400', label: 'Critical' },
  high: { icon: Star, color: 'text-amber-400', label: 'High' },
  medium: { icon: Target, color: 'text-blue-400', label: 'Medium' },
  low: { icon: Clock, color: 'text-slate-400', label: 'Low' },
}

// Difficulty badges
const difficultyConfig: Record<MissionDifficulty, { color: string; label: string }> = {
  easy: { color: 'bg-green-500/20 text-green-300 border-green-400/30', label: 'Easy' },
  medium: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30', label: 'Medium' },
  hard: { color: 'bg-orange-500/20 text-orange-300 border-orange-400/30', label: 'Hard' },
  extreme: { color: 'bg-red-500/20 text-red-300 border-red-400/30', label: 'Extreme' },
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
        // Base glass card
        'relative overflow-hidden rounded-2xl border p-4',
        'shadow-lg shadow-black/5',
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
              'font-semibold text-white/90 leading-tight',
              mission.status === 'completed' && 'line-through opacity-60'
            )}>
              {mission.title}
            </h3>
            {mission.description && (
              <p className="mt-1 text-sm text-white/60 line-clamp-2">
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
            isOverdue() && 'bg-red-500/30 text-red-300 border-red-400/50'
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDeadline(mission.deadline)}</span>
          </div>

          {/* Difficulty badge */}
          <div className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium',
            difficulty.color
          )}>
            {difficulty.label}
          </div>

          {/* Timeblock link indicator */}
          {mission.timeblock_id && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-purple-500/20 text-purple-300">
              <Clock className="w-3 h-3" />
              <span>Linked</span>
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
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl',
                  'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30',
                  'text-emerald-300 text-sm font-medium',
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
                  'px-3 py-2 rounded-xl',
                  'bg-red-500/20 hover:bg-red-500/30 border border-red-400/30',
                  'text-red-300',
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
                  'px-3 py-2 rounded-xl',
                  'bg-white/5 hover:bg-white/10 border border-white/10',
                  'text-white/60 hover:text-white/80',
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
                  'px-3 py-2 rounded-xl',
                  'bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/30',
                  'text-white/60 hover:text-red-300',
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
            <div className="flex-1 flex items-center gap-2 text-emerald-400/80 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed {mission.completed_at && new Date(mission.completed_at).toLocaleDateString()}</span>
            </div>
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(mission.id)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-300 transition-all"
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
