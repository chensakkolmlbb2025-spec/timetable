import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern for browser client to avoid multiple instances
let browserClient: SupabaseClient | null = null

/**
 * Creates a Supabase client for browser-side operations
 * Uses singleton pattern to avoid creating multiple client instances
 */
export function createClient(): SupabaseClient {
  // Return existing client if already created
  if (browserClient) {
    return browserClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const hint = !url && !anonKey 
      ? 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing' 
      : !url 
        ? 'NEXT_PUBLIC_SUPABASE_URL is missing' 
        : 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[supabase] ${hint}. Please copy .env.example to .env.local and add your Supabase project keys.`)
    }
    throw new Error(`Supabase client misconfigured: ${hint}`)
  }

  browserClient = createBrowserClient(url, anonKey, {
    auth: {
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session in URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Storage key for session
      storageKey: 'supabase-auth-token',
      // Flow type for PKCE
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'absolute-timetable',
      },
    },
  })

  return browserClient
}

/**
 * Get the current session from the browser client
 * Returns null if no session exists
 */
export async function getSession() {
  const client = createClient()
  const { data: { session }, error } = await client.auth.getSession()
  
  if (error) {
    console.error('[supabase] Failed to get session:', error.message)
    return null
  }
  
  return session
}

/**
 * Get the current user from the browser client
 * Returns null if no user is authenticated
 */
export async function getUser() {
  const client = createClient()
  const { data: { user }, error } = await client.auth.getUser()
  
  if (error) {
    // Don't log session expired errors as they're expected
    if (!error.message.includes('session')) {
      console.error('[supabase] Failed to get user:', error.message)
    }
    return null
  }
  
  return user
}

/**
 * Reset the singleton client (useful for testing or sign out)
 */
export function resetClient() {
  browserClient = null
}
