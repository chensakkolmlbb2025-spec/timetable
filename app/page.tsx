"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Clock,
  Rocket,
  Sparkles,
  CheckCircle2,
  Star,
  ArrowRight,
  Play,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Users,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Animated orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/30 to-purple-600/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/30 to-pink-600/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-cyan-600/20 to-blue-600/10 rounded-full blur-3xl"
      />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// NAVIGATION
// ============================================================================

function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "py-3" : "py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-300",
            scrolled 
              ? "bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20" 
              : "bg-transparent"
          )}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-50"
                />
              </div>
              <span className="text-xl font-bold text-white">Timetable</span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-it-works">How it Works</NavLink>
              <NavLink href="#testimonials">Testimonials</NavLink>
            </div>
            
            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold",
                  "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                  "shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40",
                  "hover:scale-105 transition-all duration-200"
                )}
              >
                Get Started Free
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white/5 text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-24 z-40 p-6 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileNavLink>
              <MobileNavLink href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it Works</MobileNavLink>
              <MobileNavLink href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Testimonials</MobileNavLink>
              <div className="h-px bg-white/10 my-2" />
              <Link href="/sign-in" className="text-white/70 hover:text-white py-2">Sign In</Link>
              <Link
                href="/sign-up"
                className="px-5 py-3 rounded-xl text-center font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-white/60 hover:text-white transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300" />
    </a>
  )
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <a href={href} onClick={onClick} className="text-lg font-medium text-white/80 hover:text-white py-2">
      {children}
    </a>
  )
}

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Now with 3-Level Mission System</span>
          </motion.div>
          
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            <span className="text-white">Master Your Time,</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Achieve Your Goals
            </span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            The ultimate timetable & mission management app. Plan your schedule, 
            track important tasks, and get daily Telegram exports — all in one beautiful interface.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/sign-up"
              className={cn(
                "group relative px-8 py-4 rounded-2xl font-semibold text-lg",
                "bg-gradient-to-r from-blue-500 to-purple-600 text-white",
                "shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50",
                "hover:scale-105 transition-all duration-300",
                "flex items-center gap-2"
              )}
            >
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity -z-10" />
            </Link>
            
            <button
              className={cn(
                "px-8 py-4 rounded-2xl font-semibold text-lg",
                "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                "text-white flex items-center gap-2",
                "transition-all duration-300"
              )}
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16"
          >
            <Stat value="10K+" label="Active Users" />
            <Stat value="500K+" label="Tasks Completed" />
            <Stat value="4.9" label="App Rating" icon={<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />} />
          </motion.div>
        </div>
        
        {/* Hero Image/Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-3xl opacity-50" />
            
            {/* App mockup */}
            <div className={cn(
              "relative rounded-2xl overflow-hidden",
              "bg-slate-900/80 backdrop-blur-xl border border-white/10",
              "shadow-2xl shadow-black/40"
            )}>
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-white/5 text-white/40 text-xs">
                    timetable-one-azure.vercel.app
                  </div>
                </div>
              </div>
              
              {/* App preview */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="grid grid-cols-3 gap-4">
                  {/* Mission Pool */}
                  <GlassCard color="blue" title="Mission Pool" count={5} />
                  {/* Today's Missions */}
                  <GlassCard color="amber" title="Today" count={3} highlight />
                  {/* Completed */}
                  <GlassCard color="emerald" title="Completed" count={12} />
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 p-4 rounded-2xl bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/30"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-purple-500/20 backdrop-blur-xl border border-purple-400/30"
            >
              <Rocket className="w-8 h-8 text-purple-400" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        <span className="text-3xl sm:text-4xl font-bold text-white">{value}</span>
        {icon}
      </div>
      <p className="text-sm text-white/50 mt-1">{label}</p>
    </div>
  )
}

function GlassCard({ color, title, count, highlight }: { color: string; title: string; count: number; highlight?: boolean }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-400/30',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-400/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/30',
  }[color] || 'from-blue-500/20 to-blue-600/10 border-blue-400/30'
  
  const textColor = {
    blue: 'text-blue-300',
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
  }[color] || 'text-blue-300'

  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-br backdrop-blur-sm border",
      colorClasses,
      highlight && "ring-2 ring-amber-400/50"
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-sm font-medium", textColor)}>{title}</span>
        <span className={cn("text-2xl font-bold", textColor)}>{count}</span>
      </div>
      <div className="space-y-2">
        {[...Array(Math.min(count, 3))].map((_, i) => (
          <div key={i} className="h-2 rounded-full bg-white/10" style={{ width: `${100 - i * 20}%` }} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// FEATURES SECTION
// ============================================================================

const features = [
  {
    icon: Calendar,
    title: "Smart Timetable",
    description: "Create and manage your daily schedule with an intuitive drag-and-drop interface. Color-code activities and set reminders.",
    color: "blue",
  },
  {
    icon: Rocket,
    title: "3-Level Mission System",
    description: "Organize tasks into Pool, Today, and Completed. Auto-movement based on deadlines keeps you focused on what matters.",
    color: "purple",
  },
  {
    icon: Zap,
    title: "Telegram Integration",
    description: "Get your daily timetable exported directly to Telegram. Never miss an important task with automated notifications.",
    color: "amber",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track your productivity with beautiful charts. Identify patterns and optimize your schedule for peak performance.",
    color: "emerald",
  },
  {
    icon: Globe,
    title: "Real-time Sync",
    description: "Your data syncs instantly across all devices. Start on your phone, continue on your laptop seamlessly.",
    color: "cyan",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is encrypted and secure. We never sell your information. You own your data, always.",
    color: "pink",
  },
]

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" ref={ref} className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              stay organized
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Designed for students, professionals, and anyone who wants to make the most of their time.
          </p>
        </motion.div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ feature, index, isInView }: { feature: typeof features[0]; index: number; isInView: boolean }) {
  const Icon = feature.icon
  
  const colorClasses = {
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-400/30', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
    amber: { bg: 'bg-amber-500/20', border: 'border-amber-400/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-400/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    pink: { bg: 'bg-pink-500/20', border: 'border-pink-400/30', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
  }[feature.color] || { bg: 'bg-blue-500/20', border: 'border-blue-400/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "group relative p-6 rounded-2xl",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "hover:bg-white/10 hover:border-white/20",
        "transition-all duration-300",
        `hover:shadow-xl ${colorClasses.glow}`
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
        colorClasses.bg, colorClasses.border, "border"
      )}>
        <Icon className={cn("w-6 h-6", colorClasses.text)} />
      </div>
      
      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
      
      {/* Hover glow */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl",
        colorClasses.bg
      )} />
    </motion.div>
  )
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================

const steps = [
  {
    step: "01",
    title: "Create Your Schedule",
    description: "Set up your weekly timetable with classes, work hours, and personal time. Our smart templates help you get started quickly.",
  },
  {
    step: "02",
    title: "Add Missions",
    description: "Add important tasks to your mission pool. Set deadlines, priorities, and difficulty levels to stay organized.",
  },
  {
    step: "03",
    title: "Get Daily Exports",
    description: "Receive your timetable and today's missions via Telegram every morning. Stay on track without checking the app.",
  },
  {
    step: "04",
    title: "Track Progress",
    description: "Complete missions, view analytics, and celebrate your achievements. Watch your productivity soar over time.",
  },
]

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" ref={ref} className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Simple Process
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How it{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              works
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Get started in minutes. No complicated setup required.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <StepCard key={step.step} step={step} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, index, isInView }: { step: typeof steps[0]; index: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative"
    >
      {/* Connector line */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-10 left-[60%] w-full h-px bg-gradient-to-r from-cyan-500/50 to-transparent" />
      )}
      
      {/* Step number */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center mb-6">
        <span className="text-2xl font-bold bg-gradient-to-br from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          {step.step}
        </span>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
    </motion.div>
  )
}

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Medical Student",
    avatar: "SC",
    content: "This app completely transformed how I manage my study schedule. The mission system keeps me accountable, and the Telegram exports are a game-changer!",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Software Engineer",
    avatar: "JW",
    content: "Finally, a timetable app that doesn't feel like work to use. The UI is beautiful, and the real-time sync means I never lose track of my tasks.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Freelance Designer",
    avatar: "ER",
    content: "The analytics feature helped me realize I was wasting hours every week. Now I'm more productive and have more time for creative work.",
    rating: 5,
  },
]

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="testimonials" ref={ref} className="py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300 text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Testimonials
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            See what our users have to say about their experience.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial, index, isInView }: { testimonial: typeof testimonials[0]; index: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "p-6 rounded-2xl",
        "bg-white/5 backdrop-blur-xl border border-white/10",
        "hover:bg-white/10 transition-colors"
      )}
    >
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      
      {/* Content */}
      <p className="text-white/80 text-sm leading-relaxed mb-6">&quot;{testimonial.content}&quot;</p>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-medium text-white">{testimonial.name}</p>
          <p className="text-sm text-white/50">{testimonial.role}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// CTA SECTION
// ============================================================================

function CTASection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className={cn(
            "relative p-12 rounded-3xl overflow-hidden",
            "bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20",
            "backdrop-blur-xl border border-white/10"
          )}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-blue-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to take control of your time?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Join thousands of users who are achieving more every day with our timetable and mission system.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className={cn(
                  "group px-8 py-4 rounded-2xl font-semibold text-lg",
                  "bg-white text-slate-900",
                  "shadow-2xl shadow-white/20 hover:shadow-white/30",
                  "hover:scale-105 transition-all duration-300",
                  "flex items-center gap-2"
                )}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-white/50 text-sm">No credit card required</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  return (
    <footer className="py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Timetable</span>
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Contact</a>
          </div>
          
          {/* Copyright */}
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Timetable. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function LandingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/50">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <AnimatedBackground />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
