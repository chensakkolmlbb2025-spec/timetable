import type { TimeBlock } from "./types"
import { formatDisplayDate, formatTime, formatDate, addDays } from "./date-utils"
import jsPDF from "jspdf"

const CATEGORY_COLORS: Record<string, string> = {
  work: "#3b82f6",
  personal: "#8b5cf6",
  health: "#10b981",
  learning: "#f59e0b",
  social: "#ec4899",
  other: "#6b7280",
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function generatePDF(blocks: TimeBlock[], date: string, userName: string): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  // Compact header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, pageWidth, 25, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Daily Timetable", margin, 12)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(formatDisplayDate(date), margin, 19)
  doc.text(userName, pageWidth - margin, 19, { align: "right" })

  // Compact stats in one line
  let yPos = 35
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(8)

  const completed = blocks.filter((b) => b.completed).length
  const total = blocks.length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  doc.text(`Tasks: ${total} | Completed: ${completed} | Rate: ${completionRate}%`, margin, yPos)

  // Checklist section
  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Daily Checklist", margin, yPos)

  yPos += 6

  if (blocks.length === 0) {
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(150, 150, 150)
    doc.text("No tasks scheduled", margin, yPos)
  } else {
    const sortedBlocks = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime))

    sortedBlocks.forEach((block, index) => {
      // Checkbox
      doc.setDrawColor(100, 100, 100)
      doc.setLineWidth(0.3)
      if (block.completed) {
        doc.setFillColor(16, 185, 129)
        doc.rect(margin, yPos - 2.5, 3, 3, "FD")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(6)
        doc.text("✓", margin + 0.5, yPos + 0.5)
      } else {
        doc.rect(margin, yPos - 2.5, 3, 3, "D")
      }

      // Time
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(80, 80, 80)
      doc.text(`${formatTime(block.startTime)}-${formatTime(block.endTime)}`, margin + 5, yPos)

      // Title
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(40, 40, 40)
      const titleWidth = pageWidth - margin * 2 - 35
      const titleText = doc.splitTextToSize(block.title, titleWidth)
      doc.text(titleText[0], margin + 28, yPos)

      // Category indicator
      const categoryColor = CATEGORY_COLORS[block.category] || "#6b7280"
      const rgb = hexToRgb(categoryColor)
      doc.setFillColor(rgb.r, rgb.g, rgb.b)
      doc.circle(pageWidth - margin - 2, yPos - 1, 1.5, "F")

      yPos += 5

      // Description on same line if short
      if (block.description && block.description.length < 60) {
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const descText = doc.splitTextToSize(block.description, titleWidth)
        doc.text(descText[0], margin + 28, yPos)
        yPos += 4
      }

      // Divider line (very subtle)
      if (index < sortedBlocks.length - 1) {
        doc.setDrawColor(240, 240, 240)
        doc.setLineWidth(0.1)
        doc.line(margin, yPos, pageWidth - margin, yPos)
      }

      yPos += 3
    })
  }

  // Compact footer
  doc.setFontSize(6)
  doc.setTextColor(150, 150, 150)
  doc.text("Ultimate Timetable System", pageWidth / 2, 285, { align: "center" })

  return doc
}

export function downloadPDF(blocks: TimeBlock[], date: string, userName: string, filename: string) {
  const doc = generatePDF(blocks, date, userName)
  doc.save(filename)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

// ============================================================================
// WEEKLY PDF EXPORT - Landscape A4 with webpage-like UI
// ============================================================================

interface WeeklyPDFData {
  weekStart: Date
  blocks: TimeBlock[]
  userName: string
}

export function generateWeeklyPDF({ weekStart, blocks, userName }: WeeklyPDFData): jsPDF {
  // Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })
  
  const pageWidth = doc.internal.pageSize.getWidth() // 297mm
  const pageHeight = doc.internal.pageSize.getHeight() // 210mm
  const margin = 10
  const columnWidth = (pageWidth - margin * 2 - 6 * 3) / 7 // 7 columns with 3mm gap
  const columnGap = 3

  // Calculate week end
  const weekEnd = addDays(weekStart, 6)

  // Header background (solid indigo)
  doc.setFillColor(99, 102, 241) // indigo-500
  doc.rect(0, 0, pageWidth, 22, "F")

  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Week View", margin, 10)
  
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`${formatDisplayDate(formatDate(weekStart))} - ${formatDisplayDate(formatDate(weekEnd))}`, margin, 17)
  doc.text(userName, pageWidth - margin, 17, { align: "right" })

  // Stats summary
  const totalBlocks = blocks.length
  const completedBlocks = blocks.filter(b => b.completed).length
  const completionRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0
  
  doc.setFontSize(8)
  doc.text(`Week Total: ${totalBlocks} tasks | Completed: ${completedBlocks} | ${completionRate}%`, pageWidth - margin, 10, { align: "right" })

  // Column headers and content
  let xPos = margin
  const headerY = 28
  const contentStartY = 38
  const maxContentHeight = pageHeight - contentStartY - 12 // Leave space for footer

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const date = addDays(weekStart, dayIndex)
    const dateStr = formatDate(date)
    const dayBlocks = blocks
      .filter(b => b.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    
    const isToday = formatDate(new Date()) === dateStr
    const completed = dayBlocks.filter(b => b.completed).length
    const total = dayBlocks.length

    // Column background with card-like appearance
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(xPos, headerY - 2, columnWidth, maxContentHeight + 8, 2, 2, "F")
    
    // Today highlight
    if (isToday) {
      doc.setDrawColor(99, 102, 241) // indigo-500
      doc.setLineWidth(0.8)
      doc.roundedRect(xPos, headerY - 2, columnWidth, maxContentHeight + 8, 2, 2, "D")
      
      // Subtle indigo background for today
      doc.setFillColor(238, 242, 255) // indigo-50
      doc.roundedRect(xPos + 0.5, headerY - 1.5, columnWidth - 1, 12, 1.5, 1.5, "F")
    } else {
      doc.setDrawColor(229, 231, 235) // gray-200
      doc.setLineWidth(0.3)
      doc.roundedRect(xPos, headerY - 2, columnWidth, maxContentHeight + 8, 2, 2, "D")
    }

    // Day name header
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(17, 24, 39) // gray-900
    doc.text(DAY_NAMES[dayIndex], xPos + 3, headerY + 4)

    // Date number
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(107, 114, 128) // gray-500
    doc.text(date.getDate().toString(), xPos + 3, headerY + 9)

    // Completion stats
    if (total > 0) {
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text(`${completed}/${total}`, xPos + columnWidth - 3, headerY + 4, { align: "right" })
    }

    // Task items
    let taskY = contentStartY
    const taskPadding = 2
    const taskHeight = 14 // Approx height per task

    if (dayBlocks.length === 0) {
      doc.setFontSize(7)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(156, 163, 175) // gray-400
      doc.text("No tasks", xPos + 3, taskY + 4)
    } else {
      dayBlocks.forEach((block, idx) => {
        if (taskY + taskHeight > contentStartY + maxContentHeight - 5) {
          // Show overflow indicator
          doc.setFontSize(6)
          doc.setTextColor(107, 114, 128)
          doc.text(`+${dayBlocks.length - idx} more...`, xPos + 3, taskY + 3)
          return
        }

        // Task card background
        doc.setFillColor(249, 250, 251) // gray-50
        doc.setDrawColor(229, 231, 235) // gray-200
        doc.setLineWidth(0.2)
        doc.roundedRect(xPos + 2, taskY, columnWidth - 4, taskHeight - 2, 1, 1, "FD")

        // Category color bar
        const categoryColor = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.other
        const rgb = hexToRgb(categoryColor)
        doc.setFillColor(rgb.r, rgb.g, rgb.b)
        doc.roundedRect(xPos + 2.5, taskY + 1, 1.5, taskHeight - 4, 0.5, 0.5, "F")

        // Task title
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(17, 24, 39) // gray-900
        const titleMaxWidth = columnWidth - 12
        const titleText = doc.splitTextToSize(block.title, titleMaxWidth)
        doc.text(titleText[0], xPos + 6, taskY + 4)

        // Time
        doc.setFontSize(6)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(107, 114, 128) // gray-500
        doc.text(block.startTime, xPos + 6, taskY + 8)

        // Completed indicator
        if (block.completed) {
          doc.setFontSize(6)
          doc.setTextColor(22, 163, 74) // green-600
          doc.text("✓ Done", xPos + 6, taskY + 11)
        }

        taskY += taskHeight
      })
    }

    xPos += columnWidth + columnGap
  }

  // Footer
  doc.setFontSize(6)
  doc.setTextColor(156, 163, 175) // gray-400
  doc.text("Absolute Timetable - Weekly Overview", pageWidth / 2, pageHeight - 5, { align: "center" })

  return doc
}

export function downloadWeeklyPDF(weekStart: Date, blocks: TimeBlock[], userName: string, filename: string) {
  const doc = generateWeeklyPDF({ weekStart, blocks, userName })
  doc.save(filename)
}
