"use client"

// Calendar removed from dashboard empty state per user request

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui"
import EmptyState from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import { DashboardNav } from "@/components/dashboard-nav"
import { TimeGrid } from "@/components/time-grid"
import { TimeBlockModal } from "@/components/time-block-modal"
import { useAuth } from "@/components/auth-provider"
import {
  getTimeBlocksForDate,
  getUserPreferences,
  saveDefaultTemplate,
  getDefaultTemplates,
  updateTimeBlock,
  deleteTimeBlock,
  applyTemplateToAllDays,
} from "@/lib/storage"
import { formatDate, formatDisplayDate, addDays, isSameDay } from "@/lib/date-utils"
import type { TimeBlock, DefaultTemplate } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [preferences, setPreferences] = useState({ defaultDayStart: "06:00", defaultDayEnd: "22:00" })
  const [quickTime, setQuickTime] = useState(preferences.defaultDayStart)
  const [quickDuration, setQuickDuration] = useState<number>(60)
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
    }
  }, [user, loading, router])

  const loadBlocks = useCallback(async () => {
    if (!user) return
    const dateStr = formatDate(currentDate)
    console.log('[Dashboard] Loading blocks for date:', dateStr)
    const dayBlocks = await getTimeBlocksForDate(user.id, dateStr)
    console.log('[Dashboard] Loaded blocks:', dayBlocks.length)
    setBlocks(dayBlocks)
  }, [user, currentDate])

  useEffect(() => {
    if (user) {
      const load = async () => {
        const prefs = await getUserPreferences(user.id)
        setPreferences(prefs)
        await loadBlocks()
      }
      load()
    }
  }, [user, currentDate, loadBlocks])

  // Reload blocks when page becomes visible (e.g., returning from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('[Dashboard] Page became visible, reloading blocks...')
        loadBlocks()
      }
    }

    const handleFocus = () => {
      if (user) {
        console.log('[Dashboard] Window gained focus, reloading blocks...')
        loadBlocks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, loadBlocks])

  // Keep quickTime in sync with user preferences when loaded
  useEffect(() => {
    if (preferences?.defaultDayStart) setQuickTime(preferences.defaultDayStart)
  }, [preferences])

  const calculateQuickEnd = (start: string, duration: number) => {
    if (!start) return ""
    const [h, m] = start.split(":").map(Number)
    const date = new Date()
    date.setHours(h, m + duration)
    return date.toTimeString().slice(0, 5)
  }

  const handlePreviousDay = () => {
    setCurrentDate((prev) => addDays(prev, -1))
  }

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleBlockClick = (block: TimeBlock) => {
    setSelectedBlock(block)
    setIsModalOpen(true)
  }

  const handleSaveBlock = async (updatedBlock: TimeBlock) => {
    if (!user) return
    await updateTimeBlock(updatedBlock)
    await loadBlocks()
    toast({
      title: "Block updated",
      description: "Your time block has been updated successfully",
    })
  }

  // Handle drag-and-drop rescheduling
  const handleBlockReschedule = async (block: TimeBlock, newStartTime: string, newEndTime: string) => {
    if (!user) return
    
    try {
      const updatedBlock = {
        ...block,
        startTime: newStartTime,
        endTime: newEndTime,
      }
      
      await updateTimeBlock(updatedBlock)
      await loadBlocks()
      
      toast({
        title: "Block rescheduled",
        description: `"${block.title}" moved to ${newStartTime} - ${newEndTime}`,
      })
    } catch (error) {
      console.error('[Dashboard] Failed to reschedule block:', error)
      toast({
        title: "Failed to reschedule",
        description: "Could not update the time block. Please try again.",
        variant: "destructive",
      })
      // Reload to reset the UI
      await loadBlocks()
    }
  }

  const handleDeleteBlock = async () => {
    if (!user || !selectedBlock) return
    await deleteTimeBlock(selectedBlock.id)
    setIsModalOpen(false)
    setSelectedBlock(null)
    await loadBlocks()
    toast({
      title: "Block deleted",
      description: "Your time block has been removed",
    })
  }

  const handleToggleComplete = async () => {
    if (!user || !selectedBlock) return
    const updatedBlock = { ...selectedBlock, completed: !selectedBlock.completed }
    await updateTimeBlock(updatedBlock)
    setSelectedBlock(updatedBlock)
    await loadBlocks()
    toast({
      title: selectedBlock.completed ? "Marked as incomplete" : "Marked as complete",
      description: `"${selectedBlock.title}" status updated`,
    })
  }

  const handleSetAsDefault = async () => {
    if (!user || blocks.length === 0) {
      toast({
        title: "No blocks to save",
        description: "Add some time blocks to this day before setting as default",
        variant: "destructive",
      })
      return
    }

    const dayOfWeek = currentDate.getDay()
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    const template: DefaultTemplate = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: `${dayNames[dayOfWeek]} Template`,
      dayOfWeek,
      blocks: blocks.map((block) => ({
        title: block.title,
        description: block.description,
        startTime: block.startTime,
        endTime: block.endTime,
        category: block.category,
        repeatDaily: block.repeatDaily,
        color: block.color,
      })),
      createdAt: new Date().toISOString(),
    }

  const existingTemplates = await getDefaultTemplates(user.id)
    const existingTemplate = existingTemplates.find((t) => t.dayOfWeek === dayOfWeek)
    if (existingTemplate) {
      template.id = existingTemplate.id
    }

  await saveDefaultTemplate(template)

    toast({
      title: "Template saved",
      description: `${dayNames[dayOfWeek]}'s schedule has been saved as your default template`,
    })
  }

  const handleApplyTemplateToAllDays = async () => {
    if (!user) return

    const dayOfWeek = currentDate.getDay()
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    try {
      const blocksCreated = await applyTemplateToAllDays(user.id, dayOfWeek, 12)
      
      // Reload current day's blocks
      await loadBlocks()

      toast({
        title: "Template applied",
        description: `Applied ${dayNames[dayOfWeek]}'s template to all future ${dayNames[dayOfWeek]}s (${blocksCreated} blocks created for next 12 weeks)`,
      })
    } catch (error) {
      console.error('[Dashboard] Failed to apply template:', error)
      toast({
        title: "Failed to apply template",
        description: error instanceof Error ? error.message : "No template found for this day",
        variant: "destructive",
      })
    }
  }

  const isToday = isSameDay(currentDate, new Date())

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const cardClass =
    "backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-xl border border-white/20 p-6 mb-6"

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

  <main className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 md:pt-24 pb-12 md:pl-72">
        {/* Date navigation */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatDisplayDate(formatDate(currentDate))}
                </h1>
                {isToday && <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Today</p>}
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousDay} 
                  className="flex-1 sm:flex-none gap-1 sm:gap-2 bg-transparent h-9 sm:h-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                {!isToday && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleToday}
                    className="flex-1 sm:flex-none h-9 sm:h-10"
                  >
                    Today
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextDay} 
                  className="flex-1 sm:flex-none gap-1 sm:gap-2 bg-transparent h-9 sm:h-10"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

  {/* Timetable grid */}
  <Card className="mb-0 mt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Schedule</h2>
            
            {/* Quick add controls - Stack on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {blocks.length > 0 && (
                <>
                  <Button 
                    onClick={handleSetAsDefault} 
                    variant="outline" 
                    className="gap-2 bg-transparent h-10 sm:h-auto order-last sm:order-first"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Set as Default</span>
                    <span className="sm:hidden">Save Template</span>
                  </Button>
                  
                  <Button 
                    onClick={handleApplyTemplateToAllDays} 
                    variant="default"
                    className="gap-2 h-10 sm:h-auto order-last sm:order-first bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Apply to All {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][currentDate.getDay()]}days</span>
                    <span className="sm:hidden">Apply to All</span>
                  </Button>
                </>
              )}

              {/* Time and duration controls */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Input
                  type="time"
                  value={quickTime}
                  onChange={(e) => setQuickTime(e.target.value)}
                  className="h-10 flex-1 sm:w-28 bg-white/60 dark:bg-gray-800/60 text-base"
                  aria-label="Start time"
                />

                <select
                  value={String(quickDuration)}
                  onChange={(e) => setQuickDuration(Number(e.target.value))}
                  className="h-10 flex-1 sm:flex-initial bg-white/60 dark:bg-gray-800/60 rounded-md border border-gray-200 dark:border-gray-800 px-2 sm:px-3 text-sm"
                  aria-label="Duration"
                >
                  <option value={15}>15m</option>
                  <option value={30}>30m</option>
                  <option value={45}>45m</option>
                  <option value={60}>1h</option>
                  <option value={90}>1h 30m</option>
                  <option value={120}>2h</option>
                </select>
                <div className="text-xs text-gray-500 hidden lg:block whitespace-nowrap">
                  Ends: {calculateQuickEnd(quickTime, quickDuration)}
                </div>
              </div>

              <Button
                onClick={() => router.push(`/dashboard/new?date=${formatDate(currentDate)}&time=${quickTime}&duration=${quickDuration}`)}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-10 sm:h-auto active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Time Block</span>
                <span className="sm:hidden">Add Block</span>
              </Button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <EmptyState
              title="No time blocks yet"
              description="Start planning your day by adding your first time block"
              ctaText="Create Time Block"
              onCta={() => router.push(`/dashboard/new?date=${formatDate(currentDate)}`)}
            />
          ) : (
            <TimeGrid
              startTime={preferences.defaultDayStart}
              endTime={preferences.defaultDayEnd}
              blocks={blocks}
              onTimeSlotClick={(time) => router.push(`/dashboard/new?date=${formatDate(currentDate)}&time=${time}`)}
              onBlockClick={handleBlockClick}
              onBlockReschedule={handleBlockReschedule}
              enableDragDrop={true}
              snapInterval={15}
            />
          )}
        </Card>

        {/* Daily stats */}
        {blocks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-6">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Blocks</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{blocks.length}</p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {blocks.filter((b) => b.completed).length}
              </p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/20 p-4 sm:p-5 sm:col-span-2 md:col-span-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {blocks.length > 0 ? Math.round((blocks.filter((b) => b.completed).length / blocks.length) * 100) : 0}%
              </p>
            </div>
          </div>
        )}
      </main>

      {selectedBlock && (
        <TimeBlockModal
          block={selectedBlock}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedBlock(null)
          }}
          onSave={handleSaveBlock}
          onDelete={handleDeleteBlock}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </div>
  )
}
