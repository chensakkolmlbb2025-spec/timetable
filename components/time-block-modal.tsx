"use client"

import { useState } from "react"
import { X, Check, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TimeBlock } from "@/lib/types"

interface TimeBlockModalProps {
  block: TimeBlock
  isOpen: boolean
  onClose: () => void
  onSave: (block: TimeBlock) => void
  onDelete: () => void
  onToggleComplete: () => void
}

export function TimeBlockModal({ block, isOpen, onClose, onSave, onDelete, onToggleComplete }: TimeBlockModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedBlock, setEditedBlock] = useState(block)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(editedBlock)
    setIsEditing(false)
  }

  const categoryColors: Record<string, string> = {
    work: "from-blue-500 to-blue-600",
    personal: "from-green-500 to-green-600",
    health: "from-red-500 to-red-600",
    learning: "from-purple-500 to-purple-600",
    social: "from-pink-500 to-pink-600",
    other: "from-gray-500 to-gray-600",
  }

  const colorClass = categoryColors[block.category] || categoryColors.other

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header with category color */}
        <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedBlock.title}
                  onChange={(e) => setEditedBlock({ ...editedBlock, title: e.target.value })}
                  className="text-2xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  placeholder="Title"
                />
              ) : (
                <h2 className="text-2xl font-bold">{block.title}</h2>
              )}
              <p className="text-sm opacity-90 mt-2">
                {block.startTime} - {block.endTime}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedBlock.description}
                  onChange={(e) => setEditedBlock({ ...editedBlock, description: e.target.value })}
                  placeholder="Add a description..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editedBlock.startTime}
                    onChange={(e) => setEditedBlock({ ...editedBlock, startTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editedBlock.endTime}
                    onChange={(e) => setEditedBlock({ ...editedBlock, endTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input
                  id="repeatDaily"
                  type="checkbox"
                  checked={!!editedBlock.repeatDaily}
                  onChange={(e) => setEditedBlock({ ...editedBlock, repeatDaily: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-0"
                />
                <label htmlFor="repeatDaily" className="text-sm text-gray-700 dark:text-gray-300">Repeat every day</label>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editedBlock.category}
                  onValueChange={(value) =>
                    setEditedBlock({ ...editedBlock, category: value as TimeBlock["category"] })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              {block.description && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Description</Label>
                  <p className="mt-1 text-gray-900 dark:text-white">{block.description}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-500 dark:text-gray-400">Category</Label>
                <p className="mt-1 text-gray-900 dark:text-white capitalize">{block.category}</p>
              </div>

              <div>
                <Label className="text-gray-500 dark:text-gray-400">Status</Label>
                <p className="mt-1">
                  {block.completed ? (
                    <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                      <Check className="w-4 h-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400">Not completed</span>
                  )}
                </p>
              </div>
              {block.repeatDaily && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Repeats</Label>
                  <p className="mt-1 text-gray-900 dark:text-white">Every day</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onDelete}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onToggleComplete} className={block.completed ? "gap-2" : "gap-2"}>
                  <Check className="w-4 h-4" />
                  {block.completed ? "Mark Incomplete" : "Mark Complete"}
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
