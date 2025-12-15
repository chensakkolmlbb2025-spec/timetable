'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Inbox, Sun, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MissionCard } from './MissionCard'
import type { Mission } from '@/lib/missions/types'

// Level configuration with iOS 26 glass styling
const levelConfig = {
  pool: {
    title: 'Mission Pool',
    subtitle: 'Important tasks to tackle',
    icon: Inbox,
    emptyText: 'No missions in pool',
    emptySubtext: 'Add important tasks that need to be done',
    headerGlass: 'bg-blue-500/10 border-blue-400/20',
    headerGradient: 'from-blue-600/30 to-cyan-600/20',
    iconColor: 'text-blue-400',
    countBadge: 'bg-blue-500/30 text-blue-200',
  },
  today: {
    title: "Today's Missions",
    subtitle: 'Must complete today',
    icon: Sun,
    emptyText: 'No missions for today',
    emptySubtext: 'Tasks with today\'s deadline will appear here',
    headerGlass: 'bg-amber-500/10 border-amber-400/20',
    headerGradient: 'from-amber-600/30 to-orange-600/20',
    iconColor: 'text-amber-400',
    countBadge: 'bg-amber-500/30 text-amber-200',
  },
  completed: {
    title: 'Completed',
    subtitle: 'Recent achievements',
    icon: Trophy,
    emptyText: 'No completed missions',
    emptySubtext: 'Complete missions to see them here',
    headerGlass: 'bg-emerald-500/10 border-emerald-400/20',
    headerGradient: 'from-emerald-600/30 to-green-600/20',
    iconColor: 'text-emerald-400',
    countBadge: 'bg-emerald-500/30 text-emerald-200',
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
    <div className={cn('flex flex-col h-full', className)}>
      {/* Glass Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4 mb-4',
          'backdrop-blur-xl shadow-lg',
          config.headerGlass
        )}
      >
        {/* Background gradient */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
          config.headerGradient
        )} />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'bg-white/10 backdrop-blur-sm',
              config.iconColor
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">
                {config.title}
              </h2>
              <p className="text-sm text-white/50">
                {config.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Count badge */}
            <div className={cn(
              'px-3 py-1.5 rounded-xl text-sm font-semibold',
              config.countBadge
            )}>
              {missions.length}
            </div>

            {/* Add button (only for pool) */}
            {level === 'pool' && onAddNew && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddNew}
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30',
                  'text-blue-300 hover:text-blue-200',
                  'transition-all duration-200'
                )}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mission List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-32 rounded-2xl animate-pulse',
                  'bg-white/5 border border-white/10'
                )}
              />
            ))}
          </div>
        ) : missions.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex flex-col items-center justify-center py-12 px-4 rounded-2xl',
              'bg-white/5 border border-white/10 backdrop-blur-sm'
            )}
          >
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              'bg-white/5',
              config.iconColor
            )}>
              <Icon className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-white/60 font-medium text-center">
              {config.emptyText}
            </p>
            <p className="text-white/40 text-sm mt-1 text-center">
              {config.emptySubtext}
            </p>
            {level === 'pool' && onAddNew && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddNew}
                className={cn(
                  'mt-4 flex items-center gap-2 px-4 py-2 rounded-xl',
                  'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30',
                  'text-blue-300 text-sm font-medium',
                  'transition-all duration-200'
                )}
              >
                <Plus className="w-4 h-4" />
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
