"use client"

import { useEffect } from "react"

export default function SidebarStateSync() {
  useEffect(() => {
    function apply() {
      try {
        const collapsed = localStorage.getItem("sidebar-collapsed") === "1"
        if (collapsed) {
          document.body.classList.add("sidebar-collapsed")
        } else {
          document.body.classList.remove("sidebar-collapsed")
        }
      } catch {}
    }

    apply()

    const onStorage = (e: StorageEvent) => {
      if (e.key === "sidebar-collapsed") apply()
    }

    window.addEventListener("storage", onStorage)

    // listen to custom events dispatched by the nav when toggling
    const onToggle = () => apply()
    window.addEventListener("sidebar-toggle", onToggle)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("sidebar-toggle", onToggle)
    }
  }, [])

  return null
}
