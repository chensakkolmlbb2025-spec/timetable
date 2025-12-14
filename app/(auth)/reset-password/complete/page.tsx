export default function ResetPasswordCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">We've sent a password reset link if an account exists for the address provided. Follow the instructions in the email to reset your password.</p>
        </div>
      </div>
    </div>
  )
}
