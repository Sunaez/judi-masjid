// src/app/(themed)/IndexComponents/NavBar.tsx
'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'
import { motion } from 'motion/react'

// Firestore imports
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

type Weather = {
  condition: string
  forecastCondition: string
  forecastTemp: number
  iconCode: string
  temp: number
  timestamp: number
}

export default function NavBar() {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    setMounted(true)
    const unsubscribe = onSnapshot(
      doc(db, 'weather', 'current'),
      snap => snap.exists() && setWeather(snap.data() as Weather),
      err => console.error('Failed to fetch weather:', err)
    )
    return () => unsubscribe()
  }, [])

  if (!mounted) return null
  const currentTheme = theme === 'system' ? systemTheme : theme
  const toggleTheme = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark')

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex items-center justify-between bg-[var(--background-start)] px-6 py-2 border-b border-[var(--accent-color)]"
    >
      <div className="flex items-center space-x-4">
        {/* Nav links */}
        <Link href="/display/" className="px-3 py-1 rounded bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90 text-sm">
          Display
        </Link>
        <Link href="/admin/" className="px-3 py-1 rounded bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90 text-sm">
          Admin
        </Link>

        {/* Weather display with entry animation */}
        {weather ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-2 text-base"
          >
            <img
              src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
              alt={weather.forecastCondition}
              className="w-8 h-8"
            />
            <span className="font-medium">
              {Math.round(weather.forecastTemp)}°C, <span className="capitalize">{weather.forecastCondition}</span>
            </span>
            <span className="italic text-sm">At Al Judi Masjid</span>
          </motion.div>
        ) : (
          <div className="text-base italic opacity-50">Loading weather…</div>
        )}
      </div>

      <button onClick={toggleTheme} className="p-2 rounded-full" aria-label="Toggle theme">
        {currentTheme === 'dark'
          ? <IoSunny size={24} className="text-[var(--yellow)]" />
          : <IoMoon size={24} className="text-[var(--accent-color)]" />
        }
      </button>
    </motion.nav>
  )
}