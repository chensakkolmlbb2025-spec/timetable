'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Target, Zap, Star, Clock, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MissionFormData, MissionPriority, MissionDifficulty } from '@/lib/missions/types'

interface AddMissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MissionFormData) => Promise<void>
  timeblocks?: Array<{ id: string; title: string; start_time: string }>
}

const priorityOptions: Array<{ value: MissionPriority; label: string; icon: typeof Zap; color: string }> = [
  { value: 'critical', label: 'Critical', icon: Zap, color: 'text-red-400 bg-red-500/20 border-red-400/30' },
  { value: 'high', label: 'High', icon: Star, color: 'text-amber-400 bg-amber-500/20 border-amber-400/30' },
  { value: 'medium', label: 'Medium', icon: Target, color: 'text-blue-400 bg-blue-500/20 border-blue-400/30' },
  { value: 'low', label: 'Low', icon: Clock, color: 'text-slate-400 bg-slate-500/20 border-slate-400/30' },
]

const difficultyOptions: Array<{ value: MissionDifficulty; label: string; color: string }> = [
  { value: 'easy', label: 'Easy', color: 'bg-green-500/20 text-green-300 border-green-400/30' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' },
  { value: 'hard', label: 'Hard', color: 'bg-orange-500/20 text-orange-300 border-orange-400/30' },
  { value: 'extreme', label: 'Extreme', color: 'bg-red-500/20 text-red-300 border-red-400/30' },
]

export function AddMissionModal({ isOpen, onClose, onSubmit, timeblocks = [] }: AddMissionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<MissionPriority>('medium')
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('medium')
  const [timeblockId, setTimeblockId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        deadline,
        priority,
        difficulty,
        timeblock_id: timeblockId,
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setDeadline('')
      setPriority('medium')
      setDifficulty('medium')
      setTimeblockId(null)
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
              'relative overflow-hidden rounded-3xl',
              'bg-slate-900/90 backdrop-blur-2xl',
              'border border-white/10',
              'shadow-2xl shadow-black/40'
            )}>
              {/* Gradient decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">New Mission</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
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
                    className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Mission Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-white/5 border border-white/10',
                      'text-white placeholder-white/30',
                      'focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details about this mission..."
                    rows={3}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl resize-none',
                      'bg-white/5 border border-white/10',
                      'text-white placeholder-white/30',
                      'focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline *</span>
                    </div>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={getTodayDate()}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-white/5 border border-white/10',
                      'text-white [color-scheme:dark]',
                      'focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
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
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
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
                  <label className="block text-sm font-medium text-white/70 mb-2">
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
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                          )}
                        >
                          {opt.label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Link to Timeblock */}
                {timeblocks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        <span>Link to Timeblock</span>
                      </div>
                    </label>
                    <select
                      value={timeblockId || ''}
                      onChange={(e) => setTimeblockId(e.target.value || null)}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl',
                        'bg-white/5 border border-white/10',
                        'text-white',
                        'focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20',
                        'transition-all duration-200'
                      )}
                    >
                      <option value="" className="bg-slate-900">No link</option>
                      {timeblocks.map((tb) => (
                        <option key={tb.id} value={tb.id} className="bg-slate-900">
                          {tb.title} ({tb.start_time})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-semibold',
                    'bg-gradient-to-r from-blue-500 to-cyan-500',
                    'text-white shadow-lg shadow-blue-500/25',
                    'hover:shadow-blue-500/40',
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
