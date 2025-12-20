"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2, Plus, GripVertical, Save, X, Copy, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DefaultTemplate, TimeBlock } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  updateTemplateBlock,
  addTemplateBlock,
  deleteTemplateBlock,
  reorderTemplateBlocks,
} from "@/lib/storage"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const CATEGORY_COLORS: Record<string, string> = {
  work: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  personal: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  health: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  learning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

type BlockFormData = Omit<TimeBlock, 'id' | 'userId' | 'date' | 'completed' | 'createdAt'>

interface TemplateEditorModalProps {
  template: DefaultTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateUpdated: () => void
}

export default function TemplateEditorModal({
  template,
  open,
  onOpenChange,
  onTemplateUpdated,
}: TemplateEditorModalProps) {
  const { toast } = useToast()
  const [blocks, setBlocks] = useState<BlockFormData[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<BlockFormData>({
    title: "",
    description: "",
    startTime: "09:00",
    endTime: "10:00",
    category: "work",
    color: "#3B82F6",
    repeatDaily: false,
  })

  // Load template blocks when template changes
  useEffect(() => {
    if (template) {
      setBlocks(template.blocks.map(b => ({ ...b })))
      setEditingIndex(null)
      setIsAddingNew(false)
    }
  }, [template])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startTime: "09:00",
      endTime: "10:00",
      category: "work",
      color: "#3B82F6",
      repeatDaily: false,
    })
  }

  const handleStartEdit = (index: number) => {
    const block = blocks[index]
    setFormData({ ...block })
    setEditingIndex(index)
    setIsAddingNew(false)
  }

  const handleStartAdd = () => {
    resetForm()
    setIsAddingNew(true)
    setEditingIndex(null)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setIsAddingNew(false)
    resetForm()
  }

  const handleSaveBlock = async () => {
    if (!template) return

    try {
      setIsSaving(true)

      // Validate form
      if (!formData.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Title is required",
          variant: "destructive",
        })
        return
      }

      if (formData.startTime >= formData.endTime) {
        toast({
          title: "Validation Error",
          description: "End time must be after start time",
          variant: "destructive",
        })
        return
      }

      if (editingIndex !== null) {
        // Update existing block
        await updateTemplateBlock(template.id, editingIndex, formData)
        toast({
          title: "Block Updated",
          description: "Template block has been updated successfully",
        })
      } else if (isAddingNew) {
        // Add new block
        await addTemplateBlock(template.id, formData)
        toast({
          title: "Block Added",
          description: "New block has been added to the template",
        })
      }

      onTemplateUpdated()
      handleCancelEdit()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save block"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBlock = async (index: number) => {
    if (!template) return

    if (!confirm("Are you sure you want to delete this block?")) return

    try {
      await deleteTemplateBlock(template.id, index)
      toast({
        title: "Block Deleted",
        description: "Template block has been removed",
      })
      onTemplateUpdated()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete block"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Visual feedback - swap positions
    const newBlocks = [...blocks]
    const draggedBlock = newBlocks[draggedIndex]
    newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(index, 0, draggedBlock)
    setBlocks(newBlocks)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (!template || draggedIndex === null) return

    try {
      // The reorder was already visually applied, now persist it
      // We need to find the original index
      const originalIndex = template.blocks.findIndex(
        b => b.title === blocks[draggedIndex].title && 
             b.startTime === blocks[draggedIndex].startTime
      )
      
      if (originalIndex !== draggedIndex) {
        await reorderTemplateBlocks(template.id, originalIndex, draggedIndex)
        onTemplateUpdated()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reorder blocks"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      // Revert to original order
      setBlocks(template.blocks.map(b => ({ ...b })))
    } finally {
      setDraggedIndex(null)
    }
  }

  const handleDuplicateBlock = (index: number) => {
    const block = blocks[index]
    const duplicated = { ...block, title: `${block.title} (Copy)` }
    setFormData(duplicated)
    setIsAddingNew(true)
    setEditingIndex(null)
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit {DAY_NAMES[template.dayOfWeek]} Template
          </DialogTitle>
          <DialogDescription>
            {blocks.length} time {blocks.length === 1 ? 'block' : 'blocks'} scheduled
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-3">
            {/* Block List */}
            {blocks
              .map((block, idx) => ({ block, idx, sortKey: block.startTime }))
              .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
              .map(({ block, idx }) => {
                const isEditing = editingIndex === idx

                if (isEditing) {
                  return (
                    <div
                      key={idx}
                      className="border-2 border-indigo-500 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-950/20"
                    >
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`title-${idx}`}>Title *</Label>
                          <Input
                            id={`title-${idx}`}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Morning Workout"
                            maxLength={200}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`start-${idx}`}>Start Time *</Label>
                            <Input
                              id={`start-${idx}`}
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`end-${idx}`}>End Time *</Label>
                            <Input
                              id={`end-${idx}`}
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`category-${idx}`}>Category</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                          >
                            <SelectTrigger id={`category-${idx}`}>
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

                        <div>
                          <Label htmlFor={`description-${idx}`}>Description</Label>
                          <Textarea
                            id={`description-${idx}`}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional details..."
                            rows={2}
                            maxLength={500}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveBlock}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-all cursor-move hover:shadow-md ${
                      draggedIndex === idx ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {block.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {block.startTime} - {block.endTime}
                              {block.repeatDaily && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                                  Daily
                                </span>
                              )}
                            </p>
                            {block.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
                                {block.description}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${CATEGORY_COLORS[block.category]}`}>
                            {block.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateBlock(idx)}
                          className="h-8 w-8 p-0"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(idx)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBlock(idx)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}

            {/* Add New Block Form */}
            {isAddingNew && (
              <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                <h4 className="font-semibold mb-3 text-green-900 dark:text-green-100">
                  Add New Block
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="new-title">Title *</Label>
                    <Input
                      id="new-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Morning Workout"
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="new-start">Start Time *</Label>
                      <Input
                        id="new-start"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-end">End Time *</Label>
                      <Input
                        id="new-end"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                    >
                      <SelectTrigger id="new-category">
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

                  <div>
                    <Label htmlFor="new-description">Description</Label>
                    <Textarea
                      id="new-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional details..."
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveBlock}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {isSaving ? "Adding..." : "Add Block"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Add New Block Button */}
            {!isAddingNew && editingIndex === null && (
              <Button
                onClick={handleStartAdd}
                variant="outline"
                className="w-full border-dashed border-2 h-12"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Time Block
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
