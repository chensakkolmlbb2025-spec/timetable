"use client"
import React from "react"
import { Button } from "@/components/ui/button"

type Props = {
  title?: string
  description?: string
  ctaText?: string
  onCta?: () => void
  className?: string
  icon?: React.ReactNode
}

export default function EmptyState({
  title = "No items yet",
  description = "There is nothing to show.",
  ctaText = "Create",
  onCta,
  className = "",
  icon,
}: Props) {
  return (
    <div className={`text-center py-16 ${className}`}>
      {icon}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <Button aria-label={ctaText} onClick={onCta} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
        {ctaText}
      </Button>
    </div>
  )
}
