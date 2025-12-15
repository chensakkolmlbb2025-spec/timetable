"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import * as RadixToast from "@radix-ui/react-toast"

type ToastVariant = "default" | "destructive"

type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastItem = ToastOptions & { id: string }

type UseToastReturn = {
  toast: (opts: ToastOptions) => void
}

const ToastContext = createContext<UseToastReturn | undefined>(undefined)

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const onOpenChange = useCallback((id: string, open: boolean) => {
    if (!open) remove(id)
  }, [remove])

  return (
    <RadixToast.Provider swipeDirection="right">
      <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 z-50 sm:items-start sm:p-6">
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {toasts.map((t) => (
            <RadixToast.Root
              className={"rounded-lg bg-white/90 dark:bg-gray-900/90 shadow-lg border p-3 pointer-events-auto w-96 border-white/10"}
              key={t.id}
              open={true}
              onOpenChange={(open) => onOpenChange(t.id, open)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <RadixToast.Title className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t.title}
                  </RadixToast.Title>
                  {t.description && (
                    <RadixToast.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t.description}
                    </RadixToast.Description>
                  )}
                </div>
                <RadixToast.Close className="text-gray-400 hover:text-gray-600">✕</RadixToast.Close>
              </div>
            </RadixToast.Root>
          ))}
        </div>
      </div>
      <RadixToast.Viewport />
    </RadixToast.Provider>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((opts: ToastOptions) => {
    const id = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const toastItem: ToastItem = { id, ...opts }
    setToasts((prev) => [...prev, toastItem])
    // remove after 3s for default, 5s for success messages
    const duration = opts.title?.startsWith('✓') ? 5000 : 3000
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <RadixToast.Provider swipeDirection="right">
        <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 z-50 sm:items-start sm:p-6">
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            {toasts.map((t) => (
              <RadixToast.Root
                className={"rounded-lg bg-white/90 dark:bg-gray-900/90 shadow-lg border p-3 pointer-events-auto w-96 border-white/10"}
                key={t.id}
                open={true}
                onOpenChange={(open) => {
                  if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <RadixToast.Title className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t.title}
                    </RadixToast.Title>
                    {t.description && (
                      <RadixToast.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t.description}
                      </RadixToast.Description>
                    )}
                  </div>
                  <RadixToast.Close className="text-gray-400 hover:text-gray-600">✕</RadixToast.Close>
                </div>
              </RadixToast.Root>
            ))}
          </div>
        </div>
        <RadixToast.Viewport />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return ctx
}

export default useToast
