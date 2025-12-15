'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Rocket, RefreshCw, Plus, Inbox, Sun, Trophy, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { DashboardNav } from '@/components/dashboard-nav'
import { MissionList, AddMissionModal } from '@/components/missions'
import { useMissions } from '@/hooks/use-missions'
import { useAuth } from '@/components/auth-provider'
import type { MissionFormData, Mission } from '@/lib/missions/types'

export default function MissionsPage() {
  const router = useRouter()
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

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/sign-in')
    return null
  }

  // Loading state - consistent with other pages
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Background - consistent with other pages */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

      <main className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 md:pt-24 pb-12 md:pl-72">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Mission Control
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track your important tasks across 3 levels
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Connection indicator */}
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                  isConnected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                )}>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  )} />
                  {isConnected ? 'Live' : 'Connecting...'}
                </div>

                <Button
                  onClick={refresh}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                >
                  <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Mission</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error state */}
        {error && (
          <Card className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <CardContent className="py-4">
              <p className="font-medium text-red-700 dark:text-red-300">Error loading missions</p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
          <Card className="text-center py-4 sm:py-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-2">
                <Inbox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{level1.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Pool</p>
            </div>
          </Card>
          <Card className="text-center py-4 sm:py-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-2">
                <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{level2.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Today</p>
            </div>
          </Card>
          <Card className="text-center py-4 sm:py-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{level3.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </div>
          </Card>
        </div>

        {/* Three-column layout (responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
          {/* Level 1: Mission Pool */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-blue-50 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/30 flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Mission Pool</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Important tasks to tackle</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300">
                  {level1.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-[500px] overflow-y-auto">
              <MissionList
                level="pool"
                missions={level1}
                onComplete={handleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddNew={() => setIsAddModalOpen(true)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Level 2: Today's Missions */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/30 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Today&apos;s Missions</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Must complete today</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300">
                  {level2.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-[500px] overflow-y-auto">
              <MissionList
                level="today"
                missions={level2}
                onComplete={handleComplete}
                onFail={handleFail}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* Level 3: Completed */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/30 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Completed</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Recent achievements</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300">
                  {level3.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 max-h-[500px] overflow-y-auto">
              <MissionList
                level="completed"
                missions={level3}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Mission Modal */}
      <AddMissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMission}
      />
    </div>
  )
}
