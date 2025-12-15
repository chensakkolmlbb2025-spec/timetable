/**
 * Design System - Core visual constants and utilities
 * Centralized design tokens for consistent styling
 */

// ============================================================================
// SPACING SCALE (px)
// ============================================================================
export const SPACING = {
  "0": "0",
  "0.5": "0.125rem", // 2px
  "1": "0.25rem",    // 4px
  "1.5": "0.375rem", // 6px
  "2": "0.5rem",     // 8px
  "2.5": "0.625rem", // 10px
  "3": "0.75rem",    // 12px
  "3.5": "0.875rem", // 14px
  "4": "1rem",       // 16px
  "5": "1.25rem",    // 20px
  "6": "1.5rem",     // 24px
  "7": "1.75rem",    // 28px
  "8": "2rem",       // 32px
  "9": "2.25rem",    // 36px
  "10": "2.5rem",    // 40px
  "12": "3rem",      // 48px
  "14": "3.5rem",    // 56px
  "16": "4rem",      // 64px
  "20": "5rem",      // 80px
  "24": "6rem",      // 96px
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const FONT_SIZES = {
  xs: "0.75rem",     // 12px
  sm: "0.875rem",    // 14px
  base: "1rem",      // 16px
  lg: "1.125rem",    // 18px
  xl: "1.25rem",     // 20px
  "2xl": "1.5rem",   // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem",  // 36px
  "5xl": "3rem",     // 48px
} as const

export const FONT_WEIGHTS = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const

export const LINE_HEIGHTS = {
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
} as const

// ============================================================================
// COLORS - Semantic Design Tokens
// ============================================================================
export const COLORS = {
  // Primary - Indigo
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
    950: "#1E1B4B",
  },
  
  // Success - Green
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },
  
  // Warning - Amber
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  
  // Error - Red
  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
  
  // Neutral - Zinc
  neutral: {
    50: "#FAFAFA",
    100: "#F4F4F5",
    200: "#E4E4E7",
    300: "#D4D4D8",
    400: "#A1A1AA",
    500: "#71717A",
    600: "#52525B",
    700: "#3F3F46",
    800: "#27272A",
    900: "#18181B",
    950: "#09090B",
  },
} as const

// ============================================================================
// CATEGORY COLORS (For time blocks)
// ============================================================================
export const CATEGORY_COLORS = {
  work: {
    bg: "bg-blue-500/80",
    bgGradient: "bg-gradient-to-r from-blue-500/80 to-blue-600/80",
    border: "border-blue-400",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    hex: "#3B82F6",
  },
  personal: {
    bg: "bg-green-500/80",
    bgGradient: "bg-gradient-to-r from-green-500/80 to-green-600/80",
    border: "border-green-400",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
    hex: "#22C55E",
  },
  health: {
    bg: "bg-red-500/80",
    bgGradient: "bg-gradient-to-r from-red-500/80 to-red-600/80",
    border: "border-red-400",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    hex: "#EF4444",
  },
  learning: {
    bg: "bg-purple-500/80",
    bgGradient: "bg-gradient-to-r from-purple-500/80 to-purple-600/80",
    border: "border-purple-400",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
    hex: "#8B5CF6",
  },
  social: {
    bg: "bg-pink-500/80",
    bgGradient: "bg-gradient-to-r from-pink-500/80 to-pink-600/80",
    border: "border-pink-400",
    text: "text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
    hex: "#EC4899",
  },
  other: {
    bg: "bg-gray-500/80",
    bgGradient: "bg-gradient-to-r from-gray-500/80 to-gray-600/80",
    border: "border-gray-400",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-500",
    hex: "#6B7280",
  },
} as const

export type CategoryColorKey = keyof typeof CATEGORY_COLORS

// ============================================================================
// SHADOWS
// ============================================================================
export const SHADOWS = {
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  glow: "0 0 20px rgba(99, 102, 241, 0.3)",
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const RADIUS = {
  none: "0",
  sm: "0.25rem",    // 4px
  md: "0.375rem",   // 6px
  lg: "0.5rem",     // 8px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
} as const

// ============================================================================
// TRANSITIONS
// ============================================================================
export const TRANSITIONS = {
  fast: "150ms ease-in-out",
  normal: "200ms ease-in-out",
  slow: "300ms ease-in-out",
  bounce: "300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "300ms cubic-bezier(0.2, 0, 0, 1)",
} as const

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const Z_INDEX = {
  dropdown: 50,
  sticky: 40,
  overlay: 60,
  modal: 70,
  popover: 80,
  tooltip: 90,
  toast: 100,
} as const

// ============================================================================
// BREAKPOINTS (matches Tailwind)
// ============================================================================
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

// ============================================================================
// COMPONENT VARIANTS - Common Tailwind class combinations
// ============================================================================

export const BUTTON_VARIANTS = {
  primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
  secondary: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700",
  outline: "border-2 border-zinc-200 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
  ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25",
  success: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25",
} as const

export const CARD_VARIANTS = {
  default: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm",
  elevated: "bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-0",
  glass: "backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 rounded-2xl shadow-xl border border-white/20",
  outline: "bg-transparent border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl",
} as const

export const INPUT_VARIANTS = {
  default: "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all",
  ghost: "bg-transparent border-0 border-b-2 border-zinc-200 dark:border-zinc-700 rounded-none px-0 py-2 focus:border-indigo-500 transition-colors",
  filled: "bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500/50 transition-all",
} as const

// ============================================================================
// ANIMATION CLASSES
// ============================================================================
export const ANIMATIONS = {
  fadeIn: "animate-in fade-in duration-200",
  fadeOut: "animate-out fade-out duration-200",
  slideInFromTop: "animate-in slide-in-from-top duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom duration-300",
  slideInFromLeft: "animate-in slide-in-from-left duration-300",
  slideInFromRight: "animate-in slide-in-from-right duration-300",
  scaleIn: "animate-in zoom-in-95 duration-200",
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
} as const

// ============================================================================
// RESPONSIVE HELPERS
// ============================================================================

/**
 * Generate responsive class string
 */
export function responsive(
  base: string,
  sm?: string,
  md?: string,
  lg?: string,
  xl?: string
): string {
  const classes = [base]
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  if (xl) classes.push(`xl:${xl}`)
  return classes.join(" ")
}

/**
 * Create touch-friendly styles
 */
export const TOUCH_TARGET = {
  minimum: "min-h-[44px] min-w-[44px]", // Apple HIG minimum
  comfortable: "min-h-[48px] min-w-[48px]",
  large: "min-h-[56px] min-w-[56px]",
} as const
