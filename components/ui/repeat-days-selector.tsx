"use client"

import { cn } from "@/lib/utils"
import { DAYS_OF_WEEK, type DayIndex } from "@/lib/types"

interface RepeatDaysSelectorProps {
  selectedDays: number[]
  onChange: (days: number[]) => void
  repeatDaily?: boolean
  onRepeatDailyChange?: (daily: boolean) => void
  className?: string
  disabled?: boolean
  /** Start week on Monday (1) or Sunday (0). Default: 1 (Monday) */
  weekStartDay?: 0 | 1
}

/**
 * A component for selecting which days of the week a task should repeat on.
 * Shows all 7 days as toggleable buttons.
 */
export function RepeatDaysSelector({
  selectedDays,
  onChange,
  repeatDaily = false,
  onRepeatDailyChange,
  className,
  disabled = false,
  weekStartDay = 1,
}: RepeatDaysSelectorProps) {
  // Reorder days based on weekStartDay preference
  const orderedDays = weekStartDay === 1
    ? [...DAYS_OF_WEEK.slice(1), DAYS_OF_WEEK[0]] // Mon-Sun
    : DAYS_OF_WEEK // Sun-Sat

  const toggleDay = (dayIndex: DayIndex) => {
    if (disabled || repeatDaily) return
    
    if (selectedDays.includes(dayIndex)) {
      onChange(selectedDays.filter((d) => d !== dayIndex))
    } else {
      onChange([...selectedDays, dayIndex].sort())
    }
  }

  const selectWeekdays = () => {
    if (disabled || repeatDaily) return
    onChange([1, 2, 3, 4, 5]) // Mon-Fri
  }

  const selectWeekends = () => {
    if (disabled || repeatDaily) return
    onChange([0, 6]) // Sat, Sun
  }

  const selectAll = () => {
    if (disabled) return
    if (onRepeatDailyChange) {
      onRepeatDailyChange(true)
      onChange([])
    } else {
      onChange([0, 1, 2, 3, 4, 5, 6])
    }
  }

  const clearAll = () => {
    if (disabled) return
    if (onRepeatDailyChange) {
      onRepeatDailyChange(false)
    }
    onChange([])
  }

  const hasSelection = selectedDays.length > 0 || repeatDaily

  return (
    <div className={cn("space-y-3", className)}>
      {/* Repeat Daily Toggle */}
      {onRepeatDailyChange && (
        <div className="flex items-center gap-3">
          <input
            id="repeatDaily"
            type="checkbox"
            checked={repeatDaily}
            onChange={(e) => {
              onRepeatDailyChange(e.target.checked)
              if (e.target.checked) {
                onChange([]) // Clear specific days when enabling daily
              }
            }}
            disabled={disabled}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-0 disabled:opacity-50"
          />
          <label 
            htmlFor="repeatDaily" 
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Repeat every day
          </label>
        </div>
      )}

      {/* Days Selection */}
      <div className={cn(
        "transition-opacity",
        repeatDaily && "opacity-50 pointer-events-none"
      )}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {orderedDays.map((day) => {
            const isSelected = selectedDays.includes(day.index)
            
            return (
              <button
                key={day.index}
                type="button"
                onClick={() => toggleDay(day.index as DayIndex)}
                disabled={disabled || repeatDaily}
                title={day.full}
                className={cn(
                  "w-10 h-10 rounded-lg text-xs font-semibold transition-all duration-200",
                  "border focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {day.short}
              </button>
            )
          })}
        </div>

        {/* Quick Select Buttons */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={selectWeekdays}
            disabled={disabled || repeatDaily}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full transition-colors",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
              "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Weekdays
          </button>
          <button
            type="button"
            onClick={selectWeekends}
            disabled={disabled || repeatDaily}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full transition-colors",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
              "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Weekends
          </button>
          {!hasSelection ? (
            <button
              type="button"
              onClick={selectAll}
              disabled={disabled}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full transition-colors",
                "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Every Day
            </button>
          ) : (
            <button
              type="button"
              onClick={clearAll}
              disabled={disabled}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full transition-colors",
                "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                "hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {hasSelection && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {repeatDaily 
            ? "Repeats every day"
            : `Repeats on ${formatSelectedDays(selectedDays, weekStartDay)}`
          }
        </p>
      )}
    </div>
  )
}

/**
 * Format selected days into a human-readable string
 */
function formatSelectedDays(days: number[], weekStartDay: 0 | 1 = 1): string {
  if (days.length === 0) return "no days"
  if (days.length === 7) return "every day"
  
  // Check for weekdays only
  const weekdays = [1, 2, 3, 4, 5]
  const isWeekdaysOnly = days.length === 5 && weekdays.every((d) => days.includes(d))
  if (isWeekdaysOnly) return "weekdays"
  
  // Check for weekends only
  const weekends = [0, 6]
  const isWeekendsOnly = days.length === 2 && weekends.every((d) => days.includes(d))
  if (isWeekendsOnly) return "weekends"
  
  // Order days based on week start preference
  const orderedDays = weekStartDay === 1
    ? [...DAYS_OF_WEEK.slice(1), DAYS_OF_WEEK[0]]
    : DAYS_OF_WEEK
  
  // Sort days according to preferred order
  const sortedDays = [...days].sort((a, b) => {
    const aOrder = orderedDays.findIndex((d) => d.index === a)
    const bOrder = orderedDays.findIndex((d) => d.index === b)
    return aOrder - bOrder
  })
  
  return sortedDays
    .map((d) => DAYS_OF_WEEK.find((day) => day.index === d)?.short)
    .join(", ")
}

/**
 * Export utility function for use elsewhere
 */
export { formatSelectedDays }
