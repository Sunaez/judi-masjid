'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  browserSessionPersistence,
  onIdTokenChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

import { auth } from '@/lib/firebase'
import { AdminAccessError, ensureAdminAccess } from '@/lib/adminClient'
import {
  getFirebaseAuthFeedback,
  getPasswordResetFeedback,
} from '@/lib/adminMessages'
import NavBar from './NavBar'
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import AeroLandscape from '@/components/AeroLandscape'

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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorHelp, setErrorHelp] = useState<string[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [safeRedirect, setSafeRedirect] = useState('/admin/dashboard')
  const loginInProgressRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    const redirect = getSafeRedirect(
      new URLSearchParams(window.location.search).get('redirect')
    )
    setSafeRedirect(redirect)

    const unsubscribe = onIdTokenChanged(auth, async user => {
      if (!user) return
      if (loginInProgressRef.current) return

      try {
        await ensureAdminAccess(user)
        router.replace(redirect)
      } catch (error) {
        console.error('Failed to verify admin session:', error)
        if (error instanceof AdminAccessError) {
          setError(error.message)
          setErrorHelp(error.help)
        }
        await signOut(auth)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!mounted) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setErrorHelp([])
    setStatus(null)
    loginInProgressRef.current = true

    try {
      await setPersistence(auth, browserSessionPersistence)
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      await ensureAdminAccess(credential.user)

      router.replace(safeRedirect)
    } catch (err: unknown) {
      if (err instanceof AdminAccessError) {
        await signOut(auth)
        setError(err.message)
        setErrorHelp(err.help)
        return
      }

      const code = getFirebaseCode(err)
      const feedback = getFirebaseAuthFeedback(code)
      setError(feedback.message)
      setErrorHelp(feedback.help)
    } finally {
      loginInProgressRef.current = false
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setError(null)
    setErrorHelp([])
    setStatus(null)

    if (!email.trim()) {
      setError('Enter the admin email address first.')
      setErrorHelp(['Type the admin email in the Email field, then press Forgot password again.'])
      return
    }

    setResettingPassword(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setStatus(PASSWORD_RESET_MESSAGE)
    } catch (err: unknown) {
      const code = getFirebaseCode(err)
      const feedback = getPasswordResetFeedback(code)

      if (feedback.help.length > 0) {
        setError(feedback.message)
        setErrorHelp(feedback.help)
      } else {
        setStatus(feedback.message)
      }
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <>
      <NavBar />
      <main id="admin-main" tabIndex={-1} className="admin-login">
        <div className="admin-login-welcome">
          <p className="eyebrow">Al-Judi Masjid · Admin</p>
          <h2>A little care.<br /><span>A connected community.</span></h2>
          <p>Manage prayer times, share reminders, and keep our community up to date. It all starts here.</p>
          <AeroLandscape />
        </div>
        <form
          onSubmit={handleSubmit}
          className="aero-panel admin-login-form"
          aria-busy={loading || resettingPassword}
        >
          <span className="admin-action-icon"><ShieldCheck size={24} aria-hidden="true" /></span>
          <h1>Welcome back</h1>
          <p>Sign in to your admin account to manage the masjid.</p>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <p className="font-semibold">{error}</p>
              {errorHelp.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errorHelp.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {status && (
            <p
              role="status"
              className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              {status}
            </p>
          )}

          <label htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            disabled={loading || resettingPassword}
          />

          <label htmlFor="password">
            Password
          </label>
          <div className="admin-password-field"><input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={loading || resettingPassword}
          />
          <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
            {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button></div>

          <button
            type="submit"
            disabled={loading || resettingPassword}
            className="aero-button w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resettingPassword || loading}
            className="aero-button aero-button-secondary mt-3 w-full"
          >
            {resettingPassword ? 'Sending reset link...' : 'Forgot password?'}
          </button>

          <p className="admin-login-note">
            Admin sessions are limited to this browser session. Use Logout when finished.
          </p>
        </form>
      </main>
    </>
  )
}
