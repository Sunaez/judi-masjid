'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { onIdTokenChanged, signOut, type User } from 'firebase/auth'
import { CalendarClock, Home, LayoutDashboard, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import { auth } from '@/lib/firebase'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard, requiresAuth: true },
  { href: '/admin/dashboard/prayer-times-editor', label: 'Prayer editor', Icon: CalendarClock, requiresAuth: true },
  { href: '/', label: 'Home', Icon: Home, requiresAuth: false },
  { href: '/display/', label: 'Display', Icon: Monitor, requiresAuth: false },
]

export default function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    return onIdTokenChanged(auth, setUser)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const handleSignOut = async () => {
    setSigningOut(true)
    setError(null)
    try {
      await signOut(auth)
      router.replace('/')
      router.refresh()
    } catch {
      setError('Unable to sign out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <header className="admin-header">
      <a className="admin-skip-link" href="#admin-main">Skip to content</a>
      <div className="admin-header-inner">
        <Link href={user ? '/admin/dashboard' : '/admin'} className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 26V16h20v10M9 16c0-5 5-6 8-11 3 5 8 6 8 11M17 5V2M14 26v-6q3-5 6 0v6M3 26V9M1 10h4M3 9V5M1 26h28" /></svg>
          </span>
          <span>Al-Judi Masjid<span className="admin-brand-caption">Admin workspace</span></span>
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.filter(item => !item.requiresAuth || user).map(({ href, label, Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-header-tools">
          {user && <span className="admin-account" title={user.email ?? 'Admin account'}>{user.email ?? 'Admin account'}</span>}
          <button type="button" className="admin-icon-button" onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to day theme' : 'Switch to night theme'}>
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
          {user && <button type="button" className="admin-logout" disabled={signingOut} onClick={handleSignOut}>
            <LogOut size={17} aria-hidden="true" /><span>{signingOut ? 'Signing out...' : 'Logout'}</span>
          </button>}
        </div>
      </div>
      {error && <p role="alert" className="admin-nav-error">{error}</p>}
    </header>
  )
}
