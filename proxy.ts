import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ============================================================================
// SECURITY HEADERS
// ============================================================================

const SECURITY_HEADERS = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // Enable XSS protection in older browsers
  "X-XSS-Protection": "1; mode=block",
  
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions Policy (formerly Feature Policy)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://api.telegram.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  
  // Strict Transport Security (HSTS)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
}

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

const PROTECTED_ROUTES = [
  "/dashboard",
  "/week",
  "/templates",
  "/analytics",
  "/export",
  "/settings",
  "/onboarding",
  "/admin",
]

const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/callback",
]

const API_CRON_ROUTES = [
  "/api/cron",
]

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

const RATE_LIMIT_CONFIG = {
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
  
  // Export endpoints
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour  
    maxRequests: 20,
  },
}

// ============================================================================
// PROXY FUNCTION
// ============================================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Create response with security headers
  const response = NextResponse.next()
  
  // Add security headers to all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  
  // Handle CORS for API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "http://localhost:3000",
      "https://timetable-one-azure.vercel.app",
      process.env.NEXT_PUBLIC_SITE_URL,
    ].filter(Boolean)
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    )
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-cron-secret, x-supabase-access-token"
    )
    
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      })
    }
  }
  
  // Protect cron routes with secret
  if (API_CRON_ROUTES.some(route => pathname.startsWith(route))) {
    const cronSecret = process.env.CRON_SECRET
    const headerSecret = request.headers.get("x-cron-secret")
    
    if (cronSecret && headerSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
  }
  
  return response
}

// ============================================================================
// MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
