// src/app/page.tsx
'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'
import { motion } from 'motion/react'

import Welcome from './IndexComponents/Welcome'
import PrayerTimesTable from './IndexComponents/PrayerTimeTable'
import PrayerTimeline from './IndexComponents/PrayerTimeline'
import UsefulLinks from './IndexComponents/UsefulLinks'
import Plans from './IndexComponents/Plans'
import Footer from './IndexComponents/Footer'

export default function Home() {
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const current = theme === 'system' ? systemTheme : theme
  const toggleTheme = () =>
    setTheme(current === 'dark' ? 'light' : 'dark')

  return (
    <>
      <Head>
        <title>Al-judi Masjid</title>
        <link rel="icon" href="/img.png" />
        <link rel="stylesheet" href="/Style.css" />
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col"
      >
        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="
            flex items-center justify-between
            bg-[var(--background-start)] px-6 py-4
            border-b border-[var(--accent-color)]
          "
        >
          <div className="space-x-4">
            <Link
              href="/display/"
              className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90"
            >
              Display
            </Link>
            <Link
              href="/admin/"
              className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90"
            >
              Admin
            </Link>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full"
            aria-label="Toggle theme"
          >
            {current === 'dark'
              ? <IoSunny size={24} className="text-[var(--yellow)]" />
              : <IoMoon size={24} className="text-[var(--accent-color)]" />
            }
          </button>
        </motion.nav>

        {/* Title & Prayer Table */}
        <main className="lg:flex gap-8 p-0">
          <Welcome />
          <PrayerTimesTable />
        </main>

        {/* Prayer Timeline */}
        <section className="px-6 pb-8">
          <PrayerTimeline />
        </section>

        {/* Useful Links */}
        <section className="px-6 pb-8">
          <UsefulLinks />
        </section>

        {/* Planned Tasks (full viewport height) */}
        <section className="h-screen overflow-auto">
          <Plans />
        </section>

        {/* Footer */}
        <Footer />
      </motion.div>
    </>
  )
}
