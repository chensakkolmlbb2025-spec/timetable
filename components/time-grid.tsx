"use client"

import type { TimeBlock as TimeBlockType } from "@/lib/types"
import { timeToMinutes } from "@/lib/date-utils"

interface TimeGridProps {
  startTime: string
  endTime: string
  blocks: TimeBlockType[]
  onTimeSlotClick?: (time: string) => void
  onBlockClick?: (block: TimeBlockType) => void
}

export function TimeGrid({ startTime, endTime, blocks, onTimeSlotClick, onBlockClick }: TimeGridProps) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  let startM = startMinutes
  let endM = endMinutes
  let totalMinutes = endM - startM

  // Safety: ensure a positive range. If invalid, fall back to full day to avoid division by zero
  if (totalMinutes <= 0) {
    startM = 0
    endM = 24 * 60
    totalMinutes = endM - startM
  }

  // Generate hourly slots
  const hours: string[] = []
  for (let m = startM; m < endM; m += 60) {
    const hour = Math.floor(m / 60) % 24
    hours.push(`${hour.toString().padStart(2, "0")}:00`)
  }

  const getBlockPosition = (block: TimeBlockType) => {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)
    // Clamp values to the visible range to avoid overflow
    const clampedStart = Math.max(blockStart, startM)
    const clampedEnd = Math.min(blockEnd, endM)
    const safeHeight = Math.max(clampedEnd - clampedStart, 15) // ensure min height for visibility (minutes)
    const top = ((clampedStart - startM) / totalMinutes) * 100
    const height = (safeHeight / totalMinutes) * 100
    const topClamped = Math.min(Math.max(top, 0), 100)
    const heightClamped = Math.min(Math.max(height, 0), 100 - topClamped)
    return { top: `${topClamped}%`, height: `${heightClamped}%` }
  }

  const categoryColors: Record<string, string> = {
    work: "from-blue-500/80 to-blue-600/80 border-blue-400",
    personal: "from-green-500/80 to-green-600/80 border-green-400",
    health: "from-red-500/80 to-red-600/80 border-red-400",
    learning: "from-purple-500/80 to-purple-600/80 border-purple-400",
    social: "from-pink-500/80 to-pink-600/80 border-pink-400",
    other: "from-gray-500/80 to-gray-600/80 border-gray-400",
  }

  return (
    <div className="relative flex">
      {/* Time labels */}
      <div className="w-20 flex-shrink-0">
        {hours.map((hour) => (
          <div key={hour} className="h-16 flex items-start justify-end pr-4 text-sm text-gray-500 dark:text-gray-400">
            {hour}
          </div>
        ))}
      </div>

      {/* Grid and blocks */}
      <div className="flex-1 relative">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {hours.map((hour, index) => (
            <div
              key={hour}
              className="h-16 border-t border-gray-200 dark:border-gray-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
              onClick={() => onTimeSlotClick?.(hour)}
            />
          ))}
        </div>

        {/* Time blocks */}
        <div className="absolute inset-0">
          {blocks.map((block) => {
            const position = getBlockPosition(block)
            const colorClass = categoryColors[block.category] || categoryColors.other

            return (
              <div
                key={block.id}
                className={`absolute left-2 right-2 rounded-xl backdrop-blur-sm border-2 ${colorClass} bg-gradient-to-r cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group ${
                  block.completed ? "opacity-60" : ""
                }`}
                style={position}
                onClick={() => onBlockClick?.(block)}
              >
                <div className="p-3 h-full flex flex-col text-white">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{block.title}</h3>
                    {block.repeatDaily && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-800/40">Daily</span>
                    )}
                    {block.completed && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {block.description && <p className="text-xs opacity-90 mt-1 line-clamp-2">{block.description}</p>}
                  <div className="mt-auto text-xs opacity-75">
                    {block.startTime} - {block.endTime}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
