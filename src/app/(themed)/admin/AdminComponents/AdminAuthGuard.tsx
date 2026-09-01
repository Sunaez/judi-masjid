'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  getIdTokenResult,
  onIdTokenChanged,
  signOut,
  type User,
} from 'firebase/auth'

import { auth } from '@/lib/firebase'

const AUTH_CHECK_TIMEOUT_MS = 2500

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let didResolve = false
    let isMounted = true

    const redirectToLogin = () => {
      if (typeof window === 'undefined') return

      const nextUrl = `${pathname}${window.location.search}`
      const loginUrl = `/admin?redirect=${encodeURIComponent(nextUrl)}`
      window.location.replace(loginUrl)
    }

    const timeoutId = window.setTimeout(() => {
      if (!didResolve) {
        redirectToLogin()
      }
    }, AUTH_CHECK_TIMEOUT_MS)

    let unsubscribe = () => {}

    try {
      unsubscribe = onIdTokenChanged(
        auth,
        async nextUser => {
          didResolve = true
          window.clearTimeout(timeoutId)

          if (!nextUser) {
            redirectToLogin()
            return
          }

          try {
            const tokenResult = await getIdTokenResult(nextUser)

            if (tokenResult.claims.admin !== true) {
              await signOut(auth)
              redirectToLogin()
              return
            }

            if (!isMounted) return

            setUser(nextUser)
            setCheckingAuth(false)
          } catch (error) {
            console.error('Failed to verify admin claim:', error)
            redirectToLogin()
          }
        },
        error => {
          didResolve = true
          window.clearTimeout(timeoutId)
          console.error('Failed to verify admin session:', error)
          redirectToLogin()
        }
      )
    } catch (error) {
      didResolve = true
      window.clearTimeout(timeoutId)
      console.error('Failed to start admin auth guard:', error)
      redirectToLogin()
    }

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
      unsubscribe()
    }
  }, [pathname])

  if (checkingAuth || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)] px-4 text-center">
        <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-6 shadow-xl">
          <p className="text-lg font-semibold text-[var(--accent-color)]">
            Checking secure admin access...
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            You will be sent to the admin login page if your session has expired.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
