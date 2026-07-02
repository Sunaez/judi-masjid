'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { IoMoon, IoSunny } from 'react-icons/io5'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  CalendarDays,
  CloudSun,
  HeartHandshake,
  Home,
  Link2,
  Mail,
  Menu,
  Monitor,
  ShieldCheck,
  X,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'

import { db } from '@/lib/firebase'

export type SiteSectionId =
  | 'home'
  | 'prayer-timetable'
  | 'useful-links'
  | 'donate'
  | 'contact'

interface NavBarProps {
  activeSection: SiteSectionId
  onSectionChange: (section: SiteSectionId) => void
}

type Weather = {
  condition: string
  forecastCondition: string
  forecastTemp: number
  iconCode: string
  temp: number
  timestamp: number
}

const WEATHER_UPDATE_INTERVAL = 15 * 60 * 1000

const menuItems = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'prayer-timetable', label: 'Prayer Timetable', Icon: CalendarDays },
  { id: 'useful-links', label: 'Useful Links', Icon: Link2 },
  { id: 'donate', label: 'Donate', Icon: HeartHandshake },
  { id: 'contact', label: 'Contact', Icon: Mail },
] satisfies Array<{ id: SiteSectionId; label: string; Icon: ComponentType<{ className?: string }> }>

const accessLinks = [
  { href: '/admin/', label: 'Admin', Icon: ShieldCheck },
  { href: '/display/', label: 'Display', Icon: Monitor },
]

export default function NavBar({ activeSection, onSectionChange }: NavBarProps) {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(true)
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
    let cancelled = false

    async function fetchWeather() {
      try {
        const snap = await getDoc(doc(db, 'weather', 'current'))
        if (!cancelled && snap.exists()) {
          setWeather(snap.data() as Weather)
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err)
      } finally {
        if (!cancelled) {
          setIsLoadingWeather(false)
        }
      }
    }

    setMounted(true)
    fetchWeather()

    const intervalId = setInterval(fetchWeather, WEATHER_UPDATE_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
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

  const currentTheme = mounted
    ? theme === 'system'
      ? systemTheme
      : theme
    : undefined
  const displayTheme = currentTheme ?? 'light'
  const toggleTheme = () => setTheme(displayTheme === 'dark' ? 'light' : 'dark')
  const selectSection = (section: SiteSectionId) => {
    onSectionChange(section)
    closeMenu()
  }
  const weatherTemp = weather
    ? Math.round(Number.isFinite(weather.temp) ? weather.temp : weather.forecastTemp)
    : null
  const weatherCondition = weather
    ? weather.condition || weather.forecastCondition || 'Unknown'
    : ''
  const weatherTemperatureLabel = weatherTemp === null ? '' : `${weatherTemp}\u00B0C`
  const weatherSummary = weather
    ? `${weatherTemperatureLabel}, ${weatherCondition}`
    : isLoadingWeather
      ? 'Loading weather'
      : 'Weather unavailable'

  const menuOverlay = mounted ? createPortal(
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] text-[var(--text-color)]"
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
            id="site-section-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.34, ease: [0.77, 0.2, 0.05, 1] }}
            className="relative z-10 flex h-dvh w-[min(86vw,26rem)] flex-col overflow-hidden border-r border-[var(--secondary-color)] bg-[var(--background-end)] shadow-[18px_0_45px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--secondary-color)] px-5 py-4">
              <button
                type="button"
                onClick={() => selectSection('home')}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <span className="block truncate text-2xl font-bold text-[var(--accent-color)]">
                  Al Judi Masjid
                </span>
              </button>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => closeMenu()}
                aria-label="Close menu"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:bg-[var(--background-start)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-2 px-4 py-5">
              {menuItems.map(({ id, label, Icon }, index) => {
                const isActive = id === activeSection

                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => selectSection(id)}
                    aria-current={isActive ? 'true' : undefined}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + 0.04 * index, duration: 0.22 }}
                    className={`group relative flex min-h-14 items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-left transition ${
                      isActive
                        ? 'bg-[var(--accent-color)] text-[var(--background-end)] shadow-lg'
                        : 'text-[var(--text-color)] hover:bg-[var(--background-start)] hover:shadow-sm'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[var(--yellow)]" />
                    )}
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                        isActive
                          ? 'bg-[var(--background-end)] text-[var(--accent-color)]'
                          : 'bg-[var(--background-start)] text-[var(--accent-color)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-lg font-semibold">
                      {label}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 shrink-0 transition ${
                        isActive
                          ? 'opacity-100'
                          : 'opacity-40 group-hover:translate-x-1 group-hover:opacity-100'
                      }`}
                    />
                  </motion.button>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-[var(--secondary-color)] bg-[var(--background-start)] p-4">
              <div className="grid grid-cols-2 gap-2">
                {accessLinks.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-3 py-2 font-semibold text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => closeMenu()}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
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
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="sticky top-0 z-40 border-b border-[var(--secondary-color)] bg-[var(--background-start)]/95 px-4 py-3 shadow-sm backdrop-blur-md md:px-6"
      >
        <nav className="relative mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
          <div className="flex min-w-0 items-center gap-3 justify-self-start">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(open => !open)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="site-section-menu"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:bg-[var(--background-end)]"
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>

            <button
              type="button"
              onClick={() => selectSection('home')}
              className="hidden min-w-0 text-left min-[360px]:block"
            >
              <span className="block truncate text-lg font-bold leading-tight text-[var(--accent-color)] md:text-xl">
                Al Judi Masjid
              </span>
            </button>
          </div>

          <div
            className="flex min-h-10 min-w-0 items-center justify-center gap-2 justify-self-center rounded-lg px-2 text-sm text-[var(--text-color)] md:text-base"
            aria-label={weatherSummary}
          >
            {isLoadingWeather ? (
              <>
                <div className="h-8 w-8 animate-pulse rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="hidden h-4 w-32 animate-pulse rounded sm:block" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
              </>
            ) : weather ? (
              <>
                <Image
                  src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
                  alt={weatherCondition}
                  width={36}
                  height={36}
                  className="hidden h-9 w-9 shrink-0 min-[360px]:block"
                  unoptimized
                />
                <span className="whitespace-nowrap font-semibold">
                  {weatherTemperatureLabel}
                </span>
                <span className="hidden max-w-32 truncate capitalize sm:inline md:max-w-44">
                  {weatherCondition}
                </span>
                <span className="hidden whitespace-nowrap text-sm italic opacity-70 lg:inline">
                  At Al Judi Masjid
                </span>
              </>
            ) : (
              <>
                <CloudSun className="h-6 w-6 shrink-0 text-[var(--accent-color)]" />
                <span className="hidden whitespace-nowrap font-medium sm:inline">
                  Weather unavailable
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="justify-self-end rounded-full p-2 transition hover:bg-[var(--background-end)]"
            aria-label="Toggle theme"
          >
            {displayTheme === 'dark'
              ? <IoSunny size={24} className="text-[var(--yellow)]" />
              : <IoMoon size={24} className="text-[var(--accent-color)]" />
            }
          </button>
        </nav>
      </motion.header>
      {menuOverlay}
    </>
  )
}
