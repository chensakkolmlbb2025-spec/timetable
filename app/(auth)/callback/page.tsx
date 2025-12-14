"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient as createBrowserClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createBrowserClient()
        // If a PKCE code is present in the URL, exchange it for a session server-side.
        const url = new URL(window.location.href)
        const code = url.searchParams.get("code")

        if (code) {
          const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          if (codeError) {
            toast({ title: "Authentication error", description: codeError?.message || "Failed to complete sign in", variant: "destructive" })
            router.replace("/sign-in")
            return
          }
          if (codeData?.session) {
            toast({ title: "Signed in", description: "Welcome back!", variant: "default" })
            router.replace("/dashboard")
            return
          }
        }

        // No PKCE code, we'll check for an existing session
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          toast({ title: "Signed in", description: "Welcome back!", variant: "default" })
          router.replace("/dashboard")
          return
        }

        // If not found, listen for auth state changes in case the SDK processes the URL and sets a session
        const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
          if (event === "SIGNED_IN" && session?.user) {
            toast({ title: "Signed in", description: "Welcome back!", variant: "default" })
            router.replace("/dashboard")
          }
        })

        // If nothing happens in a short time, redirect to sign-in
        setTimeout(() => {
          try {
            listener?.subscription?.unsubscribe?.()
          } catch {}
          router.replace("/sign-in")
        }, 3000)
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "Something went wrong while handling authentication callback", variant: "destructive" })
        router.replace("/sign-in")
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing sign-in…</h2>
        <p className="text-sm text-gray-600 mb-4">We are completing your sign in and will redirect you shortly.</p>
        {!loading && (
          <Button onClick={() => router.replace("/sign-in")}>Return to sign-in</Button>
        )}
      </div>
    </div>
  )
}
