"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { getCurrentUser, signIn, signOut, signUp } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function init() {
      const currentUser = await getCurrentUser()
      if (!mounted) return
      setUser(currentUser)
      setLoading(false)
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    const { user: newUser, error } = await signIn(email, password)
    if (newUser) {
      setUser(newUser)
    }
    return { error }
  }

  const handleSignUp = async (email: string, password: string, name: string) => {
    const { user: newUser, error, needsConfirmation } = await signUp(email, password, name)
    if (newUser) {
      setUser(newUser)
    }
    return { error, needsConfirmation }
  }

  const handleSignOut = () => {
    signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signUp: handleSignUp, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
