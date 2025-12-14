"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Flame, BarChart3, Calendar } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card } from "@/components/ui"
import EmptyState from "@/components/empty-state"
import { StatCard } from "@/components/stat-card"
import { useAuth } from "@/components/auth-provider"
import { getTimeBlocks } from "@/lib/storage"
import { calculateOverallStats, calculateStreak, calculateWeekStats } from "@/lib/analytics"
import { formatDate, addDays } from "@/lib/date-utils"
import type { TimeBlock } from "@/lib/types"

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [blocks, setBlocks] = useState<TimeBlock[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
      return
    }

    if (user) {
      const run = async () => {
        const allBlocks = await getTimeBlocks(user.id)
        setBlocks(allBlocks)
      }
      run()
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const overallStats = calculateOverallStats(blocks)
  const streak = calculateStreak(blocks)

  // Get last 7 days stats
  const weekStart = addDays(new Date(), -6)
  const weekStats = calculateWeekStats(blocks, weekStart)

  const categoryColors: Record<string, string> = {
    work: "bg-blue-500",
    personal: "bg-green-500",
    health: "bg-red-500",
    learning: "bg-purple-500",
    social: "bg-pink-500",
    other: "bg-gray-500",
  }

  const categoryLabels: Record<string, string> = {
    work: "Work",
    personal: "Personal",
    health: "Health",
    learning: "Learning",
    social: "Social",
    other: "Other",
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

  <main className="container mx-auto px-4 pt-24 pb-12 md:pl-72">
        <header className="h-16 border-b border-white/20 flex items-center justify-between px-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md sticky top-0 z-30 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your progress and productivity insights</p>
          </div>
        </header>

        {blocks.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />}
            title="No Data Yet"
            description="Start adding time blocks to see your analytics and track your progress"
            className="p-12"
          />
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Current Streak"
                value={streak}
                subtitle={`day${streak !== 1 ? "s" : ""}`}
                icon={<Flame className="w-5 h-5" />}
                gradient="from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
              />
              <StatCard
                title="Completion Rate"
                value={`${overallStats.completionRate}%`}
                subtitle={`${overallStats.completedBlocks} of ${overallStats.totalBlocks} completed`}
                icon={<CheckCircle2 className="w-5 h-5" />}
                gradient="from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
              />
              <StatCard
                title="Total Blocks"
                value={overallStats.totalBlocks}
                subtitle="All time"
                icon={<Calendar className="w-5 h-5" />}
              />
              <StatCard
                title="Total Hours"
                value={overallStats.totalHours}
                subtitle="Scheduled time"
                icon={<Clock className="w-5 h-5" />}
              />
            </div>

            {/* Category Breakdown */}
            <Card className="mb-8 bg-white/60 dark:bg-gray-900/60 border-white/20 dark:border-white/10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Category Breakdown</h2>
              <div className="space-y-4">
                {Object.entries(overallStats.categoryStats)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([category, stats]) => {
                    const percentage = Math.round((stats.count / overallStats.totalBlocks) * 100)
                    const completionRate = Math.round((stats.completed / stats.count) * 100)
                    const hours = Math.round((stats.minutes / 60) * 10) / 10

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${categoryColors[category]} ring-1 ring-white/10 dark:ring-white/10`} />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {categoryLabels[category]}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <span>{stats.count} blocks</span>
                            <span>{hours}h</span>
                            <span className="text-green-600 dark:text-green-400">{completionRate}% done</span>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${categoryColors[category]} transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>

            {/* Weekly Activity */}
            <Card className="bg-white/60 dark:bg-gray-900/60 border-white/20 dark:border-white/10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Last 7 Days</h2>
              <div className="grid grid-cols-7 gap-3">
                {weekStats.map((day) => {
                  const date = new Date(day.date + "T00:00:00")
                  const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
                  const dayNumber = date.getDate()
                  const intensity = day.totalBlocks === 0 ? 0 : Math.min(day.totalBlocks / 5, 1)
                  const isToday = formatDate(new Date()) === day.date

                  return (
                    <div key={day.date} className="flex flex-col items-center">
                      <div
                        className={`w-full aspect-square rounded-xl mb-2 flex flex-col items-center justify-center transition-all ${
                          isToday ? "ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-gray-900" : ""
                        }`}
                        style={{
                          backgroundColor:
                            intensity === 0 ? "rgb(247 250 252 / 0.6)" : `rgba(79, 70, 229, ${0.2 + intensity * 0.6})`,
                        }}
                      >
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-300">{dayName}</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{dayNumber}</div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {day.completedBlocks}/{day.totalBlocks}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
