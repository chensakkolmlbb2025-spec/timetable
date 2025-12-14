import type { TimeBlock } from "./types"
import { formatDisplayDate, formatTime } from "./date-utils"
import jsPDF from "jspdf"

const CATEGORY_COLORS: Record<string, string> = {
  work: "#3b82f6",
  personal: "#8b5cf6",
  health: "#10b981",
  learning: "#f59e0b",
  social: "#ec4899",
}

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
