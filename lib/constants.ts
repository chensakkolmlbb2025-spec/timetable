/**
 * Application-wide constants
 * Centralized configuration for consistency and maintainability
 */

// ============================================================================
// APP METADATA
// ============================================================================
export const APP_NAME = "Absolute Timetable"
export const APP_DESCRIPTION = "Your personal time management companion"
export const APP_VERSION = "1.0.0"

// ============================================================================
// API ROUTES
// ============================================================================
export const API_ROUTES = {
  AUTH: {
    RESEND_CONFIRMATION: "/api/auth/resend-confirmation",
  },
  PROFILES: {
    UPSERT: "/api/profiles/upsert",
  },
  PREFERENCES: {
    UPSERT: "/api/preferences/upsert",
  },
  EXPORT: {
    SEND: "/api/export/send",
    STATUS: "/api/export/status",
  },
  CRON: {
    DAILY_REPORT: "/api/cron/daily-report",
  },
  TELEGRAM: {
    WEBHOOK: "/api/telegram/webhook",
  },
} as const

// ============================================================================
// NAVIGATION
// ============================================================================
export const NAV_ROUTES = {
  DASHBOARD: "/dashboard",
  WEEK: "/week",
  TEMPLATES: "/templates",
  ANALYTICS: "/analytics",
  EXPORT: "/export",
  SETTINGS: "/settings",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  ONBOARDING: "/onboarding",
} as const

// ============================================================================
// TIME BLOCK CATEGORIES
// ============================================================================
export const CATEGORIES = {
  work: { label: "Work", color: "#3B82F6", gradient: "from-blue-500/80 to-blue-600/80" },
  personal: { label: "Personal", color: "#22C55E", gradient: "from-green-500/80 to-green-600/80" },
  health: { label: "Health", color: "#EF4444", gradient: "from-red-500/80 to-red-600/80" },
  learning: { label: "Learning", color: "#8B5CF6", gradient: "from-purple-500/80 to-purple-600/80" },
  social: { label: "Social", color: "#EC4899", gradient: "from-pink-500/80 to-pink-600/80" },
  other: { label: "Other", color: "#6B7280", gradient: "from-gray-500/80 to-gray-600/80" },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([key, value]) => ({
  value: key as CategoryKey,
  label: value.label,
  color: value.color,
}))

// ============================================================================
// TIME DEFAULTS
// ============================================================================
export const TIME_DEFAULTS = {
  DAY_START: "06:00",
  DAY_END: "22:00",
  SLOT_DURATION: 60, // minutes
  MIN_BLOCK_DURATION: 15, // minutes
} as const

export const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
] as const

// ============================================================================
// THEME CONFIGURATION
// ============================================================================
export const THEMES = {
  light: "light",
  dark: "dark",
  auto: "auto",
} as const

export type ThemeKey = keyof typeof THEMES

// ============================================================================
// WEEK CONFIGURATION
// ============================================================================
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", shortLabel: "Sun" },
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
] as const

// ============================================================================
// STORAGE KEYS
// ============================================================================
export const STORAGE_KEYS = {
  AUTH: "timetable_auth",
  USERS: "timetable_users",
  BLOCKS: "timetable_blocks",
  PREFERENCES: "timetable_preferences",
  TEMPLATES: "timetable_templates",
  SIDEBAR_COLLAPSED: "sidebar-collapsed",
  THEME: "theme",
} as const

// ============================================================================
// HTTP STATUS CODES
// ============================================================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
} as const

// ============================================================================
// RATE LIMITING
// ============================================================================
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  AUTH_ATTEMPTS_PER_HOUR: 10,
  EXPORT_REQUESTS_PER_HOUR: 20,
} as const

// ============================================================================
// VALIDATION
// ============================================================================
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TIME_REGEX: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
} as const

// ============================================================================
// ANIMATION DURATIONS (ms)
// ============================================================================
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SIDEBAR_TRANSITION: 300,
} as const

// ============================================================================
// BREAKPOINTS (matches Tailwind)
// ============================================================================
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const
