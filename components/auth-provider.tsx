"use client"

import type React from "react"
import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useRef,
  useMemo 
} from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User as SupabaseUser, Session, AuthChangeEvent } from "@supabase/supabase-js"
import type { User } from "@/lib/types"
import { createClient, resetClient } from "@/lib/supabase/client"

// ============================================================================
// Types
// ============================================================================

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

interface AuthContextType extends AuthState {
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<AuthResult>
  /** Sign up with email, password, and name */
  signUp: (email: string, password: string, name: string) => Promise<AuthResult & { needsConfirmation?: boolean }>
  /** Sign out the current user */
  signOut: () => Promise<void>
  /** Refresh the current session */
  refreshSession: () => Promise<void>
  /** Update user profile */
  updateProfile: (data: { name?: string; email?: string }) => Promise<AuthResult>
  /** Whether the user is authenticated */
  isAuthenticated: boolean
}

interface AuthResult {
  error: string | null
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_REFRESH_INTERVAL = 4 * 60 * 1000 // 4 minutes (before 5min token expiry)
const SESSION_REFRESH_MARGIN = 60 * 1000 // 1 minute before expiry

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Supabase user to app user type
 */
function mapSupabaseUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: (supabaseUser.user_metadata as any)?.name || supabaseUser.email?.split('@')[0] || '',
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  }
}

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  // Auth state
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  })
  
  // Refs for cleanup
  const mountedRef = useRef(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const authListenerRef = useRef<{ subscription: { unsubscribe: () => void } } | null>(null)

  /**
   * Update auth state safely
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }))
    }
  }, [])

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // First check if there's a current session before trying to refresh
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      // Only refresh if there's a valid session
      if (!currentSession) {
        return
      }
      
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        // Don't log expected errors when there's no session
        if (!error.message.includes('refresh_token_not_found')) {
          console.error('[auth] Session refresh failed:', error.message)
        }
        // Session invalid, clear state
        if (error.message.includes('refresh_token') || error.message.includes('session')) {
          updateState({ user: null, session: null })
        }
        return
      }

      if (data.session && mountedRef.current) {
        updateState({
          session: data.session,
          user: mapSupabaseUser(data.user),
        })
      }
    } catch (error) {
      console.error('[auth] Refresh session error:', error)
    }
  }, [updateState])

  /**
   * Setup session refresh timer
   */
  const setupRefreshTimer = useCallback((session: Session | null) => {
    // Clear existing timer
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }

    if (!session) return

    // Calculate time until token expires
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now

    // If token expires soon, refresh immediately
    if (timeUntilExpiry < SESSION_REFRESH_MARGIN) {
      refreshSession()
      return
    }

    // Set up periodic refresh
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        refreshSession()
      }
    }, SESSION_REFRESH_INTERVAL)
  }, [refreshSession])

  /**
   * Handle auth state changes from Supabase
   */
  const handleAuthChange = useCallback((event: AuthChangeEvent, session: Session | null) => {
    console.log('[auth] Auth state changed:', event)

    switch (event) {
      case 'INITIAL_SESSION':
      case 'SIGNED_IN':
      case 'TOKEN_REFRESHED':
        updateState({
          user: mapSupabaseUser(session?.user || null),
          session,
          loading: false,
          initialized: true,
        })
        setupRefreshTimer(session)
        break

      case 'SIGNED_OUT':
        updateState({
          user: null,
          session: null,
          loading: false,
        })
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current)
        }
        break

      case 'USER_UPDATED':
        if (session) {
          updateState({
            user: mapSupabaseUser(session.user),
            session,
          })
        }
        break

      case 'PASSWORD_RECOVERY':
        // Redirect to password reset page
        router.push('/reset-password/complete')
        break
    }
  }, [updateState, setupRefreshTimer, router])

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    mountedRef.current = true

    async function initialize() {
      try {
        const supabase = createClient()
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[auth] Failed to get initial session:', error.message)
        }

        if (mountedRef.current) {
          updateState({
            user: mapSupabaseUser(session?.user || null),
            session,
            loading: false,
            initialized: true,
          })
          setupRefreshTimer(session)
        }

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)
        authListenerRef.current = { subscription }

      } catch (error) {
        console.error('[auth] Initialization error:', error)
        if (mountedRef.current) {
          updateState({ loading: false, initialized: true })
        }
      }
    }

    initialize()

    // Cleanup
    return () => {
      mountedRef.current = false
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      
      if (authListenerRef.current?.subscription) {
        authListenerRef.current.subscription.unsubscribe()
      }
    }
  }, [handleAuthChange, updateState, setupRefreshTimer])

  /**
   * Handle visibility change (tab focus)
   */
  useEffect(() => {
    function handleVisibilityChange() {
      // Only refresh if we have a session and tab becomes visible
      if (document.visibilityState === 'visible' && state.session && state.user) {
        // Refresh session when tab becomes visible
        refreshSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.session, state.user, refreshSession])

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        // Map common errors to user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Please verify your email before signing in' }
        }
        return { error: error.message }
      }

      if (!data.user || !data.session) {
        return { error: 'Sign in failed. Please try again.' }
      }

      // Update state immediately with the session data
      // This ensures the UI updates before the auth listener fires
      if (mountedRef.current) {
        updateState({
          user: mapSupabaseUser(data.user),
          session: data.session,
          loading: false,
          initialized: true,
        })
        setupRefreshTimer(data.session)
      }

      return { error: null }
    } catch (error) {
      console.error('[auth] Sign in error:', error)
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }, [updateState, setupRefreshTimer])

  /**
   * Sign up with email, password, and name
   */
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    name: string
  ): Promise<AuthResult & { needsConfirmation?: boolean }> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      })

      if (error) {
        // Handle rate limiting
        if (error.status === 429 || error.message.includes('rate')) {
          return { error: 'Too many requests. Please wait a moment and try again.' }
        }
        // Handle existing user
        if (error.message.includes('already registered')) {
          return { error: 'An account with this email already exists' }
        }
        return { error: error.message }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { error: null, needsConfirmation: true }
      }

      // Try to create profile if session exists
      if (data.session && data.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            name: name.trim(),
          })
        } catch (profileError) {
          console.error('[auth] Failed to create profile:', profileError)
          // Non-critical error, continue
        }
      }

      return { error: null }
    } catch (error) {
      console.error('[auth] Sign up error:', error)
      return { error: 'An unexpected error occurred. Please try again.' }
    }
  }, [])

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // Clear local state first for immediate UI feedback
      updateState({ user: null, session: null })
      
      // Clear refresh timer
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('[auth] Sign out error:', error.message)
      }

      // Reset the client singleton
      resetClient()

      // Redirect to sign-in
      router.push('/sign-in')
    } catch (error) {
      console.error('[auth] Sign out error:', error)
      // Still redirect even on error
      router.push('/sign-in')
    }
  }, [updateState, router])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: { name?: string; email?: string }): Promise<AuthResult> => {
    try {
      const supabase = createClient()
      
      // Update auth user metadata
      const updates: { data?: { name: string }; email?: string } = {}
      if (data.name) updates.data = { name: data.name }
      if (data.email) updates.email = data.email

      const { error: authError } = await supabase.auth.updateUser(updates)
      
      if (authError) {
        return { error: authError.message }
      }

      // Update profile table
      if (state.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: state.user.id,
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
          })

        if (profileError) {
          console.error('[auth] Failed to update profile:', profileError)
        }
      }

      // Refresh session to get updated user data
      await refreshSession()

      return { error: null }
    } catch (error) {
      console.error('[auth] Update profile error:', error)
      return { error: 'Failed to update profile' }
    }
  }, [state.user, refreshSession])

  // Memoized context value
  const contextValue = useMemo<AuthContextType>(() => ({
    ...state,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateProfile,
    isAuthenticated: state.initialized && !state.loading && state.user !== null,
  }), [state, signIn, signUp, signOut, refreshSession, updateProfile])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the auth context
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook that requires authentication
 * Redirects to sign-in if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (auth.initialized && !auth.loading && !auth.user) {
      // Encode current path for redirect after login
      const redirectPath = encodeURIComponent(pathname)
      router.push(`/sign-in?redirect=${redirectPath}`)
    }
  }, [auth.initialized, auth.loading, auth.user, router, pathname])

  return auth
}

/**
 * Hook that redirects authenticated users away from auth pages
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (auth.initialized && !auth.loading && auth.user) {
      router.push(redirectTo)
    }
  }, [auth.initialized, auth.loading, auth.user, router, redirectTo])

  return auth
}
