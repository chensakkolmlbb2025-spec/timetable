"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { saveUserPreferences, getUserPreferences } from "@/lib/storage"

export default function OnboardingPage() {
  const router = useRouter()
    const { user, loading: authLoading } = useAuth()
  const [dayStart, setDayStart] = useState("06:00")
  const [dayEnd, setDayEnd] = useState("22:00")
  const [loading, setLoading] = useState(false)

  // If the auth provider finishes loading and there is no user, redirect to sign-in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in")
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      // If there's no authenticated user, send to sign-in so they can sign in first
      router.push("/sign-in")
      return
    }

    setLoading(true)
    const prefs = await getUserPreferences(user.id)
    prefs.defaultDayStart = dayStart
    prefs.defaultDayEnd = dayEnd
    try {
      await saveUserPreferences(prefs)
      router.push("/dashboard")
    } catch (err: any) {
      const msg = err?.message || String(err)
      // If session is missing, send user to sign-in so they can sign back in / refresh session
      if (msg.includes("No active session") || msg.toLowerCase().includes("missing token")) {
        router.push("/sign-in")
        return
      }
      // Otherwise log and surface the error in console (the runtime overlay will show it during dev)
      console.error('Failed to save preferences during onboarding', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />

      <div className="relative w-full max-w-2xl">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Welcome, {user?.name}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Let's personalize your timetable experience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Set Your Daily Schedule</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dayStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Day Start Time
                  </label>
                  <input
                    id="dayStart"
                    type="time"
                    value={dayStart}
                    onChange={(e) => setDayStart(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dayEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Day End Time
                  </label>
                  <input
                    id="dayEnd"
                    type="time"
                    value={dayEnd}
                    onChange={(e) => setDayEnd(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                This determines the visible hours in your timetable. You can always adjust this later in settings.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="flex-1">
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={loading || !user}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 text-base font-semibold"
              >
                {loading ? "Saving..." : "Continue to Dashboard"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
