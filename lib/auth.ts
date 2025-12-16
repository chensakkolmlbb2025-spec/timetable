import type { User } from "./types"
import { createClient as createBrowserClient } from "./supabase/client"

// If Supabase client is available, use it for auth; otherwise fall back to localStorage

const AUTH_STORAGE_KEY = "timetable_auth"
const USERS_STORAGE_KEY = "timetable_users"

export async function getCurrentUser(): Promise<User | null> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) return null
    // If a profile table is used, fetch profile here. For now, use user metadata.
    return {
      id: data.user.id,
      email: data.user.email || "",
      name: (data.user.user_metadata as any)?.name || data.user.email || "",
      createdAt: data.user.created_at || new Date().toISOString(),
    }
  }

  if (typeof window === "undefined") return null

  const authData = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!authData) return null

  try {
    return JSON.parse(authData)
  } catch {
    return null
  }
}

export async function setCurrentUser(user: User | null): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    // supabase stores in auth; there's no client-side operation to set current user directly
    // we leave signIn/signOut to manage session
    return
  }

  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    // Use the 'profiles' table if it exists
    const { data, error } = await supabase.from("profiles").select("id, email, name, created_at")
    if (error) return []
    return (
      (data as any[]) || []
    ).map((p) => ({ id: p.id, email: p.email, name: p.name, createdAt: p.created_at }))
  }

  if (typeof window === "undefined") return []

  const usersData = localStorage.getItem(USERS_STORAGE_KEY)
  if (!usersData) return []

  try {
    return JSON.parse(usersData)
  } catch {
    return []
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ user: User | null; error: string | null; needsConfirmation?: boolean }> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    let data: any, error: any, resp: any
    try {
      resp = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      data = resp.data
      error = resp.error
      if (process.env.NODE_ENV !== 'production') {
        // Log raw response for debugging
        try {
          console.debug('supabase.signUp response (raw):', resp)
        } catch (_) {
          console.debug('supabase.signUp response (debug):', { data, error })
        }
      }
    } catch (e: any) {
      console.error('Network error during supabase.auth.signUp', e)
      return { user: null, error: 'Network error during sign up. Please try again.' }
    }
    if (error) {
      // Log a safe, informative representation for debugging
      try {
        // Prefer stable properties if present
        const safeLog = {
          name: (error as any)?.name,
          code: (error as any)?.code,
          status: (error as any)?.status,
          message: (error as any)?.message,
        }
        console.error('Supabase signUp error:', safeLog)
        console.debug('Supabase signUp raw response:', resp)
      } catch (e) {
        console.error('Supabase signUp received an unexpected error shape', error)
      }

      const status = (error && (error as any).status) || undefined
      const code = (error && (error as any).code) || undefined
      const message = (error && ((error as any).message || (error as any).msg || (error as any).message_text)) || 'Unknown error from Supabase'

      // Handle rate limit / email send throttle specifically to give a helpful UI message
      if (status === 429 || code === 'over_email_send_rate_limit' || String(message).toLowerCase().includes('rate')) {
        // The message may include a countdown like "you can only request this after 29 seconds" — surface it if available
        const friendly = String(message).length > 0 ? String(message) : 'Too many requests. Please wait a moment and try again.'
        return { user: null, error: friendly }
      }

      const userMessage = status === 500 ? 'Server error while creating account. Please try again later.' : message
      return { user: null, error: userMessage }
    }
  if (!data?.user) return { user: null, error: "Sign up failed" }

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      name: name || data.user.user_metadata?.name || "",
      createdAt: data.user.created_at || new Date().toISOString(),
    }

    // If there's no session, the project likely requires email confirmation.
    // Return a flag to the UI so we can show a "check your email" screen instead of proceeding.
    if (!data.session) {
      return { user: { id: data.user.id, email: data.user.email || "", name: name || data.user.user_metadata?.name || "", createdAt: data.user.created_at || new Date().toISOString() }, error: null, needsConfirmation: true }
    }

    // Create profile row if profiles table exists and we have a session.
    // If the server has a trigger on `auth.users` to create profiles, this is redundant.
    // Only try to upsert when a session is present to avoid RLS failures if the user is not yet signed in.
    if (data.session) {
      const { error: upsertError } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, name: user.name }).select()
      if (upsertError) {
        console.error("Failed to upsert profile after signUp:", upsertError)
        // Try fallback: call the server-side admin upsert endpoint which uses the service role key
        try {
          const accessToken = (data.session as any)?.access_token
          const res = await fetch("/api/profiles/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-supabase-access-token": accessToken || "" },
            body: JSON.stringify({ id: user.id, email: user.email, name: user.name }),
          })
          if (!res.ok) {
            const j = await res.json().catch(() => ({}))
            return { user: null, error: `Database error saving new user: ${j?.error || res.statusText}` }
          }
          // success, continue
        } catch (err: any) {
          return { user: null, error: `Database error saving new user: ${err?.message || err}` }
        }
      }
    }

    return { user, error: null }
  }

  // Fallback to localStorage for development
  const users = getAllUsers() as unknown as User[] // still sync fallback
  const allUsers = users || []

  if (allUsers.find((u) => u.email === email)) {
    return { user: null, error: "User already exists" }
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    email,
    name,
    createdAt: new Date().toISOString(),
  }
  const passwords = JSON.parse(localStorage.getItem("timetable_passwords") || "{}")
  passwords[newUser.id] = password
  localStorage.setItem("timetable_passwords", JSON.stringify(passwords))

  allUsers.push(newUser)
  saveUsers(allUsers)
  await setCurrentUser(newUser)
  return { user: newUser, error: null }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, error: error.message }
    if (!data?.user) return { user: null, error: "Sign in failed" }

    const user: User = {
      id: data.user.id,
      email: data.user.email || "",
      name: (data.user.user_metadata as any)?.name || data.user.email || "",
      createdAt: data.user.created_at || new Date().toISOString(),
    }
    await setCurrentUser(user)
    return { user, error: null }
  }

  const users = getAllUsers() as unknown as User[]
  const user = users.find((u) => u.email === email)

  if (!user) {
    return { user: null, error: "Invalid credentials" }
  }

  const passwords = JSON.parse(localStorage.getItem("timetable_passwords") || "{}")
  if (passwords[user.id] !== password) {
    return { user: null, error: "Invalid credentials" }
  }

  await setCurrentUser(user)
  return { user, error: null }
}

export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    return
  }
  await setCurrentUser(null)
}

export async function sendPasswordResetEmail(email: string, redirectTo?: string): Promise<{ error: string | null }> {
  if (typeof window === "undefined") return { error: 'Not available on server' }
  const supabase = createBrowserClient()
  try {
    // Use the callback page which will handle the token and redirect to password reset
    const redirect = redirectTo || `${window.location.origin}/callback`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { 
      redirectTo: redirect 
    })
    if (error) {
      // Handle rate limiting
      if (error.status === 429 || error.message.includes('rate')) {
        return { error: 'Too many requests. Please wait a moment and try again.' }
      }
      return { error: error.message || String(error) }
    }
    return { error: null }
  } catch (err: any) {
    return { error: err?.message || String(err) }
  }
}
