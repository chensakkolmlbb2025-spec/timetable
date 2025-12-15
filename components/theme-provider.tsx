'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'theme-preference'

// Default values for SSR/static generation
const defaultContext: ThemeContextType = {
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored)
    }
    setMounted(true)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    const applyTheme = (resolved: 'light' | 'dark') => {
      if (resolved === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      setResolvedTheme(resolved)
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mediaQuery.matches ? 'dark' : 'light')
      
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default context during SSR/static generation instead of throwing
  if (context === undefined) {
    return defaultContext
  }
  return context
}
