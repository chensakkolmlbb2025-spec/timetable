/**
 * API middleware utilities
 * Provides security, rate limiting, and request validation
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { HTTP_STATUS, RATE_LIMITS } from "./constants"
import { AppError, AuthError, RateLimitError, ValidationError, createErrorResponse, logError } from "./errors"
import { createClient as createServerClient } from "./supabase/server"

// ============================================================================
// RATE LIMITING (In-Memory for simplicity - use Redis in production)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: RATE_LIMITS.API_REQUESTS_PER_MINUTE, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key
  const now = Date.now()
  
  let entry = rateLimitStore.get(fullKey)
  
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }
  
  entry.count++
  rateLimitStore.set(fullKey, entry)
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const allowed = entry.count <= config.maxRequests
  
  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

export interface AuthUser {
  id: string
  email: string
  name?: string
}

/**
 * Get authenticated user from request
 * Uses dual-method approach for reliability
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerClient()
    
    // Method 1: Try getSession
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (!sessionError && sessionData?.session?.user) {
      const user = sessionData.session.user
      return {
        id: user.id,
        email: user.email || "",
        name: (user.user_metadata as Record<string, unknown>)?.name as string || undefined,
      }
    }
    
    // Method 2: Try getUser (more reliable on some deployments)
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (!userError && userData?.user) {
      const user = userData.user
      return {
        id: user.id,
        email: user.email || "",
        name: (user.user_metadata as Record<string, unknown>)?.name as string || undefined,
      }
    }
    
    return null
  } catch (error) {
    logError(error, { action: "getAuthUser" })
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new AuthError("Authentication required")
  }
  
  return user
}

// ============================================================================
// CRON SECRET VALIDATION
// ============================================================================

/**
 * Validate cron secret from request header
 */
export function validateCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  
  if (!secret) {
    // No secret configured - allow all in development
    return process.env.NODE_ENV === "development"
  }
  
  const header = request.headers.get("x-cron-secret")
  return header === secret
}

/**
 * Require valid cron secret - throws if invalid
 */
export function requireCronSecret(request: Request): void {
  if (!validateCronSecret(request)) {
    throw new AuthError("Invalid cron secret")
  }
}

// ============================================================================
// REQUEST PARSING
// ============================================================================

/**
 * Safely parse JSON body from request
 */
export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch {
    throw new ValidationError("Invalid JSON body")
  }
}

/**
 * Get query parameters from URL
 */
export function getQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url)
  return url.searchParams
}

/**
 * Get required query parameter
 */
export function getRequiredParam(request: Request, name: string): string {
  const params = getQueryParams(request)
  const value = params.get(name)
  
  if (!value) {
    throw new ValidationError(`Missing required parameter: ${name}`)
  }
  
  return value
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create JSON response with proper status code
 */
export function jsonResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK,
  headers?: HeadersInit
): NextResponse<T> {
  return NextResponse.json(data, { status, headers })
}

/**
 * Create error response with proper status code
 */
export function errorResponse(error: unknown): NextResponse {
  logError(error)
  
  const response = createErrorResponse(error)
  let status: number = HTTP_STATUS.INTERNAL_ERROR
  
  if (error instanceof AppError) {
    status = error.statusCode
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create success response
 */
export function successResponse<T>(data?: T, message?: string): NextResponse {
  const response: { success: true; data?: T; message?: string } = { success: true }
  
  if (data !== undefined) {
    response.data = data
  }
  
  if (message) {
    response.message = message
  }
  
  return NextResponse.json(response)
}

// ============================================================================
// API HANDLER WRAPPER
// ============================================================================

export interface ApiHandlerOptions {
  requireAuth?: boolean
  requireCronSecret?: boolean
  rateLimit?: RateLimitConfig | false
}

type ApiHandler = (request: Request, context?: { params?: Record<string, string> }) => Promise<NextResponse>

/**
 * Wrap API handler with common functionality
 */
export function withApiHandler(
  handler: (
    request: Request,
    options: { user?: AuthUser; params?: Record<string, string> }
  ) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return async (request: Request, context?: { params?: Record<string, string> }) => {
    try {
      // Rate limiting
      if (options.rateLimit !== false) {
        const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                         request.headers.get("x-real-ip") ||
                         "unknown"
        
        const rateLimitResult = checkRateLimit(clientIp, options.rateLimit)
        
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { success: false, error: "Too many requests" },
            {
              status: HTTP_STATUS.TOO_MANY_REQUESTS,
              headers: {
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
                "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              },
            }
          )
        }
      }
      
      // Cron secret validation
      if (options.requireCronSecret) {
        requireCronSecret(request)
      }
      
      // Authentication
      let user: AuthUser | undefined
      if (options.requireAuth) {
        user = await requireAuth()
      }
      
      // Execute handler
      return await handler(request, { user, params: context?.params })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

// ============================================================================
// CORS HELPERS
// ============================================================================

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://timetable-one-azure.vercel.app",
]

/**
 * Get CORS headers for response
 */
export function getCorsHeaders(origin?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-cron-secret, x-supabase-access-token",
    "Access-Control-Max-Age": "86400",
  }
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Credentials"] = "true"
  }
  
  return headers
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsOptions(request: Request): NextResponse {
  const origin = request.headers.get("origin")
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}
