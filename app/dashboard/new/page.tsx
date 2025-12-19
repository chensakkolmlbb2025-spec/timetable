"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// Icons
import { 
  ArrowLeft, 
  Loader2, 
  Briefcase, 
  User, 
  Heart, 
  BookOpen, 
  Users, 
  MoreHorizontal,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  Repeat
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui"
import { Textarea } from "@/components/ui/textarea"
import { DashboardNav } from "@/components/dashboard-nav"
import { RepeatDaysSelector } from "@/components/ui/repeat-days-selector"

// Logic & Storage
import { useAuth } from "@/components/auth-provider"
import { saveTimeBlock, getTimeBlocks } from "@/lib/storage" // Ensure getTimeBlocks is exported from storage
import { formatDate } from "@/lib/date-utils"
import type { TimeBlock } from "@/lib/types"

// --- Helper: Time Calculations ---

const calculateEndTime = (start: string, durationMinutes: number = 60): string => {
  if (!start) return "10:00"
  const [h, m] = start.split(":").map(Number)
  const date = new Date()
  date.setHours(h, m + durationMinutes)
  return date.toTimeString().slice(0, 5)
}

const getDuration = (start: string, end: string): number => {
  if (!start || !end) return 0
  const [h1, m1] = start.split(":").map(Number)
  const [h2, m2] = end.split(":").map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

const formatDurationLabel = (minutes: number) => {
  if (minutes <= 0) return "Invalid duration"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export default function NewTimeBlockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  // --- Form State ---
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(searchParams.get("date") || formatDate(new Date()))
  
  // Read optional duration param (minutes) and time param
  const durationParam = Number(searchParams.get("duration") || "60")

  // Default to 09:00 if no param provided
  const [startTime, setStartTime] = useState(searchParams.get("time") || "09:00")

  // Default end time is start + durationParam (default 60 minutes)
  const [endTime, setEndTime] = useState(
    searchParams.get("time")
      ? calculateEndTime(searchParams.get("time")!, isNaN(durationParam) ? 60 : durationParam)
      : calculateEndTime("09:00", isNaN(durationParam) ? 60 : durationParam)
  )
  
  const [category, setCategory] = useState<TimeBlock["category"]>("work")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [repeatDaily, setRepeatDaily] = useState(false)
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [showRepeatOptions, setShowRepeatOptions] = useState(false)

  // Auth Protection
  useEffect(() => {
    if (!loading && !user) router.push("/sign-in")
  }, [user, loading, router])

  // --- Logic ---

  // Update End Time automatically when Start Time changes (maintain duration)
  const handleStartTimeChange = (newStart: string) => {
    const currentDuration = getDuration(startTime, endTime)
    const validDuration = currentDuration > 0 ? currentDuration : (isNaN(durationParam) ? 60 : durationParam)
    setStartTime(newStart)
    setEndTime(calculateEndTime(newStart, validDuration))
  }

  // Check for Overlaps
  const checkOverlap = async (checkDate: string, start: string, end: string) => {
    try {
      // Assuming existing blocks can be fetched. 
      // If `getTimeBlocks` isn't async in your lib, remove `await`.
      const existingBlocks = await getTimeBlocks(checkDate) 
      
      const hasConflict = existingBlocks.some((block: TimeBlock) => {
        // Skip comparing to itself (not needed for 'create' but good practice)
        return (start < block.endTime && end > block.startTime)
      })
      
      return hasConflict
    } catch (e) {
      console.error("Failed to check overlaps", e)
      return false // Fail open if storage check fails
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError("")
    
    // 1. Basic Validation
    if (!title.trim()) {
      setError("Please enter a title for your block.")
      return
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.")
      return
    }

    setSaving(true)

    try {
      // 2. Advanced Conflict Validation
      const isOverlapping = await checkOverlap(date, startTime, endTime)
      if (isOverlapping) {
        setError("Time Conflict: You already have a block scheduled during this time.")
        setSaving(false)
        return
      }

      // 3. Create Object
      const newBlock: TimeBlock = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        startTime,
        endTime,
        category,
        repeatDaily,
        repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
        color: "", // Logic handled by renderer
        completed: false,
        createdAt: new Date().toISOString(),
      }

      // 4. Save
      await saveTimeBlock(newBlock)
      router.push(`/dashboard?date=${date}`)
      
    } catch (err) {
      console.error(err)
      setError("Failed to save time block. Please try again.")
      setSaving(false)
    }
  }

  // --- Configuration ---
  const categories = useMemo(() => [
    { value: "work", label: "Work", color: "bg-blue-500", icon: Briefcase },
    { value: "personal", label: "Personal", color: "bg-green-500", icon: User },
    { value: "health", label: "Health", color: "bg-red-500", icon: Heart },
    { value: "learning", label: "Learning", color: "bg-purple-500", icon: BookOpen },
    { value: "social", label: "Social", color: "bg-pink-500", icon: Users },
    { value: "other", label: "Other", color: "bg-gray-500", icon: MoreHorizontal },
  ] as const, [])

  const durationLabel = formatDurationLabel(getDuration(startTime, endTime))

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <DashboardNav />

  <main className="container mx-auto px-4 pt-24 pb-12 md:pl-72">
        <div className="max-w-2xl mx-auto">
          
          {/* Navigation */}
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-6 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Main Card */}
              <Card>
                <CardHeader>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create Time Block
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    Schedule a new activity for {date === formatDate(new Date()) ? "today" : date}.
                  </p>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  What are you working on?
                </label>
                <Input
                  id="title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep Work, Gym Session, Team Sync"
                  className="h-12 text-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Date */}
                <div className="space-y-2">
                  <label htmlFor="date" className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <CalendarIcon className="w-4 h-4 mr-2 text-indigo-500" />
                    Date
                  </label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Time Range */}
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                        Time
                      </label>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        Duration: {durationLabel}
                      </span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                      <span className="text-gray-400">-</span>
                      <Input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                   </div>
                </div>
              </div>

              {/* Repeat Options */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowRepeatOptions(!showRepeatOptions)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Repeat className="w-4 h-4" />
                  Repeat Schedule
                  <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    repeatDaily || repeatDays.length > 0
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}>
                    {repeatDaily ? "Daily" : repeatDays.length > 0 ? `${repeatDays.length} days` : "Off"}
                  </span>
                </button>
                
                {showRepeatOptions && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <RepeatDaysSelector
                      selectedDays={repeatDays}
                      onChange={(days) => {
                        setRepeatDays(days)
                        if (days.length > 0) setRepeatDaily(false)
                      }}
                      repeatDaily={repeatDaily}
                      onRepeatDailyChange={(daily) => {
                        setRepeatDaily(daily)
                        if (daily) setRepeatDays([])
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, links, or goals..."
                  rows={3}
                  className="resize-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = category === cat.value
                    
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`
                          relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
                          ${isSelected 
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600/20" 
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }
                        `}
                      >
                        <div className={`
                          p-2 rounded-full mb-2 transition-colors
                          ${isSelected ? cat.color.replace('bg-', 'bg-') + ' text-white' : 'bg-gray-100 dark:bg-gray-700'}
                        `}>
                           <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                        </div>
                        <span className="text-xs font-medium">{cat.label}</span>
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 h-12"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Create Block"
                  )}
                </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}