'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from 'next-themes'
import { onIdTokenChanged, signOut, type User } from 'firebase/auth'
import { IoMoon, IoSunny } from 'react-icons/io5'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarClock,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  ShieldCheck,
  X,
} from 'lucide-react'

import { auth } from '@/lib/firebase'

type AdminNavItem = {
  href: string
  label: string
  Icon: ComponentType<{ className?: string }>
  requiresAuth?: boolean
  match: (pathname: string) => boolean
}

const navItems: AdminNavItem[] = [
  {
    href: '/',
    label: 'Home',
    Icon: Home,
    match: pathname => pathname === '/',
  },
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    Icon: LayoutDashboard,
    requiresAuth: true,
    match: pathname => pathname === '/admin/dashboard',
  },
  {
    href: '/admin/dashboard/prayer-times-editor',
    label: 'Prayer Editor',
    Icon: CalendarClock,
    requiresAuth: true,
    match: pathname => pathname.startsWith('/admin/dashboard/prayer-times-editor'),
  },
  {
    href: '/display/',
    label: 'Display',
    Icon: Monitor,
    match: pathname => pathname.startsWith('/display'),
  },
]

function ThemeToggle({
  displayTheme,
  onToggle,
}: {
  displayTheme: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:bg-[var(--background-end)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
      aria-label="Toggle theme"
    >
      {displayTheme === 'dark'
        ? <IoSunny size={24} className="text-[var(--yellow)]" />
        : <IoMoon size={24} className="text-[var(--accent-color)]" />
      }
    </button>
  )
}

function AdminLink({
  item,
  onNavigate,
}: {
  item: AdminNavItem
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isActive = item.match(pathname)
  const Icon = item.Icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
        isActive
          ? 'bg-[var(--accent-color)] text-[var(--background-end)] shadow-md'
          : 'text-[var(--text-color)] hover:bg-[var(--background-end)] hover:shadow-sm'
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          isActive
            ? 'bg-[var(--background-end)] text-[var(--accent-color)]'
            : 'bg-[var(--background-end)] text-[var(--accent-color)]'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  )
}

export default function NavBar() {
  const router = useRouter()
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback((restoreFocus = true) => {
    setIsMenuOpen(false)

    if (restoreFocus && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus())
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const unsubscribe = onIdTokenChanged(auth, nextUser => {
      setUser(nextUser)
      setSigningOut(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(element => !element.hasAttribute('disabled'))

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMenu, isMenuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleChange = () => {
      if (mediaQuery.matches) {
        setIsMenuOpen(false)
      }
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const currentTheme = mounted
    ? theme === 'system'
      ? systemTheme
      : theme
    : undefined
  const displayTheme = currentTheme ?? 'light'
  const toggleTheme = () => setTheme(displayTheme === 'dark' ? 'light' : 'dark')
  const visibleNavItems = navItems.filter(item => !item.requiresAuth || user)
  const adminHomeHref = user ? '/admin/dashboard' : '/admin'

  const handleSignOut = async () => {
    setSigningOut(true)

    try {
      await signOut(auth)
      closeMenu(false)
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to sign out:', error)
      setSigningOut(false)
    }
  }

  const mobileMenuOverlay = mounted ? createPortal(
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] text-[var(--text-color)] lg:hidden"
        >
          <motion.div
            aria-hidden="true"
            onClick={() => closeMenu()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 cursor-default bg-[linear-gradient(90deg,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.2)_34%,rgba(0,0,0,0.07)_68%,rgba(0,0,0,0)_100%)] backdrop-blur-[2px]"
          />

          <motion.div
            id="admin-navigation-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.34, ease: [0.77, 0.2, 0.05, 1] }}
            className="relative z-10 flex h-dvh w-[min(86vw,24rem)] flex-col overflow-hidden border-r border-[var(--secondary-color)] bg-[var(--background-end)] shadow-[18px_0_45px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--secondary-color)] px-5 py-4">
              <Link
                href={adminHomeHref}
                onClick={() => closeMenu(false)}
                className="flex min-w-0 items-center gap-3 rounded-lg text-left text-[var(--accent-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-color)] text-[var(--background-end)]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xl font-bold leading-tight">
                    Admin
                  </span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">
                    Al Judi Masjid
                  </span>
                </span>
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => closeMenu()}
                aria-label="Close admin menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:bg-[var(--background-start)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
              {visibleNavItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + 0.04 * index, duration: 0.22 }}
                >
                  <AdminLink item={item} onNavigate={() => closeMenu(false)} />
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto space-y-3 border-t border-[var(--secondary-color)] bg-[var(--background-start)] p-4">
              {user && (
                <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Signed in
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--text-color)]">
                    {user.email ?? 'Admin account'}
                  </p>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-color)] px-3 py-2 text-sm font-semibold text-[var(--background-end)] transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? 'Signing out...' : 'Logout'}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-3 py-2">
                <span className="text-sm font-semibold text-[var(--text-color)]">
                  Theme
                </span>
                <ThemeToggle displayTheme={displayTheme} onToggle={toggleTheme} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  ) : null

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--secondary-color)] bg-[var(--background-start)]/95 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen(open => !open)}
            aria-label={isMenuOpen ? 'Close admin menu' : 'Open admin menu'}
            aria-expanded={isMenuOpen}
            aria-controls="admin-navigation-menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:bg-[var(--background-end)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
          >
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>

          <Link
            href={adminHomeHref}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-[var(--accent-color)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-color)] text-[var(--background-end)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold leading-tight">
                Admin
              </span>
              <span className="block truncate text-xs text-[var(--text-muted)]">
                Al Judi Masjid
              </span>
            </span>
          </Link>
          <ThemeToggle displayTheme={displayTheme} onToggle={toggleTheme} />
        </div>
      </header>
      {mobileMenuOverlay}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--secondary-color)] bg-[var(--background-start)]/95 px-4 py-5 shadow-xl backdrop-blur-md lg:flex">
        <Link
          href={adminHomeHref}
          className="flex items-center gap-3 rounded-lg p-2 text-left transition hover:bg-[var(--background-end)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-color)] text-[var(--background-end)]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-xl font-bold leading-tight text-[var(--accent-color)]">
              Admin
            </span>
            <span className="block text-sm text-[var(--text-muted)]">
              Al Judi Masjid
            </span>
          </span>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-2" aria-label="Admin navigation">
          {visibleNavItems.map(item => (
            <AdminLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-4 space-y-3">
          {user && (
            <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Signed in
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--text-color)]">
                {user.email ?? 'Admin account'}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-color)] px-3 py-2 text-sm font-semibold text-[var(--background-end)] transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Signing out...' : 'Logout'}
              </button>
            </div>
          )}

          <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[var(--text-color)]">
                Theme
              </span>
              <ThemeToggle displayTheme={displayTheme} onToggle={toggleTheme} />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
