"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ============================================================================
// Types
// ============================================================================

type CallbackStatus = 'processing' | 'success' | 'error'

interface CallbackState {
  status: CallbackStatus
  message: string
  detail?: string
}

// ============================================================================
// Inner Component (uses useSearchParams)
// ============================================================================

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<CallbackState>({
    status: 'processing',
    message: 'Processing authentication...',
  })

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient()
        const url = new URL(window.location.href)
        
        // Check for error in URL (from Supabase)
        const errorDescription = url.searchParams.get('error_description')
        const error = url.searchParams.get('error')
        
        if (error || errorDescription) {
          setState({
            status: 'error',
            message: 'Authentication failed',
            detail: errorDescription || error || 'Unknown error occurred',
          })
          return
        }

        // Handle PKCE code exchange
        const code = url.searchParams.get('code')
        
        if (code) {
          setState({ status: 'processing', message: 'Exchanging code for session...' })
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('[callback] Code exchange error:', exchangeError)
            setState({
              status: 'error',
              message: 'Failed to complete sign in',
              detail: exchangeError.message,
            })
            return
          }

          if (data?.session) {
            setState({ status: 'success', message: 'Signed in successfully!' })
            
            // Get redirect path from state or default to dashboard
            const next = url.searchParams.get('next') || '/dashboard'
            
            // Small delay for user feedback
            setTimeout(() => {
              router.replace(next)
            }, 1000)
            return
          }
        }

        // Handle hash fragment (implicit flow or password recovery)
        const hashParams = new URLSearchParams(url.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (accessToken) {
          setState({ status: 'processing', message: 'Setting up session...' })
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            console.error('[callback] Session setup error:', sessionError)
            setState({
              status: 'error',
              message: 'Failed to set up session',
              detail: sessionError.message,
            })
            return
          }

          if (data?.session) {
            // Handle password recovery flow
            if (type === 'recovery') {
              setState({ status: 'success', message: 'Redirecting to password reset...' })
              setTimeout(() => {
                router.replace('/reset-password/complete')
              }, 1000)
              return
            }

            // Normal sign in
            setState({ status: 'success', message: 'Signed in successfully!' })
            setTimeout(() => {
              router.replace('/dashboard')
            }, 1000)
            return
          }
        }

        // No code or token, check if already authenticated
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setState({ status: 'success', message: 'Already signed in!' })
          setTimeout(() => {
            router.replace('/dashboard')
          }, 1000)
          return
        }

        // No authentication found
        setState({
          status: 'error',
          message: 'No authentication data found',
          detail: 'Please try signing in again',
        })
        
      } catch (err: any) {
        console.error('[callback] Error:', err)
        setState({
          status: 'error',
          message: 'An unexpected error occurred',
          detail: err?.message || 'Please try again',
        })
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          {/* Processing State */}
          {state.status === 'processing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {state.message}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we complete your authentication.
              </p>
            </>
          )}

          {/* Success State */}
          {state.status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {state.message}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting you now...
              </p>
            </>
          )}

          {/* Error State */}
          {state.status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {state.message}
              </h2>
              {state.detail && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {state.detail}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/sign-in">
                    Back to Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/">
                    Go Home
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Loading Fallback
// ============================================================================

function CallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading...
          </h2>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  )
}
