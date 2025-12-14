import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { ToastProvider } from "@/hooks/use-toast"
import SidebarStateSync from "@/components/sidebar-state-sync"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Absolute Timetable - Master Your Time",
  description: "Beautiful glassmorphism daily planner with time blocks, analytics, and PDF export",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.svg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/*
        We intentionally suppress hydration warnings on <body> so that
        browser extensions that add/remove attributes (for example: the
        cz-shortcut-listen chrome extension) won't cause React hydration
        mismatch errors in development. This is a dev-time warning only.
      */}
      <body suppressHydrationWarning className={`font-sans antialiased`}>
        <SidebarStateSync />
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  )
}
