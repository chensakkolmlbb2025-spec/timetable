import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from '@supabase/ssr'

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
// ROUTE CONFIGURATION
// ============================================================================

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/week",
  "/templates",
  "/analytics",
  "/export",
  "/settings",
  "/onboarding",
  "/admin",
  "/missions",
]

// Routes that should redirect to dashboard if authenticated
const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/reset-password/request",
]

// Routes that don't require any auth check
const PUBLIC_ROUTES = [
  "/",
  "/callback",
  "/reset-password/complete",
  "/verify-email",
]

// Cron routes that need secret validation
const API_CRON_ROUTES = [
  "/api/cron",
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if pathname matches any route in the list
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Create a redirect response with security headers
 */
function createRedirect(request: NextRequest, destination: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = destination
  
  const response = NextResponse.redirect(url)
  
  // Add security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  
  return response
}

/**
 * Create Supabase client for middleware
 */
async function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  return { supabase, response }
}

// ============================================================================
// PROXY FUNCTION
// ============================================================================

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip auth check for static files and API routes (except protected ones)
  const isStaticOrApi = pathname.startsWith('/_next') || 
                        pathname.startsWith('/api/') ||
                        pathname.includes('.')
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-cron-secret, x-supabase-access-token',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }

  // Protect cron routes with secret
  if (matchesRoute(pathname, API_CRON_ROUTES)) {
    const cronSecret = process.env.CRON_SECRET
    const headerSecret = request.headers.get('x-cron-secret')
    
    if (cronSecret && headerSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // Skip auth for API routes and static files
  if (isStaticOrApi) {
    const response = NextResponse.next()
    
    // Add security headers
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value)
    }
    
    // Handle CORS for API routes
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin')
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://timetable-one-azure.vercel.app',
        process.env.NEXT_PUBLIC_SITE_URL,
      ].filter(Boolean)
      
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
      }
      
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret, x-supabase-access-token')
    }
    
    return response
  }

  // Skip auth check for public routes
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    const response = NextResponse.next()
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value)
    }
    return response
  }

  // Get session for protected and auth routes
  const { supabase, response } = await createMiddlewareClient(request)
  
  // Refresh session - this is important for keeping the session alive
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Add security headers to response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  // Check protected routes
  if (matchesRoute(pathname, PROTECTED_ROUTES)) {
    if (!user) {
      // Redirect to sign-in with return URL
      const signInUrl = request.nextUrl.clone()
      signInUrl.pathname = '/sign-in'
      signInUrl.searchParams.set('redirect', pathname)
      
      const redirectResponse = NextResponse.redirect(signInUrl)
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        redirectResponse.headers.set(key, value)
      }
      return redirectResponse
    }
    return response
  }

  // Check auth routes (redirect to dashboard if already authenticated)
  if (matchesRoute(pathname, AUTH_ROUTES)) {
    if (user) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      
      const redirectResponse = NextResponse.redirect(dashboardUrl)
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        redirectResponse.headers.set(key, value)
      }
      return redirectResponse
    }
    return response
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
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
