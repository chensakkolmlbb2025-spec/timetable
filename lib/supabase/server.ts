import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // cookies() may be a sync or async API depending on the Next version and types.
  // Cast to any to avoid typing issues and call the available methods directly.
  const cookieStore: any = cookies()

  // Adapter to support different Next.js `cookies()` shapes across versions.
  function getCookie(name: string) {
    try {
      if (!cookieStore) return undefined
      if (typeof cookieStore.get === "function") return cookieStore.get(name)?.value
      if (typeof cookieStore.getAll === "function") {
        const all = cookieStore.getAll()
        const found = Array.isArray(all) ? all.find((c: any) => c.name === name) : undefined
        return found?.value
      }
      // Some environments expose cookieStore as a Map-like object
      if (typeof cookieStore === "object" && name in cookieStore) return cookieStore[name]?.value
    } catch (e) {
      // swallow and return undefined
    }
    return undefined
  }

  function setCookie(name: string, value: string, options: any) {
    try {
      if (!cookieStore) return
      if (typeof cookieStore.set === "function") return cookieStore.set({ name, value, ...options })
      if (typeof cookieStore.set === "object") return (cookieStore.set as any)[name] = value
    } catch (e) {
      // swallow
    }
  }

  function removeCookie(name: string, options: any) {
    try {
      if (!cookieStore) return
      if (typeof cookieStore.delete === "function") return cookieStore.delete(name)
      if (typeof cookieStore.set === "function") return cookieStore.set({ name, value: "", ...options })
    } catch (e) {
      // swallow
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name)
        },
        set(name: string, value: string, options: any) {
          setCookie(name, value, options)
        },
        remove(name: string, options: any) {
          removeCookie(name, options)
        },
      },
    }
  )
}
