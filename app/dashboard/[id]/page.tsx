"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Trash2, Check, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DashboardNav } from "@/components/dashboard-nav"
import { RepeatDaysSelector } from "@/components/ui/repeat-days-selector"
import { useAuth } from "@/components/auth-provider"
import { getTimeBlocks, saveTimeBlock, deleteTimeBlock } from "@/lib/storage"
import type { TimeBlock } from "@/lib/types"

export default function EditTimeBlockPage() {
  const router = useRouter()
  const params = useParams()
  const blockId = params.id as string
  const { user, loading } = useAuth()

  const [block, setBlock] = useState<TimeBlock | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [category, setCategory] = useState<TimeBlock["category"]>("work")
  const [completed, setCompleted] = useState(false)
  const [repeatDaily, setRepeatDaily] = useState(false)
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [showRepeatOptions, setShowRepeatOptions] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
      return
    }

    if (user) {
      const run = async () => {
        const blocks = await getTimeBlocks(user.id)
        const foundBlock = blocks.find((b) => b.id === blockId)

        if (!foundBlock) {
          router.push("/dashboard")
          return
        }

        setBlock(foundBlock)
        setTitle(foundBlock.title)
        setDescription(foundBlock.description || "")
        setDate(foundBlock.date)
        setStartTime(foundBlock.startTime)
        setEndTime(foundBlock.endTime)
        setCategory(foundBlock.category)
        setCompleted(foundBlock.completed)
        setRepeatDaily(!!foundBlock.repeatDaily)
        setRepeatDays(foundBlock.repeatDays || [])
        setShowRepeatOptions(!!foundBlock.repeatDaily || (foundBlock.repeatDays && foundBlock.repeatDays.length > 0) || false)
      }
      run()

      // handled in async load
    }
  }, [user, loading, blockId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !block) return

    setError("")

    // Validation
    if (startTime >= endTime) {
      setError("End time must be after start time")
      return
    }

  setSaving(true)

    const updatedBlock: TimeBlock = {
      ...block,
      title,
      description: description || undefined,
      date,
      startTime,
      endTime,
      category,
      completed,
      repeatDaily,
      repeatDays: repeatDays.length > 0 ? repeatDays : undefined,
    }

    await saveTimeBlock(updatedBlock)
    router.push(`/dashboard?date=${date}`)
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this time block?")) return
    await deleteTimeBlock(blockId)
    router.push("/dashboard")
  }

  const handleToggleComplete = () => {
    setCompleted(!completed)
  }

  if (loading || !user || !block) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const categories: Array<{ value: TimeBlock["category"]; label: string; color: string }> = [
    { value: "work", label: "Work", color: "bg-blue-500" },
    { value: "personal", label: "Personal", color: "bg-green-500" },
    { value: "health", label: "Health", color: "bg-red-500" },
    { value: "learning", label: "Learning", color: "bg-purple-500" },
    { value: "social", label: "Social", color: "bg-pink-500" },
    { value: "other", label: "Other", color: "bg-gray-500" },
  ]

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

  <main className="container mx-auto px-4 pt-24 pb-12 md:pl-72">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Time Block</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Completion toggle */}
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`w-full mb-6 p-4 rounded-xl border-2 transition-all ${
                completed
                  ? "bg-green-50 dark:bg-green-950/30 border-green-500"
                  : "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    completed ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {completed && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {completed ? "Completed" : "Mark as Complete"}
                </span>
              </div>
            </button>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Team Meeting, Gym Session"
                  required
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details about this time block..."
                  rows={3}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Start Time *
                  </label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time *
                  </label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowRepeatOptions(!showRepeatOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
              </div>
              
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category *</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        category === cat.value
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                          : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${cat.color}`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
