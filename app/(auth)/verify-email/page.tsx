"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/logo"
import { 
  Mail, 
  Loader2, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  AlertCircle 
} from "lucide-react"
import Link from "next/link"

// ============================================================================
// Types
// ============================================================================

type VerificationState = 'pending' | 'resending' | 'sent' | 'verified' | 'error'

// ============================================================================
// Inner Component (uses useSearchParams)
// ============================================================================

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [state, setState] = useState<VerificationState>('pending')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Check if user is already verified on mount
  useEffect(() => {
    async function checkVerification() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user?.email_confirmed_at) {
          setState('verified')
          // Redirect to dashboard after showing success
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (err) {
        console.error('[verify-email] Check error:', err)
      }
    }

    checkVerification()

    // Set up listener for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setState('verified')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Handle resend verification email
  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (countdown > 0) return

    setState('resending')
    setError('')

    try {
      const supabase = createClient()
      
      // Use Supabase's resend method
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      })

      if (resendError) {
        // Handle rate limiting
        if (resendError.status === 429 || resendError.message.includes('rate')) {
          setError('Too many requests. Please wait a few minutes before trying again.')
          setCountdown(60)
        } else {
          setError(resendError.message)
        }
        setState('pending')
        return
      }

      setState('sent')
      setCountdown(60) // 60 second cooldown
      
      // Reset to pending state after showing success
      setTimeout(() => {
        setState('pending')
      }, 5000)
    } catch (err: any) {
      console.error('[verify-email] Resend error:', err)
      setError(err?.message || 'Failed to resend verification email')
      setState('pending')
    }
  }

  // Already verified state
  if (state === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />
        
        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your email has been successfully verified. Redirecting you to the dashboard...
            </p>
            
            <div className="flex justify-center">
              <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </p>
          </div>

          {/* Email sent success message */}
          {state === 'sent' && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Verification email sent!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Please check your inbox and spam folder.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email input for resending */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Resend button */}
            <Button
              onClick={handleResend}
              disabled={state === 'resending' || countdown > 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 text-base font-semibold"
            >
              {state === 'resending' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Tips section */}
          <div className="mt-8 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Didn't receive the email?
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes and try resending</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>

          {/* Back to sign in link */}
          <div className="mt-6 text-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Loading Fallback
// ============================================================================

function VerifyEmailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
