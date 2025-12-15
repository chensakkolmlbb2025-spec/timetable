"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import type { User } from "@/lib/types"
import { getCurrentUser, signIn, signOut, signUp } from "@/lib/auth"

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null
  /** Whether the auth state is being initialized */
  loading: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  /** Sign up with email, password, and name */
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>
  /** Sign out the current user */
  signOut: () => Promise<void>
  /** Refresh the current user data */
  refreshUser: () => Promise<void>
  /** Whether the user is authenticated (not loading and has user) */
  isAuthenticated: boolean
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
const AUTH_STORAGE_KEY = "auth_last_check"

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Fetch and set the current user
   */
  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      if (mountedRef.current) {
        setUser(currentUser)
        // Store last check time for session persistence
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, Date.now().toString())
        }
      }
      return currentUser
    } catch (error) {
      console.error("Failed to fetch user:", error)
      if (mountedRef.current) {
        setUser(null)
      }
      return null
    }
  }, [])

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  /**
   * Set up periodic session check
   */
  const setupSessionCheck = useCallback(() => {
    // Clear existing interval
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current)
    }

    // Set up new interval
    sessionCheckRef.current = setInterval(async () => {
      if (mountedRef.current && user) {
        const currentUser = await getCurrentUser()
        if (mountedRef.current && !currentUser) {
          // Session expired
          setUser(null)
          console.info("Session expired, user logged out")
        }
      }
    }, SESSION_CHECK_INTERVAL)
  }, [user])

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    mountedRef.current = true

    async function init() {
      await fetchUser()
      if (mountedRef.current) {
        setLoading(false)
      }
    }

    init()

    return () => {
      mountedRef.current = false
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
    }
  }, [fetchUser])

  /**
   * Set up session check when user changes
   */
  useEffect(() => {
    if (user) {
      setupSessionCheck()
    }
    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
    }
  }, [user, setupSessionCheck])

  /**
   * Listen for storage events (cross-tab sync)
   */
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.key === "supabase.auth.token" || event.key?.startsWith("sb-")) {
        // Auth state changed in another tab
        refreshUser()
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [refreshUser])

  /**
   * Handle sign in
   */
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      const { user: newUser, error } = await signIn(email, password)
      if (newUser && mountedRef.current) {
        setUser(newUser)
      }
      return { error }
    } catch (error) {
      console.error("Sign in error:", error)
      return { error: "An unexpected error occurred during sign in" }
    }
  }, [])

  /**
   * Handle sign up
   */
  const handleSignUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { user: newUser, error, needsConfirmation } = await signUp(email, password, name)
      if (newUser && mountedRef.current) {
        setUser(newUser)
      }
      return { error, needsConfirmation }
    } catch (error) {
      console.error("Sign up error:", error)
      return { error: "An unexpected error occurred during sign up" }
    }
  }, [])

  /**
   * Handle sign out
   */
  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      if (mountedRef.current) {
        setUser(null)
      }
      // Clear session check interval
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
    } catch (error) {
      console.error("Sign out error:", error)
      // Still clear user on error
      if (mountedRef.current) {
        setUser(null)
      }
    }
  }, [])

  // Computed values
  const isAuthenticated = !loading && user !== null

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        refreshUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the auth context
 * Must be used within an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * Hook that requires authentication
 * Throws if not authenticated
 */
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth()
  
  if (!loading && !isAuthenticated) {
    throw new Error("Authentication required")
  }
  
  return { user: user!, loading }
}
