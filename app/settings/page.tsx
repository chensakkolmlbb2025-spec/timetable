"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Moon, Sun, Monitor, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card } from "@/components/ui"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { getUserPreferences, saveUserPreferences } from "@/lib/storage"
import type { UserPreferences } from "@/lib/types"

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [dayStart, setDayStart] = useState("06:00")
  const [dayEnd, setDayEnd] = useState("22:00")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
      return
    }

    if (user) {
      const run = async () => {
        const prefs = await getUserPreferences(user.id)
        setPreferences(prefs)
        setDayStart(prefs.defaultDayStart)
        setDayEnd(prefs.defaultDayEnd)
        // Sync theme from preferences to provider if different
        if (prefs.theme && prefs.theme !== theme) {
          setTheme(prefs.theme === 'auto' ? 'system' : prefs.theme)
        }
      }
      run()
    }
  }, [user, loading, router, setTheme, theme])

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
  }

  const handleSave = async () => {
    if (!user || !preferences) return

    setSaving(true)
    setMessage("")

    const updatedPrefs: UserPreferences = {
      ...preferences,
      defaultDayStart: dayStart,
      defaultDayEnd: dayEnd,
      theme: theme === 'system' ? 'auto' : theme as 'light' | 'dark',
    }

    await saveUserPreferences(updatedPrefs)
    setMessage("Settings saved successfully!")
    setSaving(false)

    setTimeout(() => setMessage(""), 3000)
  }

  if (loading || !user || !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 -z-10" />

      <DashboardNav />

      <main className="container mx-auto px-4 pt-24 pb-12 md:pl-72">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

          {/* Profile Section */}
          <Card className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </Card>

          {/* Theme Settings */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Customize the look and feel of your timetable
            </p>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  theme === "light"
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300"
                }`}
              >
                <Sun className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white text-center">Light</p>
              </button>

              <button
                onClick={() => handleThemeChange("dark")}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  theme === "dark"
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300"
                }`}
              >
                <Moon className="w-8 h-8 mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-white text-center">Dark</p>
              </button>

              <button
                onClick={() => handleThemeChange("system")}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  theme === "system"
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-gray-300"
                }`}
              >
                <Monitor className="w-8 h-8 mx-auto mb-3 text-gray-600 dark:text-gray-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-white text-center">System</p>
              </button>
            </div>
          </Card>

          {/* Schedule Settings */}
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Daily Schedule</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Set your default day start and end times for the timetable view
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dayStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day Start Time
                </label>
                <Input
                  id="dayStart"
                  type="time"
                  value={dayStart}
                  onChange={(e) => setDayStart(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                />
              </div>

              <div>
                <label htmlFor="dayEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day End Time
                </label>
                <Input
                  id="dayEnd"
                  type="time"
                  value={dayEnd}
                  onChange={(e) => setDayEnd(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur"
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between gap-4">
            {message && (
              <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-sm text-green-600 dark:text-green-400">
                {message}
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
