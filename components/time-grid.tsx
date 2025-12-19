"use client"

import * as React from "react"
import type { TimeBlock as TimeBlockType } from "@/lib/types"
import { timeToMinutes } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { CATEGORY_COLORS, type CategoryColorKey } from "@/lib/design-system"
import { RefreshCw, CheckCircle2, Repeat } from "lucide-react"
import { formatSelectedDays } from "@/components/ui/repeat-days-selector"

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
  /** Minimum block height in pixels to ensure readability */
  minBlockHeight?: number
  /** Show 15-minute interval lines for better precision */
  showQuarterHours?: boolean
}

interface BlockPosition {
  top: number    // percentage
  height: number // percentage
  column: number // which column (for overlaps)
  totalColumns: number // total columns in this time range
}

interface ProcessedBlock {
  block: TimeBlockType
  position: BlockPosition
  categoryColors: typeof CATEGORY_COLORS[keyof typeof CATEGORY_COLORS]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect overlapping blocks and assign them to columns
 * This ensures blocks don't visually overlap
 */
function calculateBlockColumns(blocks: TimeBlockType[], startMinutes: number, endMinutes: number): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>()
  
  // Sort blocks by start time, then by duration
  const sortedBlocks = [...blocks].sort((a, b) => {
    const aStart = timeToMinutes(a.startTime)
    const bStart = timeToMinutes(b.startTime)
    if (aStart !== bStart) return aStart - bStart
    
    const aDuration = timeToMinutes(a.endTime) - aStart
    const bDuration = timeToMinutes(b.endTime) - bStart
    return bDuration - aDuration // longer blocks first
  })
  
  // Group overlapping blocks
  const groups: TimeBlockType[][] = []
  
  for (const block of sortedBlocks) {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)
    
    // Find a group this block overlaps with
    let addedToGroup = false
    for (const group of groups) {
      const overlapsWithGroup = group.some(existingBlock => {
        const existingStart = timeToMinutes(existingBlock.startTime)
        const existingEnd = timeToMinutes(existingBlock.endTime)
        return blockStart < existingEnd && blockEnd > existingStart
      })
      
      if (overlapsWithGroup) {
        group.push(block)
        addedToGroup = true
        break
      }
    }
    
    if (!addedToGroup) {
      groups.push([block])
    }
  }
  
  // Assign columns within each group
  for (const group of groups) {
    const columns: TimeBlockType[][] = []
    
    for (const block of group) {
      const blockStart = timeToMinutes(block.startTime)
      const blockEnd = timeToMinutes(block.endTime)
      
      // Find the first column where this block doesn't overlap
      let assignedColumn = -1
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const column = columns[colIndex]
        const hasOverlap = column.some(existingBlock => {
          const existingStart = timeToMinutes(existingBlock.startTime)
          const existingEnd = timeToMinutes(existingBlock.endTime)
          return blockStart < existingEnd && blockEnd > existingStart
        })
        
        if (!hasOverlap) {
          column.push(block)
          assignedColumn = colIndex
          break
        }
      }
      
      // If no suitable column found, create a new one
      if (assignedColumn === -1) {
        columns.push([block])
        assignedColumn = columns.length - 1
      }
      
      result.set(block.id, {
        column: assignedColumn,
        totalColumns: columns.length
      })
    }
  }
  
  return result
}

/**
 * Calculate duration in minutes
 */
function getBlockDuration(block: TimeBlockType): number {
  return timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
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
  className,
  minBlockHeight = 32,
  showQuarterHours = true
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

  // Calculate block columns for overlap prevention
  const blockColumns = React.useMemo(() => 
    calculateBlockColumns(blocks, startM, endM),
    [blocks, startM, endM]
  )

  // Generate hourly slots
  const hours: string[] = React.useMemo(() => {
    const result: string[] = []
    for (let m = startM; m < endM; m += 60) {
      const hour = Math.floor(m / 60) % 24
      result.push(`${hour.toString().padStart(2, "0")}:00`)
    }
    return result
  }, [startM, endM])
  
  // Generate 15-minute interval markers
  const quarterHours = React.useMemo(() => {
    if (!showQuarterHours) return []
    const result: { time: string; position: number }[] = []
    for (let m = startM + 15; m < endM; m += 15) {
      if (m % 60 !== 0) { // Skip full hours
        const position = ((m - startM) / totalMinutes) * 100
        const hour = Math.floor(m / 60) % 24
        const minute = m % 60
        result.push({
          time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          position
        })
      }
    }
    return result
  }, [startM, endM, totalMinutes, showQuarterHours])

  // Calculate block position with minimum height enforcement
  const getBlockPosition = React.useCallback((block: TimeBlockType): BlockPosition => {
    const blockStart = timeToMinutes(block.startTime)
    const blockEnd = timeToMinutes(block.endTime)
    const clampedStart = Math.max(blockStart, startM)
    const clampedEnd = Math.min(blockEnd, endM)
    
    // Calculate position as percentage
    const top = ((clampedStart - startM) / totalMinutes) * 100
    let height = ((clampedEnd - clampedStart) / totalMinutes) * 100
    
    // Ensure minimum height for very small blocks (15 min = ~3% of 8-hour day)
    const minHeightPercent = (minBlockHeight / (totalMinutes * 1.5)) * 100 // rough estimate
    height = Math.max(height, minHeightPercent)
    
    // Clamp values
    const topClamped = Math.min(Math.max(top, 0), 100)
    const heightClamped = Math.min(Math.max(height, 0), 100 - topClamped)
    
    // Get column info
    const columnInfo = blockColumns.get(block.id) || { column: 0, totalColumns: 1 }
    
    return { 
      top: topClamped, 
      height: heightClamped,
      column: columnInfo.column,
      totalColumns: columnInfo.totalColumns
    }
  }, [startM, endM, totalMinutes, minBlockHeight, blockColumns])

  // Process all blocks
  const processedBlocks: ProcessedBlock[] = React.useMemo(() => {
    return blocks.map(block => ({
      block,
      position: getBlockPosition(block),
      categoryColors: CATEGORY_COLORS[block.category as CategoryColorKey] || CATEGORY_COLORS.other
    }))
  }, [blocks, getBlockPosition])

  return (
    <div 
      className={cn("relative flex", className)} 
      role="grid" 
      aria-label="Daily schedule"
    >
      {/* Time labels */}
      <div className="w-16 sm:w-20 flex-shrink-0" role="rowheader">
        {hours.map((hour) => (
          <div 
            key={hour} 
            className="h-20 flex items-start justify-end pr-3 sm:pr-4 text-xs sm:text-sm text-muted-foreground font-medium"
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
                "w-full h-20 border-t border-border/50",
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
          
          {/* 15-minute interval markers */}
          {quarterHours.map(({ time, position }) => (
            <div
              key={time}
              className="absolute left-0 right-0 h-px bg-border/20"
              style={{ top: `${position}%` }}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Time blocks */}
        <div className="absolute inset-0 pointer-events-none">
          {processedBlocks.map(({ block, position, categoryColors }) => (
            <TimeBlockItem
              key={block.id}
              block={block}
              position={position}
              categoryColors={categoryColors}
              onClick={() => onBlockClick?.(block)}
            />
          ))}
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
  position: BlockPosition
  categoryColors: typeof CATEGORY_COLORS[keyof typeof CATEGORY_COLORS]
  onClick?: () => void
}

const TimeBlockItem = React.memo(function TimeBlockItem({
  block,
  position,
  categoryColors,
  onClick,
}: TimeBlockItemProps) {
  const duration = getBlockDuration(block)
  const isSmall = duration <= 30
  const isTiny = duration <= 15
  
  // Calculate column-based positioning to prevent overlaps
  const columnWidth = 100 / position.totalColumns
  const leftOffset = position.column * columnWidth
  const width = columnWidth
  
  // Adjust padding for overlapped blocks
  const hasOverlap = position.totalColumns > 1
  const gapPx = hasOverlap ? 2 : 4
  
  const inlineStyle = {
    top: `${position.top}%`,
    height: `${position.height}%`,
    left: `calc(${leftOffset}% + ${gapPx}px)`,
    right: `calc(${100 - leftOffset - width}% + ${gapPx}px)`,
  }
  
  return (
    <button
      type="button"
      className={cn(
        "absolute pointer-events-auto overflow-hidden rounded-lg shadow-sm border transition-all",
        "hover:shadow-md hover:scale-[1.02] hover:z-10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:z-10",
        "active:scale-[0.98]",
        categoryColors.bgGradient,
        categoryColors.border,
        block.completed ? "opacity-70 hover:opacity-90" : "opacity-100",
        // Smaller text for tiny blocks
        isTiny ? "text-xs" : isSmall ? "text-sm" : "text-sm"
      )}
      style={inlineStyle}
      onClick={onClick}
      aria-label={`${block.title} from ${block.startTime} to ${block.endTime}${block.completed ? ", completed" : ""}`}
    >
      <div className={cn(
        "h-full flex flex-col text-white overflow-hidden",
        isTiny ? "p-1.5" : isSmall ? "p-2" : "p-2 sm:p-3"
      )}>
        {/* Header: Time and badges */}
        <div className="flex items-start justify-between gap-1 mb-0.5 flex-shrink-0 min-h-0">
          <span className={cn(
            "font-semibold truncate",
            isTiny ? "text-[10px]" : isSmall ? "text-xs" : "text-xs sm:text-sm"
          )}>
            {block.startTime}–{block.endTime}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {block.repeatDaily && (
              <RefreshCw 
                className={cn(
                  "flex-shrink-0",
                  isTiny ? "w-2.5 h-2.5" : "w-3 h-3"
                )} 
                aria-label="Repeats daily"
              />
            )}
            {block.repeatDays && block.repeatDays.length > 0 && !block.repeatDaily && (
              <Repeat 
                className={cn(
                  "flex-shrink-0",
                  isTiny ? "w-2.5 h-2.5" : "w-3 h-3"
                )} 
                aria-label={`Repeats on ${formatSelectedDays(block.repeatDays)}`}
              />
            )}
            {block.completed && (
              <CheckCircle2 
                className={cn(
                  "flex-shrink-0",
                  isTiny ? "w-3 h-3" : "w-4 h-4"
                )} 
                aria-label="Completed"
              />
            )}
          </div>
        </div>
        
        {/* Title - always show, but truncate for small blocks */}
        <div className={cn(
          "font-semibold flex-shrink-0",
          isTiny ? "text-[10px] line-clamp-1" : isSmall ? "text-xs line-clamp-1" : "text-xs sm:text-sm line-clamp-2"
        )}>
          {block.title}
        </div>
        
        {/* Description - only show if not tiny */}
        {!isTiny && block.description && (
          <div className={cn(
            "opacity-90 mt-0.5 flex-1 overflow-hidden",
            isSmall ? "text-[10px] line-clamp-1" : "text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2"
          )}>
            {block.description}
          </div>
        )}
        
        {/* Repeat info for tiny blocks - show compact badge */}
        {isTiny && (block.repeatDaily || (block.repeatDays && block.repeatDays.length > 0)) && (
          <div className="mt-0.5 text-[9px] truncate opacity-75">
            {block.repeatDaily ? "Daily" : formatSelectedDays(block.repeatDays || [])}
          </div>
        )}
      </div>
    </button>
  )
})

export default TimeGrid
