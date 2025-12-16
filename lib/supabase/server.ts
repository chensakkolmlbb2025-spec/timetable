import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cookie adapter interface for different Next.js versions
 */
interface CookieAdapter {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: CookieOptions) => void
  remove: (name: string, options: CookieOptions) => void
}

interface CookieOptions {
  path?: string
  maxAge?: number
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Creates a cookie adapter that works across different Next.js versions
 */
function createCookieAdapter(cookieStore: any): CookieAdapter {
  return {
    get(name: string): string | undefined {
      try {
        if (!cookieStore) return undefined
        
        // Next.js 15+ with get() method
        if (typeof cookieStore.get === 'function') {
          return cookieStore.get(name)?.value
        }
        
        // Handle getAll() method
        if (typeof cookieStore.getAll === 'function') {
          const all = cookieStore.getAll()
          const found = Array.isArray(all) 
            ? all.find((c: any) => c.name === name) 
            : undefined
          return found?.value
        }
        
        // Map-like object fallback
        if (typeof cookieStore === 'object' && name in cookieStore) {
          return cookieStore[name]?.value
        }
      } catch (error) {
        console.error('[supabase] Cookie get error:', error)
      }
      return undefined
    },
    
    set(name: string, value: string, options: CookieOptions): void {
      try {
        if (!cookieStore) return
        
        if (typeof cookieStore.set === 'function') {
          cookieStore.set({ name, value, ...options })
          return
        }
      } catch (error) {
        // This can fail in Server Components, which is expected
        // The middleware will handle setting cookies
      }
    },
    
    remove(name: string, options: CookieOptions): void {
      try {
        if (!cookieStore) return
        
        if (typeof cookieStore.delete === 'function') {
          cookieStore.delete(name)
          return
        }
        
        if (typeof cookieStore.set === 'function') {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
          return
        }
      } catch (error) {
        // This can fail in Server Components, which is expected
      }
    }
  }
}

/**
 * Creates a Supabase client for server-side operations
 * Handles cookie management for session persistence
 */
export async function createClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('[supabase] Missing environment variables for server client')
  }

  // In Next.js 15+, cookies() returns a Promise
  const cookieStore = await cookies()
  const adapter = createCookieAdapter(cookieStore)

  return createServerClient(url, anonKey, {
    cookies: {
      get: adapter.get,
      set: adapter.set,
      remove: adapter.remove,
    },
  })
}

/**
 * Get the current session from the server client
 */
export async function getServerSession() {
  try {
    const client = await createClient()
    const { data: { session }, error } = await client.auth.getSession()
    
    if (error) {
      console.error('[supabase] Server session error:', error.message)
      return null
    }
    
    return session
  } catch (error) {
    console.error('[supabase] Failed to get server session:', error)
    return null
  }
}

/**
 * Get the current user from the server client
 */
export async function getServerUser() {
  try {
    const client = await createClient()
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('[supabase] Failed to get server user:', error)
    return null
  }
}
