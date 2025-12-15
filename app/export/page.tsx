"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import useToast from "@/hooks/use-toast"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/components/auth-provider"
import { getTimeBlocksForDate } from "@/lib/storage"
import { formatDate, formatDisplayDate } from "@/lib/date-utils"
import { generatePDF } from "@/lib/pdf-export"
import type { TimeBlock } from "@/lib/types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function ExportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // State
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Ref for debouncing PDF generation
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 1. Initial Mount & Auth Check
  useEffect(() => {
    setMounted(true)
    if (!authLoading && !user) {
      router.push("/sign-in")
    }
  }, [user, authLoading, router])

  // 2. Data Loading & PDF Generation Logic
  const loadAndGenerate = useCallback(async () => {
    if (!user) return

    setIsGenerating(true)
    
    try {
      // Fetch Data (includes repeat_daily blocks for the selected date)
      const dayBlocks = await getTimeBlocksForDate(user.id, selectedDate)
      setBlocks(dayBlocks)

      // Clear previous URL to free memory
      if (previewUrl) URL.revokeObjectURL(previewUrl)

      // Generate PDF (Simulated delay for smoother UI feel if instant)
      if (dayBlocks.length > 0) {
        // Wrap in timeout to unblock main thread for UI updates
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        
        timeoutRef.current = setTimeout(() => {
          const doc = generatePDF(dayBlocks, selectedDate, user.name)
          const blob = doc.output("blob")
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          setIsGenerating(false)
        }, 500) // Small debounce for typing/date switching
      } else {
        setPreviewUrl(null)
        setIsGenerating(false)
      }
    } catch (error) {
      console.error("PDF Generation failed", error)
      setIsGenerating(false)
    }
  }, [user, selectedDate, previewUrl])

  // 3. Trigger Load when Date/User changes
  useEffect(() => {
    if (mounted && user) {
      loadAndGenerate()
    }
    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [mounted, user, selectedDate]) // Removed loadAndGenerate from deps to avoid loop

  const handleDownload = () => {
    if (!user || blocks.length === 0) return
    const doc = generatePDF(blocks, selectedDate, user.name)
    doc.save(`absolute-timetable-${selectedDate}.pdf`)
  }

  const { toast } = useToast()
  const [isRetrying, setIsRetrying] = useState(false)
  const [exportStatus, setExportStatus] = useState<null | any>(null)

  const handleRetrySend = async () => {
    if (!user) return
    if (blocks.length === 0) {
      toast({ title: "No data to send" })
      return
    }
    setIsRetrying(true)
    toast({ title: "Sending PDF to Telegram..." })
    try {
      // In local development, call the debug send-as endpoint which uses the
      // service role to perform the send reliably even if client/server session
      // cookies are not wired up in the dev environment. In production we'll
      // use the normal authenticated /api/export/send route.
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      const endpoint = isLocalhost ? '/api/debug/send-as' : '/api/export/send'
      const payload = isLocalhost ? { userId: user.id, date: selectedDate } : { date: selectedDate }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 204) {
        toast({ title: "No data", description: "No blocks for that date" })
      } else {
        const j = await res.json().catch(() => ({ success: false }))
        if (res.ok && j.success) {
          toast({ title: "Sent", description: j?.messageId ? `PDF sent to Telegram (message ${j.messageId})` : "PDF sent to Telegram" })
          // refresh status
          const s = await fetch(`/api/export/status?date=${selectedDate}`).then((r) => r.json()).catch(() => null)
          setExportStatus(s?.record ?? null)
        } else {
          // Friendly failure (auth missing, send failed, etc.)
          toast({ title: "Send failed", description: j?.message || res.statusText || "Unknown error", variant: "destructive" })
        }
      }
    } catch (e) {
      toast({ title: "Send failed", description: String(e), variant: "destructive" })
    } finally {
      setIsRetrying(false)
    }
  }

  // fetch export status when date changes
  useEffect(() => {
    // Only fetch status when user is signed in
    if (!user) {
      setExportStatus(null)
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/export/status?date=${selectedDate}`)
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setExportStatus(j.record ?? null)
        } else {
          // non-OK (401/500) -> clear status
          setExportStatus(null)
        }
      } catch (e) {
        setExportStatus(null)
      }
    })()
    return () => { mounted = false }
  }, [selectedDate, user])

  // --- Render ---

  // Skeleton Loading State
  if (!mounted || authLoading || !user) {
    return <PageSkeleton />
  }

  const completionRate = blocks.length > 0 
    ? Math.round((blocks.filter(b => b.completed).length / blocks.length) * 100) 
    : 0

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />
      {/* Sidebar assumed to be fixed */}
      <DashboardNav />

      <main className="flex-1 flex flex-col md:pl-[72px] lg:pl-[280px] transition-[padding] duration-300">
        
        {/* Header Section */}
          <header className="h-16 border-b border-white/20 flex items-center justify-between px-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900 dark:text-white">Export</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-gray-400 hidden sm:inline-block">
               {blocks.length > 0 ? 'Ready to export' : 'No data available'}
             </span>
             <Button
               onClick={handleDownload}
               disabled={blocks.length === 0 || isGenerating}
               size="sm"
               className={cn(
                 "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all",
                 "shadow-sm border border-transparent"
               )}
             >
               {isGenerating ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <Download className="w-4 h-4 mr-2" />
               )}
               Export PDF
             </Button>
             <Button
               onClick={handleRetrySend}
               disabled={blocks.length === 0 || isRetrying}
               size="sm"
               variant="ghost"
               className="ml-2"
             >
               {isRetrying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
               Retry Send
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            
            {/* Left Rail: Controls */}
            <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/20 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 p-6 flex flex-col gap-8 overflow-y-auto backdrop-blur-sm">
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight mb-1">Export Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Configure your daily snapshot.</p>
              </div>

              {/* Date Picker Control */}
              <div className="space-y-3">
                <label htmlFor="date-picker" className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Target Date
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <CalendarIcon className="w-4 h-4 text-gray-500 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-white/20 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Stats Summary Card */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Summary
                </label>
                <div className="bg-white dark:bg-gray-900 border border-white/20 dark:border-white/10 rounded-xl p-4 shadow-sm space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4 text-gray-400" />
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Blocks</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{blocks.length}</span>
                   </div>
                   
                   <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />
                   
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4 text-gray-400" />
                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion</span>
                      </div>
                      <span className={cn(
                        "text-sm font-bold",
                        completionRate === 100 ? "text-green-600" : "text-gray-900 dark:text-white"
                      )}>{completionRate}%</span>
                   </div>
                </div>
              </div>
                {exportStatus && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        exportStatus.status === 'success' ? 'bg-green-50 text-green-700' : exportStatus.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                      )}>{exportStatus.status}</span>
                      <span className="text-xs text-gray-500">Attempts: {exportStatus.attempt_count || 0}</span>
                    </div>
                    {exportStatus.last_error && <div className="text-xs text-red-500 mt-1 truncate">{exportStatus.last_error}</div>}
                    {exportStatus.updated_at && <div className="text-xs text-gray-500 mt-1">Updated: {new Date(exportStatus.updated_at).toLocaleString()}</div>}
                    {exportStatus.telegram_message_id && (
                      <div className="text-xs text-gray-500 mt-1 truncate">Telegram message id: {exportStatus.telegram_message_id}</div>
                    )}
                  </div>
                )}

              {/* Helper Text */}
          <div className="mt-auto pt-6 border-t border-white/20 dark:border-white/10">
            <div className="flex gap-3 text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      This PDF is formatted for A4 paper size. For best results, print with "None" scaling in your system dialog.
                    </p>
                 </div>
              </div>
            </aside>

            {/* Right Area: The "Desk" (Preview) */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900/80 relative overflow-auto flex items-start justify-center p-8 lg:p-12">
               {/* Pattern Background */}
               <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                    style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
               </div>

               {/* The A4 Paper Container */}
               <div className={cn(
                 "relative z-10 w-full max-w-[500px] transition-all duration-500",
                 // Enforce A4 Aspect Ratio (210mm / 297mm = ~0.707)
                 "aspect-[210/297] bg-white shadow-2xl ring-1 ring-zinc-900/5 dark:ring-white/10"
               )}>
                 {isGenerating ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                     <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                     <p className="text-sm text-gray-400 font-medium animate-pulse">Rendering Document...</p>
                   </div>
                 ) : previewUrl ? (
                   <iframe 
                     src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                     className="w-full h-full border-0 block" 
                     title="PDF Preview" 
                   />
                 ) : (
                   <EmptyPreviewState />
                 )}
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

// --- Sub Components ---

function EmptyPreviewState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-center p-8">
      <div className="w-16 h-16 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No Data to Preview</h3>
      <p className="text-gray-500 text-sm max-w-[200px]">
        Add time blocks to your schedule for this date to generate a report.
      </p>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex">
      {/* Fake Sidebar */}
      <div className="hidden md:block w-[72px] h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
      
      <div className="flex-1 flex flex-col">
        {/* Fake Header */}
        <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 w-full" />
        
        <div className="flex-1 flex flex-col lg:flex-row">
           {/* Fake Controls */}
           <div className="w-full lg:w-80 border-r border-zinc-200 dark:border-zinc-800 p-6 space-y-8">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-32 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
           </div>
                  
           
           {/* Fake Preview Area */}
           <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 p-12 flex justify-center">
              <div className="w-full max-w-[500px] aspect-[210/297] bg-white dark:bg-zinc-800 shadow-sm rounded-sm animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  )
}