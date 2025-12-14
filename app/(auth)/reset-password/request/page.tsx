"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendPasswordResetEmail } from "@/lib/auth"

export default function ResetPasswordRequestPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    try {
      const { error } = await sendPasswordResetEmail(email)
      if (error) setMessage(error)
      else setMessage("If an account exists for that email, you will receive a password reset link shortly.")
    } catch (err: any) {
      setMessage(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8">
          <h1 className="text-2xl font-semibold mb-4">Reset your password</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Enter the email for your account and we'll send a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {message && <div className="text-sm text-gray-700">{message}</div>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
