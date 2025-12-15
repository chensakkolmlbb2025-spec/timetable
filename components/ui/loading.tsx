"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// ============================================================================
// SPINNER VARIANTS
// ============================================================================

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      color: {
        default: "text-indigo-600 dark:text-indigo-400",
        primary: "text-indigo-600 dark:text-indigo-400",
        secondary: "text-zinc-600 dark:text-zinc-400",
        white: "text-white",
        muted: "text-zinc-400 dark:text-zinc-500",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
)

// ============================================================================
// SPINNER COMPONENT
// ============================================================================

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {}

export function Spinner({ className, size, color, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(spinnerVariants({ size, color, className }))}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  className?: string
  message?: string
  fullScreen?: boolean
}

export function LoadingOverlay({
  className,
  message = "Loading...",
  fullScreen = false,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "fixed inset-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm" : "py-12",
        className
      )}
    >
      <Spinner size="xl" />
      {message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular"
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-200 dark:bg-zinc-800",
        {
          "rounded": variant === "text",
          "rounded-full": variant === "circular",
          "rounded-lg": variant === "rectangular",
          "h-4 w-full": variant === "text" && !height && !width,
        },
        className
      )}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
        ...style,
      }}
      {...props}
    />
  )
}

// ============================================================================
// SKELETON CARD
// ============================================================================

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      <Skeleton height={20} />
      <Skeleton height={20} width="80%" />
      <Skeleton height={20} width="60%" />
    </div>
  )
}

// ============================================================================
// SKELETON TIME BLOCK
// ============================================================================

export function SkeletonTimeBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 space-y-2 bg-zinc-100 dark:bg-zinc-800 animate-pulse",
        className
      )}
    >
      <Skeleton height={16} width="70%" />
      <Skeleton height={12} width="40%" />
    </div>
  )
}

// ============================================================================
// LOADING BUTTON CONTENT
// ============================================================================

interface LoadingButtonContentProps {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
}

export function LoadingButtonContent({
  loading,
  children,
  loadingText = "Loading...",
}: LoadingButtonContentProps) {
  if (loading) {
    return (
      <>
        <Spinner size="sm" color="white" className="mr-2" />
        {loadingText}
      </>
    )
  }
  return <>{children}</>
}

// ============================================================================
// PULSE DOT LOADER
// ============================================================================

export function PulseDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" />
    </div>
  )
}

export default Spinner