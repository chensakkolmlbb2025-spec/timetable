/**
 * Error handling utilities
 * Centralized error handling for consistency across the app
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = "AppError"
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string>

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
    this.errors = errors
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401)
    this.name = "AuthError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, "FORBIDDEN_ERROR", 403)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND_ERROR", 404)
    this.name = "NotFoundError"
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = "Too many requests", retryAfter?: number) {
    super(message, "RATE_LIMIT_ERROR", 429)
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
}

export class NetworkError extends AppError {
  constructor(message: string = "Network error") {
    super(message, "NETWORK_ERROR", 502)
    this.name = "NetworkError"
  }
}

export class ExternalServiceError extends AppError {
  public readonly serviceName: string
  public readonly originalError?: Error

  constructor(serviceName: string, originalError?: Error) {
    const message = originalError
      ? `${serviceName} service error: ${originalError.message}`
      : `${serviceName} service unavailable`
    super(message, "EXTERNAL_SERVICE_ERROR", 502)
    this.name = "ExternalServiceError"
    this.serviceName = serviceName
    this.originalError = originalError
  }
}

// Aliases for backward compatibility
export { AuthError as AuthenticationError }
export { ForbiddenError as AuthorizationError }

// ============================================================================
// ERROR CONVERSION
// ============================================================================

/**
 * Safely convert any value to an Error object
 */
export function toError(value: unknown): Error {
  if (value instanceof Error) return value

  if (typeof value === "string") {
    return new Error(value)
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    
    // Handle Supabase-style errors
    if (typeof obj.message === "string") {
      const error = new Error(obj.message)
      if (typeof obj.code === "string") {
        (error as Error & { code?: string }).code = obj.code
      }
      return error
    }
  }

  try {
    return new Error(JSON.stringify(value))
  } catch {
    return new Error(String(value))
  }
}

/**
 * Get a safe error message for display
 */
export function getErrorMessage(error: unknown): string {
  const err = toError(error)
  
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === "production" && !isOperationalError(error)) {
    return "An unexpected error occurred. Please try again."
  }
  
  return err.message
}

/**
 * Check if error is operational (expected, can show to user)
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

interface ErrorLogContext {
  userId?: string
  action?: string
  metadata?: Record<string, unknown>
}

/**
 * Log error with context (safe for production)
 */
export function logError(error: unknown, context?: ErrorLogContext): void {
  const err = toError(error)
  
  const logData = {
    name: err.name,
    message: err.message,
    code: (err as AppError).code,
    statusCode: (err as AppError).statusCode,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  }

  // In production, you might want to send to a logging service
  if (process.env.NODE_ENV === "production") {
    console.error("[ERROR]", JSON.stringify(logData))
  } else {
    console.error("[ERROR]", logData)
  }
}

/**
 * Log warning (non-critical issues)
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
  const logData = {
    message,
    ...context,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NODE_ENV === "production") {
    console.warn("[WARN]", JSON.stringify(logData))
  } else {
    console.warn("[WARN]", logData)
  }
}

/**
 * Log info for debugging
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[INFO]", { message, ...context, timestamp: new Date().toISOString() })
  }
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  errors?: Record<string, string>
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create standardized API error response
 */
export function createErrorResponse(error: unknown): ApiErrorResponse {
  const err = toError(error)
  
  const response: ApiErrorResponse = {
    success: false,
    error: getErrorMessage(err),
  }
  
  if (err instanceof AppError) {
    response.code = err.code
  }
  
  if (err instanceof ValidationError && Object.keys(err.errors).length > 0) {
    response.errors = err.errors
  }
  
  return response
}

/**
 * Create standardized API success response
 */
export function createSuccessResponse<T>(data?: T, message?: string): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = { success: true }
  
  if (data !== undefined) {
    response.data = data
  }
  
  if (message) {
    response.message = message
  }
  
  return response
}

// ============================================================================
// ASYNC ERROR HANDLING
// ============================================================================

/**
 * Wrap async function to catch errors
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error, { action: context })
      throw error
    }
  }
}

/**
 * Execute function and return result or default value on error
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  context?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logWarning(`Safe execution failed${context ? ` (${context})` : ""}`, {
      error: getErrorMessage(error),
    })
    return defaultValue
  }
}
