"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import {
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  CalendarDays,
  LayoutGrid,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  MoreVertical,
  Rocket,
  Sun,
  Moon,
  Monitor
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/components/theme-provider"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- Utility for cleaner classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Nav Data ---
const NAV_ITEMS = [
  { href: "/dashboard", label: "Timetable", icon: Calendar },
  { href: "/week", label: "Week View", icon: CalendarDays },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/templates", label: "Templates", icon: LayoutGrid },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/export", label: "Export", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // State for hydration safe rendering
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Initialize collapsed state lazily but safely
  const [collapsed, setCollapsed] = useState(false)

  // 1. Handle Hydration & Initial State
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved === "1") setCollapsed(true)
  }, [])

  // 2. Sync State with LocalStorage & Body Class
  useEffect(() => {
    if (!mounted) return
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0")
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: collapsed }))
    
    // Smooth layout adjustment
    if (collapsed) {
      document.body.classList.add("sidebar-collapsed")
    } else {
      document.body.classList.remove("sidebar-collapsed")
    }
  }, [collapsed, mounted])

  // Prevent hydration mismatch by rendering a skeleton or invisible placeholder first if needed
  // ideally, we just render consistent structure.
  
  if (!mounted) return <div className="hidden md:flex w-72 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800" />

  return (
    <>
      {/* --- Mobile Header --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 sm:h-16 px-4 border-b md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileOpen(true)} 
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-10 w-10 active:scale-95 transition-transform"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 active:scale-95 transition-transform">
            <Logo className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            <span className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">Absolute</span>
          </Link>
        </div>
        <UserAvatar user={user} className="w-9 h-9 sm:w-10 sm:h-10" />
      </nav>

      {/* --- Mobile Drawer --- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white dark:bg-zinc-950 shadow-2xl animate-in slide-in-from-left duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Logo className="w-7 h-7 text-indigo-600" />
                  <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">Absolute</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMobileOpen(false)}
                  className="h-9 w-9 active:scale-95 transition-transform"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Navigation Items */}
              <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                  <MobileNavItem 
                    key={item.href} 
                    item={item} 
                    isActive={pathname === item.href} 
                    onClick={() => setMobileOpen(false)} 
                  />
                ))}
              </div>

              {/* User Profile Footer */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                 {/* Theme Toggle */}
                 <div className="flex items-center justify-center gap-1 p-1 mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                   <button
                     onClick={() => setTheme('light')}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                       theme === 'light' 
                         ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                         : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                     )}
                   >
                     <Sun className="w-3.5 h-3.5" />
                     Light
                   </button>
                   <button
                     onClick={() => setTheme('dark')}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                       theme === 'dark' 
                         ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                         : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                     )}
                   >
                     <Moon className="w-3.5 h-3.5" />
                     Dark
                   </button>
                   <button
                     onClick={() => setTheme('system')}
                     className={cn(
                       "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all",
                       theme === 'system' 
                         ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                         : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                     )}
                   >
                     <Monitor className="w-3.5 h-3.5" />
                     Auto
                   </button>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <UserAvatar user={user} className="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{user?.name || 'User'}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={signOut} 
                      className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all"
                      aria-label="Sign out"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Desktop Sidebar (The Supreme Version) --- */}
      <aside 
        className={cn(
          "hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-[width]",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center px-4 border-b border-transparent transition-all",
           !collapsed && "px-6"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
             <div className="relative flex items-center justify-center">
                <Logo className="w-8 h-8 text-indigo-600 transition-transform group-hover:scale-110 duration-300" />
             </div>
             <div className={cn(
               "flex flex-col overflow-hidden transition-all duration-300",
               collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
             )}>
                <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">Absolute</span>
                <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-400">Workspace</span>
             </div>
          </Link>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => (
             <DesktopNavItem 
               key={item.href} 
               item={item} 
               collapsed={collapsed} 
               isActive={pathname === item.href} 
             />
          ))}
        </div>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
          {/* Theme Toggle for Desktop */}
          {!collapsed ? (
            <div className="flex items-center justify-center gap-1 p-1 mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                  theme === 'light' 
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                aria-label="Light theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                  theme === 'dark' 
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                aria-label="Dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                  theme === 'system' 
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                aria-label="System theme"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-center p-2 mb-3 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          
          <div className={cn(
            "relative flex items-center p-2 rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 group cursor-pointer",
            collapsed ? "justify-center" : "gap-3"
          )}>
            <UserAvatar user={user} className="w-8 h-8" />
            
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user?.name || "Pro User"}</span>
                <span className="text-xs text-zinc-500 truncate">Free Plan</span>
              </div>
            )}

            {!collapsed && (
               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut}>
                    <LogOut className="w-3.5 h-3.5 text-zinc-500" />
                  </Button>
               </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle (Absolute Positioning on Border) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm hover:text-indigo-600 hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:text-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </>
  )
}

// --- Sub-components for Cleaner Architecture ---

function DesktopNavItem({ item, collapsed, isActive }: { item: any, collapsed: boolean, isActive: boolean }) {
  const Icon = item.icon
  return (
    <Link href={item.href} className="group relative w-full flex items-center">
      <div
        className={cn(
          "relative flex items-center w-full h-10 rounded-lg transition-all duration-200 ease-in-out",
          // Text & Icon Colors
          isActive 
            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20" 
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
          collapsed ? "justify-center px-0" : "px-3"
        )}
      >
        <Icon className={cn(
          "transition-all duration-200",
          collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
        )} strokeWidth={isActive ? 2.5 : 2} />
        
        {!collapsed && (
          <span className="text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-300">
            {item.label}
          </span>
        )}

        {/* Active Indicator Pips (Optional High-end touch) */}
        {isActive && !collapsed && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-sm" />
        )}
      </div>

      {/* Floating Tooltip for Collapsed State */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 -translate-x-2 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
          {item.label}
        </div>
      )}
    </Link>
  )
}

function MobileNavItem({ item, isActive, onClick }: { item: any, isActive: boolean, onClick: () => void }) {
  const Icon = item.icon
  return (
    <Link href={item.href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] duration-200",
        isActive 
          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm" 
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-zinc-100 dark:active:bg-zinc-800"
      )}>
        <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
        <span className="font-medium text-sm flex-1">{item.label}</span>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-sm" />
        )}
      </div>
    </Link>
  )
}

function UserAvatar({ user, className }: { user: any, className?: string }) {
  // Use a refined fallback gradient if no image
  return (
    <div className={cn("relative rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0", className || "w-8 h-8")}>
       <span className="text-white font-medium text-xs">
         {user?.name?.[0]?.toUpperCase() || "U"}
       </span>
    </div>
  )
}