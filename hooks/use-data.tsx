"use client"

import * as React from "react"
import type { TimeBlock, UserPreferences, DefaultTemplate } from "@/lib/types"
import { 
  getTimeBlocksForDate, 
  getUserPreferences, 
  getDefaultTemplates,
  saveTimeBlock,
  deleteTimeBlock,
  updateTimeBlock,
  saveUserPreferences,
  saveDefaultTemplate,
} from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private maxAge: number

  constructor(maxAge = 30000) { // 30 seconds default
    this.maxAge = maxAge
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    })
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear()
      return
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }
}

const dataCache = new DataCache()

// ============================================================================
// USE TIME BLOCKS HOOK
// ============================================================================

interface UseTimeBlocksOptions {
  date: string
  enabled?: boolean
}

interface UseTimeBlocksReturn {
  blocks: TimeBlock[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  addBlock: (block: TimeBlock) => Promise<void>
  updateBlock: (block: TimeBlock) => Promise<void>
  removeBlock: (blockId: string) => Promise<void>
  toggleComplete: (block: TimeBlock) => Promise<void>
}

export function useTimeBlocks({ date, enabled = true }: UseTimeBlocksOptions): UseTimeBlocksReturn {
  const { user } = useAuth()
  const [blocks, setBlocks] = React.useState<TimeBlock[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchBlocks = React.useCallback(async () => {
    if (!user?.id || !enabled) {
      setBlocks([])
      setIsLoading(false)
      return
    }

    const cacheKey = `blocks:${user.id}:${date}`
    const cached = dataCache.get<TimeBlock[]>(cacheKey)
    
    if (cached) {
      setBlocks(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getTimeBlocksForDate(user.id, date)
      setBlocks(data)
      dataCache.set(cacheKey, data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch blocks"))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, date, enabled])

  React.useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  const invalidateCache = React.useCallback(() => {
    if (user?.id) {
      dataCache.invalidate(`blocks:${user.id}`)
    }
  }, [user?.id])

  const addBlock = React.useCallback(async (block: TimeBlock) => {
    await saveTimeBlock(block)
    invalidateCache()
    await fetchBlocks()
  }, [invalidateCache, fetchBlocks])

  const updateBlockAction = React.useCallback(async (block: TimeBlock) => {
    await updateTimeBlock(block)
    invalidateCache()
    await fetchBlocks()
  }, [invalidateCache, fetchBlocks])

  const removeBlock = React.useCallback(async (blockId: string) => {
    await deleteTimeBlock(blockId)
    invalidateCache()
    await fetchBlocks()
  }, [invalidateCache, fetchBlocks])

  const toggleComplete = React.useCallback(async (block: TimeBlock) => {
    const updated = { ...block, completed: !block.completed }
    await updateTimeBlock(updated)
    invalidateCache()
    await fetchBlocks()
  }, [invalidateCache, fetchBlocks])

  return {
    blocks,
    isLoading,
    error,
    refetch: fetchBlocks,
    addBlock,
    updateBlock: updateBlockAction,
    removeBlock,
    toggleComplete,
  }
}

// ============================================================================
// USE PREFERENCES HOOK
// ============================================================================

interface UsePreferencesReturn {
  preferences: UserPreferences | null
  isLoading: boolean
  error: Error | null
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>
  refetch: () => Promise<void>
}

export function usePreferences(): UsePreferencesReturn {
  const { user } = useAuth()
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchPreferences = React.useCallback(async () => {
    if (!user?.id) {
      setPreferences(null)
      setIsLoading(false)
      return
    }

    const cacheKey = `preferences:${user.id}`
    const cached = dataCache.get<UserPreferences>(cacheKey)
    
    if (cached) {
      setPreferences(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getUserPreferences(user.id)
      setPreferences(data)
      dataCache.set(cacheKey, data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch preferences"))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  React.useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const updatePreferences = React.useCallback(async (updates: Partial<UserPreferences>) => {
    if (!preferences) return

    const updated = { ...preferences, ...updates }
    await saveUserPreferences(updated)
    
    if (user?.id) {
      dataCache.invalidate(`preferences:${user.id}`)
    }
    
    setPreferences(updated)
  }, [preferences, user?.id])

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  }
}

// ============================================================================
// USE TEMPLATES HOOK
// ============================================================================

interface UseTemplatesReturn {
  templates: DefaultTemplate[]
  isLoading: boolean
  error: Error | null
  saveTemplate: (template: DefaultTemplate) => Promise<void>
  refetch: () => Promise<void>
}

export function useTemplates(): UseTemplatesReturn {
  const { user } = useAuth()
  const [templates, setTemplates] = React.useState<DefaultTemplate[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchTemplates = React.useCallback(async () => {
    if (!user?.id) {
      setTemplates([])
      setIsLoading(false)
      return
    }

    const cacheKey = `templates:${user.id}`
    const cached = dataCache.get<DefaultTemplate[]>(cacheKey)
    
    if (cached) {
      setTemplates(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getDefaultTemplates(user.id)
      setTemplates(data)
      dataCache.set(cacheKey, data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch templates"))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  React.useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const saveTemplateAction = React.useCallback(async (template: DefaultTemplate) => {
    await saveDefaultTemplate(template)
    
    if (user?.id) {
      dataCache.invalidate(`templates:${user.id}`)
    }
    
    await fetchTemplates()
  }, [user?.id, fetchTemplates])

  return {
    templates,
    isLoading,
    error,
    saveTemplate: saveTemplateAction,
    refetch: fetchTemplates,
  }
}

// ============================================================================
// USE DEBOUNCED VALUE HOOK
// ============================================================================

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================================================
// USE LOCAL STORAGE HOOK
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

// ============================================================================
// USE MEDIA QUERY HOOK
// ============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return matches
}

// ============================================================================
// USE MOBILE HOOK
// ============================================================================

export function useMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}

// ============================================================================
// USE SCROLL LOCK HOOK
// ============================================================================

export function useScrollLock(locked: boolean): void {
  React.useEffect(() => {
    if (!locked) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [locked])
}