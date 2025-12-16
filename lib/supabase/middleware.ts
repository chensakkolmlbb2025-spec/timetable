import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Creates a Supabase client for use in Next.js middleware
 * This handles cookie operations for session management
 */
export async function createMiddlewareClient(request: NextRequest) {
  // Create response to modify
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
          // Set cookie on request (for subsequent middleware/route handlers)
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Set cookie on response (for browser)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remove from request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remove from response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Verifies if the current request has a valid session
 */
export async function verifySession(request: NextRequest) {
  try {
    const { supabase, response } = await createMiddlewareClient(request)
    
    // getUser() validates the JWT and refreshes if needed
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, response }
    }

    return { user, response }
  } catch (error) {
    console.error('[middleware] Session verification error:', error)
    return { user: null, response: NextResponse.next() }
  }
}
