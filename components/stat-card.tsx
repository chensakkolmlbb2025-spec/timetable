import type React from "react"
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  gradient?: string
}

export function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/20 p-6 ${gradient ? "bg-gradient-to-br" : ""} ${gradient || ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
      </div>
      <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  )
}
