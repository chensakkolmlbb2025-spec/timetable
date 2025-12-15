/**
 * Validation utilities
 * Centralized validation logic for forms and API
 */

import { VALIDATION } from "./constants"

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean"
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0
}

// ============================================================================
// FIELD VALIDATORS
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateEmail(email: unknown): ValidationResult {
  if (!isString(email)) {
    return { valid: false, error: "Email must be a string" }
  }
  
  const trimmed = email.trim()
  
  if (!trimmed) {
    return { valid: false, error: "Email is required" }
  }
  
  if (!VALIDATION.EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address" }
  }
  
  return { valid: true }
}

/**
 * Simple email validation check
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).valid
}

/**
 * Simple date validation check (YYYY-MM-DD format)
 */
export function isValidDate(date: string): boolean {
  return validateDate(date).valid
}

export function validatePassword(password: unknown): ValidationResult {
  if (!isString(password)) {
    return { valid: false, error: "Password must be a string" }
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` }
  }
  
  // Check for at least one letter and one number for stronger passwords
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" }
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" }
  }
  
  return { valid: true }
}

export function validateName(name: unknown): ValidationResult {
  if (!isString(name)) {
    return { valid: false, error: "Name must be a string" }
  }
  
  const trimmed = name.trim()
  
  if (trimmed.length < VALIDATION.NAME_MIN_LENGTH) {
    return { valid: false, error: `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters` }
  }
  
  if (trimmed.length > VALIDATION.NAME_MAX_LENGTH) {
    return { valid: false, error: `Name must be at most ${VALIDATION.NAME_MAX_LENGTH} characters` }
  }
  
  return { valid: true }
}

export function validateTime(time: unknown): ValidationResult {
  if (!isString(time)) {
    return { valid: false, error: "Time must be a string" }
  }
  
  if (!VALIDATION.TIME_REGEX.test(time)) {
    return { valid: false, error: "Please enter a valid time (HH:MM)" }
  }
  
  return { valid: true }
}

export function validateDate(date: unknown): ValidationResult {
  if (!isString(date)) {
    return { valid: false, error: "Date must be a string" }
  }
  
  if (!VALIDATION.DATE_REGEX.test(date)) {
    return { valid: false, error: "Please enter a valid date (YYYY-MM-DD)" }
  }
  
  // Check if it's a real date
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return { valid: false, error: "Invalid date" }
  }
  
  return { valid: true }
}

export function validateTimeRange(startTime: string, endTime: string): ValidationResult {
  const startResult = validateTime(startTime)
  if (!startResult.valid) return startResult
  
  const endResult = validateTime(endTime)
  if (!endResult.valid) return endResult
  
  const [startH, startM] = startTime.split(":").map(Number)
  const [endH, endM] = endTime.split(":").map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  if (endMinutes <= startMinutes) {
    return { valid: false, error: "End time must be after start time" }
  }
  
  return { valid: true }
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

export interface FieldValidation {
  field: string
  value: unknown
  validator: (value: unknown) => ValidationResult
}

export interface FormValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateForm(validations: FieldValidation[]): FormValidationResult {
  const errors: Record<string, string> = {}
  
  for (const { field, value, validator } of validations) {
    const result = validator(value)
    if (!result.valid && result.error) {
      errors[field] = result.error
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// ============================================================================
// REQUEST VALIDATION HELPERS
// ============================================================================

export function validateRequired<T>(value: T | undefined | null, fieldName: string): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} is required` }
  }
  
  if (isString(value) && value.trim() === "") {
    return { valid: false, error: `${fieldName} is required` }
  }
  
  return { valid: true }
}

export function validateUUID(id: unknown): ValidationResult {
  if (!isString(id)) {
    return { valid: false, error: "ID must be a string" }
  }
  
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(id)) {
    return { valid: false, error: "Invalid ID format" }
  }
  
  return { valid: true }
}

// ============================================================================
// SANITIZATION
// ============================================================================

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizeHtml(html: string): string {
  // Basic XSS prevention - strip potential script tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
}
