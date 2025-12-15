'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Target, Zap, Star, Clock, CalendarClock, Briefcase, User, Heart, BookOpen, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MissionFormData, MissionPriority, MissionDifficulty } from '@/lib/missions/types'

interface AddMissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MissionFormData) => Promise<void>
  timeblocks?: Array<{ id: string; title: string; start_time: string }>
}

const priorityOptions: Array<{ value: MissionPriority; label: string; icon: typeof Zap; color: string }> = [
  { value: 'critical', label: 'Critical', icon: Zap, color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-400/30' },
  { value: 'high', label: 'High', icon: Star, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-400/30' },
  { value: 'medium', label: 'Medium', icon: Target, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-400/30' },
  { value: 'low', label: 'Low', icon: Clock, color: 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-500/20 border-gray-300 dark:border-slate-400/30' },
]

const difficultyOptions: Array<{ value: MissionDifficulty; label: string; color: string }> = [
  { value: 'easy', label: 'Easy', color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-400/30' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-400/30' },
  { value: 'hard', label: 'Hard', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-400/30' },
  { value: 'extreme', label: 'Extreme', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-400/30' },
]

const categoryOptions: Array<{ value: 'work' | 'personal' | 'health' | 'learning' | 'social' | 'other'; label: string; icon: typeof Briefcase; color: string }> = [
  { value: 'work', label: 'Work', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-blue-300 dark:border-blue-400/30' },
  { value: 'personal', label: 'Personal', icon: User, color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-400/30' },
  { value: 'health', label: 'Health', icon: Heart, color: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-400/30' },
  { value: 'learning', label: 'Learning', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-400/30' },
  { value: 'social', label: 'Social', icon: Users, color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-400/30' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/20 border-gray-300 dark:border-gray-400/30' },
]

export function AddMissionModal({ isOpen, onClose, onSubmit }: AddMissionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<MissionPriority>('medium')
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New scheduling fields
  const [scheduleToTimetable, setScheduleToTimetable] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledStartTime, setScheduledStartTime] = useState('')
  const [scheduledEndTime, setScheduledEndTime] = useState('')
  const [category, setCategory] = useState<'work' | 'personal' | 'health' | 'learning' | 'social' | 'other'>('work')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!deadline) {
      setError('Deadline is required')
      return
    }
    
    // Validate scheduling fields if enabled
    if (scheduleToTimetable) {
      if (!scheduledDate) {
        setError('Schedule date is required when adding to timetable')
        return
      }
      if (!scheduledStartTime) {
        setError('Start time is required when adding to timetable')
        return
      }
      if (!scheduledEndTime) {
        setError('End time is required when adding to timetable')
        return
      }
      if (scheduledStartTime >= scheduledEndTime) {
        setError('End time must be after start time')
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        deadline,
        priority,
        difficulty,
        // Include scheduling data if enabled
        ...(scheduleToTimetable && {
          scheduled_date: scheduledDate,
          scheduled_start_time: scheduledStartTime,
          scheduled_end_time: scheduledEndTime,
          category,
        }),
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setDeadline('')
      setPriority('medium')
      setDifficulty('medium')
      setScheduleToTimetable(false)
      setScheduledDate('')
      setScheduledStartTime('')
      setScheduledEndTime('')
      setCategory('work')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mission')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  // Auto-set schedule date when deadline changes
  const handleDeadlineChange = (newDeadline: string) => {
    setDeadline(newDeadline)
    if (!scheduledDate && newDeadline) {
      setScheduledDate(newDeadline)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-4 top-[5%] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-lg"
          >
            <div className={cn(
              'relative overflow-hidden rounded-2xl',
              'bg-white dark:bg-slate-900/90 backdrop-blur-2xl',
              'border border-gray-200 dark:border-white/10',
              'shadow-2xl'
            )}>
              {/* Gradient decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Mission</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-400/30 text-red-700 dark:text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    Mission Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                      'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30',
                      'focus:outline-none focus:border-indigo-400 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-blue-400/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details about this mission..."
                    rows={3}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl resize-none',
                      'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                      'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30',
                      'focus:outline-none focus:border-indigo-400 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-blue-400/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline *</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => handleDeadlineChange(e.target.value)}
                    min={getTodayDate()}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                      'text-gray-900 dark:text-white dark:[color-scheme:dark]',
                      'focus:outline-none focus:border-indigo-400 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-indigo-400/20 dark:focus:ring-blue-400/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {priorityOptions.map((opt) => {
                      const Icon = opt.icon
                      const isSelected = priority === opt.value
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPriority(opt.value)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all',
                            isSelected 
                              ? opt.color
                              : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {difficultyOptions.map((opt) => {
                      const isSelected = difficulty === opt.value
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDifficulty(opt.value)}
                          className={cn(
                            'px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                            isSelected 
                              ? opt.color
                              : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10'
                          )}
                        >
                          {opt.label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Schedule to Timetable Toggle */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={scheduleToTimetable}
                        onChange={(e) => setScheduleToTimetable(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-white/70">
                        Add to Timetable
                      </span>
                    </div>
                  </label>
                  
                  {scheduleToTimetable && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20"
                    >
                      <p className="text-xs text-indigo-600 dark:text-indigo-300">
                        This will create a timeblock on your timetable for this mission.
                      </p>
                      
                      {/* Schedule Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          Schedule Date *
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={getTodayDate()}
                          max={deadline || undefined}
                          className={cn(
                            'w-full px-4 py-3 rounded-xl',
                            'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10',
                            'text-gray-900 dark:text-white dark:[color-scheme:dark]',
                            'focus:outline-none focus:border-indigo-400 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-indigo-400/20',
                            'transition-all duration-200'
                          )}
                        />
                      </div>
                      
                      {/* Time Range */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                            Start Time *
                          </label>
                          <input
                            type="time"
                            value={scheduledStartTime}
                            onChange={(e) => setScheduledStartTime(e.target.value)}
                            className={cn(
                              'w-full px-4 py-3 rounded-xl',
                              'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10',
                              'text-gray-900 dark:text-white dark:[color-scheme:dark]',
                              'focus:outline-none focus:border-indigo-400 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-indigo-400/20',
                              'transition-all duration-200'
                            )}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                            End Time *
                          </label>
                          <input
                            type="time"
                            value={scheduledEndTime}
                            onChange={(e) => setScheduledEndTime(e.target.value)}
                            className={cn(
                              'w-full px-4 py-3 rounded-xl',
                              'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10',
                              'text-gray-900 dark:text-white dark:[color-scheme:dark]',
                              'focus:outline-none focus:border-indigo-400 dark:focus:border-blue-400/50 focus:ring-2 focus:ring-indigo-400/20',
                              'transition-all duration-200'
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          Category
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {categoryOptions.map((opt) => {
                            const Icon = opt.icon
                            const isSelected = category === opt.value
                            return (
                              <motion.button
                                key={opt.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setCategory(opt.value)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                                  isSelected 
                                    ? opt.color
                                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10'
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-xs">{opt.label}</span>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-semibold',
                    'bg-gradient-to-r from-indigo-600 to-purple-600',
                    'text-white shadow-lg shadow-indigo-500/25',
                    'hover:shadow-indigo-500/40',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Mission'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AddMissionModal
