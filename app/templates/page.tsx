"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui"
import EmptyState from "@/components/empty-state"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/components/auth-provider"
import { getDefaultTemplates, deleteDefaultTemplate, applyTemplateToWeek } from "@/lib/storage"
import type { DefaultTemplate } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const CATEGORY_COLORS: Record<string, string> = {
  work: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  personal: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  health: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  learning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

export default function TemplatesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<DefaultTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DefaultTemplate | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const run = async () => await loadTemplates()
      run()
    }
  }, [user])

  const loadTemplates = async () => {
    if (!user) return
    const allTemplates = await getDefaultTemplates(user.id)
    setTemplates(allTemplates.sort((a, b) => a.dayOfWeek - b.dayOfWeek))
  }

  const handleDelete = async (templateId: string) => {
    await deleteDefaultTemplate(templateId)
    await loadTemplates()
    toast({
      title: "Template deleted",
      description: "The default template has been removed",
    })
  }

  const handleApplyToWeek = async () => {
    if (!user) return

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

  await applyTemplateToWeek(user.id, startOfWeek)

    toast({
      title: "Templates applied",
      description: "Your default templates have been applied to this week's schedule",
    })

    router.push("/week")
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

  <main className="container mx-auto px-4 pt-24 pb-12 md:pl-72">
    <Card className="mb-6">
      <CardHeader>
    <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Default Templates</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your weekly timetable templates</p>
            </div>
            <Button
              onClick={handleApplyToWeek}
              disabled={templates.length === 0}
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <CalendarIcon className="w-4 h-4" />
              Apply to This Week
            </Button>
      </div>
      </CardHeader>
    </Card>

        {templates.length === 0 ? (
          <EmptyState
            icon={<div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/30 dark:to-purple-950/30 flex items-center justify-center"><CalendarIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" /></div>}
            title="No templates yet"
            description="Create default templates by going to any day and clicking 'Set as Default'"
            ctaText="Go to Dashboard"
            onCta={() => router.push("/dashboard")}
            className="p-12"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {DAY_NAMES[template.dayOfWeek]}
                  </h3>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTemplate(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{DAY_NAMES[template.dayOfWeek]} Template</DialogTitle>
                          <DialogDescription>{template.blocks.length} time blocks scheduled</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          {template.blocks
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((block, idx) => (
                              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{block.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {block.startTime} - {block.endTime}
                                      {block.repeatDaily && (
                                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-800/40">Daily</span>
                                      )}
                                    </p>
                                    {block.description && (
                                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                        {block.description}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[block.category]}`}>
                                    {block.category}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(template.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{template.blocks.length} time blocks</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(template.blocks.map((b) => b.category))).map((category) => (
                      <span key={category} className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}>
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
