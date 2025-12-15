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
  title: {
    default: "Absolute Timetable - Master Your Time with Beautiful Daily Planning",
    template: "%s | Absolute Timetable"
  },
  description: "A beautiful, modern daily planner with glassmorphism design, time blocks, analytics, PDF export, and Telegram integration. Plan your day, track completion, and boost productivity.",
  keywords: ["time management", "daily planner", "timetable", "productivity", "time blocking", "schedule", "task management", "PDF export", "Telegram", "analytics"],
  authors: [{ name: "Absolute Timetable Team" }],
  creator: "Absolute Timetable",
  publisher: "Absolute Timetable",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://timetable-one-azure.vercel.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://timetable-one-azure.vercel.app",
    title: "Absolute Timetable - Master Your Time",
    description: "Beautiful daily planner with time blocks, analytics, and PDF export. Plan smarter, achieve more.",
    siteName: "Absolute Timetable",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Absolute Timetable - Daily Planning Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Absolute Timetable - Master Your Time",
    description: "Beautiful daily planner with time blocks, analytics, and PDF export.",
    images: ["/og-image.png"],
    creator: "@absolute_time"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: "v0.app",
  applicationName: "Absolute Timetable",
  referrer: "origin-when-cross-origin",
  category: "productivity",
  classification: "Business",
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
    shortcut: "/icon.svg"
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#818cf8" }
  ],
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
