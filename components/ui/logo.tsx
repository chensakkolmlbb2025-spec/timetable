"use client"
import React from "react"

interface LogoProps {
  className?: string
  title?: string
}

export function Logo({ className = "w-8 h-8", title = "Absolute Timetable" }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#g1)" />
      <g transform="translate(16,16) scale(0.7)">
        <rect x="0" y="0" width="16" height="4" rx="1" fill="#fff" />
        <rect x="0" y="7" width="24" height="4" rx="1" fill="#fff" />
        <rect x="0" y="14" width="32" height="4" rx="1" fill="#fff" />
      </g>
    </svg>
  )
}

// Default export for backward compatibility
export default Logo
