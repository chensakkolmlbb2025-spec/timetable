'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, RefreshCw, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MissionList, AddMissionModal } from '@/components/missions'
import { useMissions } from '@/hooks/use-missions'
import { useAuth } from '@/components/auth-provider'
import type { MissionFormData, Mission } from '@/lib/missions/types'
import Link from 'next/link'

export default function MissionsPage() {
  const { user, loading: authLoading } = useAuth()
  
  const {
    missions,
    isLoading,
    error,
    addMission,
    editMission,
    removeMission,
    complete,
    fail,
    refresh,
    isConnected,
  } = useMissions(user?.id ?? null)
  
  // Map to the expected level structure
  const level1 = missions.pending
  const level2 = missions.today
  const level3 = missions.completed

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)

  // Handle new mission creation
  const handleAddMission = async (data: MissionFormData) => {
    await addMission(data)
  }

  // Handle mission completion with celebration animation
  const handleComplete = async (id: string) => {
    await complete(id)
    // Trigger celebration effect (could add confetti here)
  }

  // Handle mission failure
  const handleFail = async (id: string) => {
    if (window.confirm('Mark this mission as failed?')) {
      await fail(id)
    }
  }

  // Handle mission deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this mission?')) {
      await removeMission(id)
    }
  }

  // Handle edit
  const handleEdit = (mission: Mission) => {
    setEditingMission(mission)
    // TODO: Open edit modal
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Mission Control</h1>
          <p className="text-white/50 mb-6">Sign in to manage your missions and track your progress.</p>
          <Link
            href="/sign-in"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium',
              'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
              'shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
              'transition-all duration-200'
            )}
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection indicator */}
        <div className="fixed top-4 right-4 z-50">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
            isConnected
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            )} />
            {isConnected ? 'Live' : 'Connecting...'}
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-blue-500 to-purple-600',
              'shadow-lg shadow-blue-500/25'
            )}>
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Mission Control
              </h1>
              <p className="text-white/50 text-sm sm:text-base">
                Track your important tasks across 3 levels
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refresh}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-white/5 hover:bg-white/10 border border-white/10',
              'text-white/70 hover:text-white',
              'transition-all duration-200',
              'disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </motion.button>
        </motion.div>

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300"
          >
            <p className="font-medium">Error loading missions</p>
            <p className="text-sm text-red-300/70 mt-1">{error}</p>
          </motion.div>
        )}

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'grid grid-cols-3 gap-3 sm:gap-4 mb-8 p-4 rounded-2xl',
            'bg-white/5 backdrop-blur-xl border border-white/10'
          )}
        >
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">{level1.length}</p>
            <p className="text-xs sm:text-sm text-white/50">In Pool</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{level2.length}</p>
            <p className="text-xs sm:text-sm text-white/50">Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{level3.length}</p>
            <p className="text-xs sm:text-sm text-white/50">Completed</p>
          </div>
        </motion.div>

        {/* Three-column layout (responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level 1: Mission Pool */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MissionList
              level="pool"
              missions={level1}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddNew={() => setIsAddModalOpen(true)}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Level 2: Today's Missions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MissionList
              level="today"
              missions={level2}
              onComplete={handleComplete}
              onFail={handleFail}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </motion.div>

          {/* Level 3: Completed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MissionList
              level="completed"
              missions={level3}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </motion.div>
        </div>
      </div>

      {/* Add Mission Modal */}
      <AddMissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMission}
      />
    </div>
  )
}
