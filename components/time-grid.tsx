"use client"

import * as React from "react"
import type { TimeBlock as TimeBlockType } from "@/lib/types"
import { timeToMinutes } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { CATEGORY_COLORS, type CategoryColorKey } from "@/lib/design-system"
import { RefreshCw, CheckCircle2 } from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface TimeGridProps {
  startTime: string
  endTime: string
  blocks: TimeBlockType[]
  onTimeSlotClick?: (time: string) => void
  onBlockClick?: (block: TimeBlockType) => void
  className?: string
}

// ============================================================================
// TIME GRID COMPONENT
// ============================================================================

export function TimeGrid({ 
  startTime, 
  endTime, 
  blocks, 
  onTimeSlotClick, 
  onBlockClick,
  className 
}: TimeGridProps) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  let startM = startMinutes
  let endM = endMinutes
  let totalMinutes = endM - startM

  // Safety: ensure a positive range
  if (totalMinutes <= 0) {
    startM = 0
    endM = 24 * 60
    totalMinutes = endM - startM
  }

  // Generate hourly slots
  const hours: string[] = React.useMemo(() => {
    const result: string[] = []
    for (let m = startM; m < endM; m += 60) {
      const hour = Math.floor(m / 60) % 24
      result.push(`${hour.toString().padStart(2, "0")}:00`)
    }
    return result
  }, [startM, endM])

  // Calculate block position
  const getBlockPosition = React.useCallback((block: TimeBlockType) => {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)
    const clampedStart = Math.max(blockStart, startM)
    const clampedEnd = Math.min(blockEnd, endM)
    const safeHeight = Math.max(clampedEnd - clampedStart, 15)
    const top = ((clampedStart - startM) / totalMinutes) * 100
    const height = (safeHeight / totalMinutes) * 100
    const topClamped = Math.min(Math.max(top, 0), 100)
    const heightClamped = Math.min(Math.max(height, 0), 100 - topClamped)
    return { top: `${topClamped}%`, height: `${heightClamped}%` }
  }, [startM, endM, totalMinutes])

  return (
    <div 
      className={cn("relative flex", className)} 
      role="grid" 
      aria-label="Daily schedule"
    >
      {/* Time labels */}
      <div className="w-14 sm:w-20 flex-shrink-0" role="rowheader">
        {hours.map((hour) => (
          <div 
            key={hour} 
            className="h-16 flex items-start justify-end pr-2 sm:pr-4 text-xs sm:text-sm text-muted-foreground font-medium"
          >
            {hour}
          </div>
        ))}
      </div>

      {/* Grid and blocks */}
      <div className="flex-1 relative min-w-0" role="rowgroup">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {hours.map((hour, index) => (
            <button
              key={`slot-${hour}`}
              type="button"
              className={cn(
                "w-full h-16 border-t border-border/50",
                "hover:bg-primary/5 dark:hover:bg-primary/10",
                "focus-visible:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset",
                "transition-colors cursor-pointer",
                index === 0 && "rounded-t-lg",
                index === hours.length - 1 && "rounded-b-lg border-b"
              )}
              onClick={() => onTimeSlotClick?.(hour)}
              aria-label={`Add block at ${hour}`}
            />
          ))}
        </div>

        {/* Time blocks */}
        <div className="absolute inset-0 pointer-events-none">
          {blocks.map((block) => {
            const position = getBlockPosition(block)
            const categoryColors = CATEGORY_COLORS[block.category as CategoryColorKey] || CATEGORY_COLORS.other

            return (
              <TimeBlockItem
                key={block.id}
                block={block}
                position={position}
                categoryColors={categoryColors}
                onClick={() => onBlockClick?.(block)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TIME BLOCK ITEM COMPONENT
// ============================================================================

interface TimeBlockItemProps {
  block: TimeBlockType
  position: { top: string; height: string }
  categoryColors: typeof CATEGORY_COLORS[keyof typeof CATEGORY_COLORS]
  onClick?: () => void
}

const TimeBlockItem = React.memo(function TimeBlockItem({
  block,
  position,
  categoryColors,
  onClick,
}: TimeBlockItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "absolute left-1 right-1 sm:left-2 sm:right-2",
        "rounded-lg sm:rounded-xl backdrop-blur-sm border-l-4",
        categoryColors.bgGradient,
        categoryColors.border,
        "cursor-pointer pointer-events-auto",
        "transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-lg hover:z-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2",
        "active:scale-[0.98]",
        block.completed && "opacity-60"
      )}
      style={position}
      onClick={onClick}
      aria-label={`${block.title} from ${block.startTime} to ${block.endTime}${block.completed ? ", completed" : ""}`}
    >
      <div className="p-2 sm:p-3 h-full flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-1 sm:gap-2 min-h-0">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 flex-1">
            {block.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            {block.repeatDaily && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                <RefreshCw className="w-2.5 h-2.5" />
                <span className="hidden md:inline">Daily</span>
              </span>
            )}
            {block.completed && (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
          </div>
        </div>
        
        {/* Description - hide on very small blocks */}
        {block.description && (
          <p className="text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
            {block.description}
          </p>
        )}
        
        {/* Time */}
        <div className="mt-auto text-[10px] sm:text-xs opacity-75 pt-1">
          {block.startTime} - {block.endTime}
        </div>
      </div>
    </button>
  )
})

export default TimeGrid
