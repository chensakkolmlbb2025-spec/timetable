'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Inbox, Sun, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MissionCard } from './MissionCard'
import type { Mission } from '@/lib/missions/types'

// Level configuration - simplified for light/dark theme support
const levelConfig = {
  pool: {
    icon: Inbox,
    emptyText: 'No missions in pool',
    emptySubtext: 'Add important tasks that need to be done',
    iconColor: 'text-blue-600 dark:text-blue-400',
    emptyBg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  },
  today: {
    icon: Sun,
    emptyText: 'No missions for today',
    emptySubtext: 'Tasks with today\'s deadline will appear here',
    iconColor: 'text-amber-600 dark:text-amber-400',
    emptyBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  },
  completed: {
    icon: Trophy,
    emptyText: 'No completed missions',
    emptySubtext: 'Complete missions to see them here',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    emptyBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  },
}

interface MissionListProps {
  level: 'pool' | 'today' | 'completed'
  missions: Mission[]
  onComplete?: (id: string) => void
  onFail?: (id: string) => void
  onEdit?: (mission: Mission) => void
  onDelete?: (id: string) => void
  onAddNew?: () => void
  isLoading?: boolean
  className?: string
}

// Stagger animation for list items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function MissionList({
  level,
  missions,
  onComplete,
  onFail,
  onEdit,
  onDelete,
  onAddNew,
  isLoading = false,
  className,
}: MissionListProps) {
  const config = levelConfig[level]
  const Icon = config.icon

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Mission List - no header, header is now in parent Card */}
      <div className="flex-1">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl animate-pulse bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10"
              />
            ))}
          </div>
        ) : missions.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex flex-col items-center justify-center py-8 px-4 rounded-xl border',
              config.emptyBg
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
              'bg-white/50 dark:bg-white/5',
              config.iconColor
            )}>
              <Icon className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-gray-700 dark:text-white/60 font-medium text-center text-sm">
              {config.emptyText}
            </p>
            <p className="text-gray-500 dark:text-white/40 text-xs mt-1 text-center">
              {config.emptySubtext}
            </p>
            {level === 'pool' && onAddNew && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddNew}
                className={cn(
                  'mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'bg-indigo-600 hover:bg-indigo-700',
                  'text-white text-xs font-medium',
                  'transition-all duration-200'
                )}
              >
                <Plus className="w-3 h-3" />
                <span>Add Mission</span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          // Mission cards with staggered animation
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {missions.map((mission) => (
                <motion.div
                  key={mission.id}
                  variants={itemVariants}
                  layout
                >
                  <MissionCard
                    mission={mission}
                    level={level}
                    onComplete={onComplete}
                    onFail={onFail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default MissionList
