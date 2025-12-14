import type { TimeBlock, DayStats } from "./types"
import { timeToMinutes, formatDate, addDays } from "./date-utils"

export function calculateWeekStats(blocks: TimeBlock[], startDate: Date): DayStats[] {
  const stats: DayStats[] = []

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i)
    const dateStr = formatDate(date)
    const dayBlocks = blocks.filter((b) => b.date === dateStr)

    const completed = dayBlocks.filter((b) => b.completed)
    const totalMinutes = dayBlocks.reduce((sum, block) => {
      const start = timeToMinutes(block.startTime)
      const end = timeToMinutes(block.endTime)
      return sum + (end - start)
    }, 0)

    const completedMinutes = completed.reduce((sum, block) => {
      const start = timeToMinutes(block.startTime)
      const end = timeToMinutes(block.endTime)
      return sum + (end - start)
    }, 0)

    const categories: Record<string, number> = {}
    dayBlocks.forEach((block) => {
      categories[block.category] = (categories[block.category] || 0) + 1
    })

    stats.push({
      date: dateStr,
      totalBlocks: dayBlocks.length,
      completedBlocks: completed.length,
      totalMinutes,
      completedMinutes,
      categories,
    })
  }

  return stats
}

export function calculateOverallStats(blocks: TimeBlock[]) {
  const totalBlocks = blocks.length
  const completedBlocks = blocks.filter((b) => b.completed).length
  const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0

  const totalHours =
    blocks.reduce((sum, block) => {
      const start = timeToMinutes(block.startTime)
      const end = timeToMinutes(block.endTime)
      return sum + (end - start)
    }, 0) / 60

  const categoryStats: Record<string, { count: number; completed: number; minutes: number }> = {}

  blocks.forEach((block) => {
    if (!categoryStats[block.category]) {
      categoryStats[block.category] = { count: 0, completed: 0, minutes: 0 }
    }
    categoryStats[block.category].count++
    if (block.completed) {
      categoryStats[block.category].completed++
    }
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    categoryStats[block.category].minutes += end - start
  })

  return {
    totalBlocks,
    completedBlocks,
    completionRate,
    totalHours: Math.round(totalHours * 10) / 10,
    categoryStats,
  }
}

export function calculateStreak(blocks: TimeBlock[]): number {
  const dates = [...new Set(blocks.map((b) => b.date))].sort().reverse()
  if (dates.length === 0) return 0

  const today = formatDate(new Date())
  let streak = 0

  // Check if today has any blocks
  if (dates[0] !== today) {
    // Check if yesterday has blocks (to continue streak)
    const yesterday = formatDate(addDays(new Date(), -1))
    if (dates[0] !== yesterday) {
      return 0
    }
  }

  // Count consecutive days
  let currentDate = dates[0] === today ? new Date() : addDays(new Date(), -1)

  for (const date of dates) {
    const expectedDate = formatDate(currentDate)
    if (date === expectedDate) {
      const dayBlocks = blocks.filter((b) => b.date === date)
      const hasCompletedBlocks = dayBlocks.some((b) => b.completed)
      if (hasCompletedBlocks) {
        streak++
      }
      currentDate = addDays(currentDate, -1)
    } else {
      break
    }
  }

  return streak
}
