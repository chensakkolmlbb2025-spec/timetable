"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card } from "@/components/ui"
import { useAuth } from "@/components/auth-provider"
import { getTimeBlocksForDate } from "@/lib/storage"
import { formatDate, formatDisplayDate, addDays } from "@/lib/date-utils"
import type { TimeBlock } from "@/lib/types"
import { downloadPDF, downloadWeeklyPDF } from "@/lib/pdf-export"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const CATEGORY_COLORS: Record<string, string> = {
  work: "bg-blue-500",
  personal: "bg-purple-500",
  health: "bg-green-500",
  learning: "bg-amber-500",
  social: "bg-pink-500",
  other: "bg-gray-500",
}

export default function WeekViewPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const start = new Date(today)
    // Get the Sunday of the current week
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = start.getDay()
    start.setDate(start.getDate() - dayOfWeek)
    // Set to midnight to avoid timezone issues
    start.setHours(0, 0, 0, 0)
    return start
  })
  const [blocks, setBlocks] = useState<TimeBlock[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const run = async () => await loadBlocks()
      run()
    }
  }, [user, weekStart])

  const loadBlocks = async () => {
    if (!user) return
    
    // Load blocks for each day of the week using getTimeBlocksForDate
    // This will automatically include repeat_daily tasks for each day
    const weekBlocks: TimeBlock[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i)
      const dateStr = formatDate(date)
      console.log(`[WeekView] Loading blocks for day ${i} (${DAY_NAMES[i]}): ${dateStr}`)
      const dayBlocks = await getTimeBlocksForDate(user.id, dateStr)
      console.log(`[WeekView] Found ${dayBlocks.length} blocks for ${DAY_NAMES[i]}`)
      weekBlocks.push(...dayBlocks)
    }

    console.log(`[WeekView] Total blocks loaded: ${weekBlocks.length}`)
    setBlocks(weekBlocks)
  }

  const handlePreviousWeek = () => {
    setWeekStart((prev) => {
      const newStart = addDays(prev, -7)
      newStart.setHours(0, 0, 0, 0)
      return newStart
    })
  }

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const newStart = addDays(prev, 7)
      newStart.setHours(0, 0, 0, 0)
      return newStart
    })
  }

  const handleThisWeek = () => {
    const today = new Date()
    const start = new Date(today)
    const dayOfWeek = start.getDay()
    start.setDate(start.getDate() - dayOfWeek)
    start.setHours(0, 0, 0, 0)
    setWeekStart(start)
  }

  const getBlocksForDay = (dayIndex: number): TimeBlock[] => {
    const date = addDays(weekStart, dayIndex)
    const dateStr = formatDate(date)
    const dayBlocks = blocks.filter((b) => b.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime))
    
    console.log(`[WeekView] getBlocksForDay(${dayIndex} - ${DAY_NAMES[dayIndex]}): dateStr=${dateStr}, found ${dayBlocks.length} blocks`)
    
    return dayBlocks
  }

  const handleDownloadWeek = () => {
    if (!user) return

    // Generate single landscape A4 PDF with all 7 days
    const weekEndDate = addDays(weekStart, 6)
    const startStr = formatDate(weekStart)
    const endStr = formatDate(weekEndDate)
    downloadWeeklyPDF(weekStart, blocks, user.name, `timetable-week-${startStr}-to-${endStr}.pdf`)
  }

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

  const weekEnd = addDays(weekStart, 6)

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

  <main className="container mx-auto px-4 pt-24 pb-12 md:pl-72">
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Week View</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDisplayDate(formatDate(weekStart))} - {formatDisplayDate(formatDate(weekEnd))}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousWeek} className="gap-2 bg-transparent">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleThisWeek}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek} className="gap-2 bg-transparent">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleDownloadWeek}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Download className="w-4 h-4" />
                Download Week
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const date = addDays(weekStart, dayIndex)
            const dateStr = formatDate(date)
            const dayBlocks = getBlocksForDay(dayIndex)
            const isToday = formatDate(new Date()) === dateStr
            const completed = dayBlocks.filter((b) => b.completed).length
            const total = dayBlocks.length
            
            // Verify day alignment (0 = Sunday in both DAY_NAMES and getDay())
            const actualDayOfWeek = date.getDay()
            if (actualDayOfWeek !== dayIndex) {
              console.warn(`[WeekView] Day mismatch! dayIndex=${dayIndex} but date.getDay()=${actualDayOfWeek} for ${dateStr}`)
            }

              return (
              <Card
                key={dayIndex}
                className={`p-4 ${isToday ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-white/20"} shadow-lg`}
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{DAY_NAMES[dayIndex]}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  {total > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {completed}/{total} completed
                    </p>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dayBlocks.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-600 italic">No tasks</p>
                  ) : (
                    dayBlocks.map((block) => (
                      <button
                        key={block.id}
                        onClick={() => router.push(`/dashboard/${block.id}`)}
                        className="w-full text-left p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-1 h-full ${CATEGORY_COLORS[block.category]} rounded-full`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{block.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">{block.startTime}</p>
                            {block.completed && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Done</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
