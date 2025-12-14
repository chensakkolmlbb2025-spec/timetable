"use client"

import React from "react"
import { cn } from "@/lib/utils"

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-[#dccfff] dark:bg-gray-900/70 rounded-2xl shadow-xl border border-zinc-200 dark:border-white/20 p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800", className)} {...props}>{children}</div>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>{children}</div>
  )
}

export default Card
