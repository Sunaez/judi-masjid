'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  browserSessionPersistence,
  onIdTokenChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth'

import { auth } from '@/lib/firebase'
import NavBar from './NavBar'

const PASSWORD_RESET_MESSAGE =
  'If an admin account exists for that email, a password reset link has been sent.'

function getSafeRedirect(value: string | null) {
  if (!value) return '/admin/dashboard'

  try {
    const decodedValue = decodeURIComponent(value)
    return decodedValue.startsWith('/admin/dashboard')
      ? decodedValue
      : '/admin/dashboard'
  } catch {
    return '/admin/dashboard'
  }
}

function getFirebaseCode(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : ''
}

export default function LogIn() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [safeRedirect, setSafeRedirect] = useState('/admin/dashboard')

  useEffect(() => {
    setMounted(true)
    const redirect = getSafeRedirect(
      new URLSearchParams(window.location.search).get('redirect')
    )
    setSafeRedirect(redirect)

    const unsubscribe = onIdTokenChanged(auth, user => {
      if (user) {
        router.replace(redirect)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!mounted) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      await setPersistence(auth, browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email, password)
      router.replace(safeRedirect)
    } catch (err: unknown) {
      const code = getFirebaseCode(err)
      setError(
        code === 'auth/too-many-requests'
          ? 'Too many failed attempts. Try again later or reset the password.'
          : 'Invalid admin email or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setStatus(null)

    if (!email.trim()) {
      setError('Enter the admin email address first.')
      return
    }

    setResettingPassword(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setStatus(PASSWORD_RESET_MESSAGE)
    } catch (err: unknown) {
      const code = getFirebaseCode(err)
      if (code === 'auth/invalid-email') {
        setError('Enter a valid email address.')
      } else {
        setStatus(PASSWORD_RESET_MESSAGE)
      }
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <NavBar />
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--background-start)] to-[var(--background-end)] px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-6 shadow-xl sm:p-8"
        >
          <h1 className="mb-6 text-center text-3xl font-semibold text-[var(--accent-color)]">
            Admin Login
          </h1>

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {status && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              {status}
            </p>
          )}

          <label htmlFor="email" className="mb-2 block text-lg font-medium text-[var(--text-color)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            className="mb-4 w-full rounded-md border border-[var(--secondary-color)] bg-transparent px-4 py-3 text-lg placeholder-[var(--secondary-color)] focus:border-[var(--accent-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-opacity-30"
          />

          <label htmlFor="password" className="mb-2 block text-lg font-medium text-[var(--text-color)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mb-6 w-full rounded-md border border-[var(--secondary-color)] bg-transparent px-4 py-3 text-lg placeholder-[var(--secondary-color)] focus:border-[var(--accent-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-opacity-30"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--accent-color)] py-3 text-lg font-semibold text-[var(--background-end)] transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-end)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resettingPassword || loading}
            className="mt-4 w-full rounded-md border border-[var(--secondary-color)] px-4 py-3 text-sm font-semibold text-[var(--accent-color)] transition hover:bg-[var(--background-start)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resettingPassword ? 'Sending reset link...' : 'Forgot password?'}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-[var(--text-muted)]">
            Admin sessions are limited to this browser session. Use Logout when finished.
          </p>
        </form>
      </main>
    </div>
  )
}
