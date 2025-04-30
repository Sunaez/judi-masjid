// src/app/page.tsx
'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { IoSunny, IoMoon } from 'react-icons/io5'

export default function Home() {
  // ─── 1) Theme & Mount ───────────────────────────────────────────────
  const { theme, systemTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = theme === 'system' ? systemTheme : theme
  const toggleTheme = () =>
    setTheme(current === 'dark' ? 'light' : 'dark')

  // ─── 2) Clock ─────────────────────────────────────────────────────────
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      setDate(
        now.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        })
      )
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ─── 3) Prayer Times ───────────────────────────────────────────────────
  const [times, setTimes] = useState({
    fajrStart: '', fajrJamaat: '',
    dhuhrStart: '', dhuhrJamaat: '',
    asrStart:  '', asrJamaat:  '',
    maghrib:   '', isha:       '',
    ishaJamaat:''
  })
  useEffect(() => {
    const csvUrl =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfoFEcprp-CYQjw40GrjdNWToUSvv10TjQzpw30vPkpLdwLz5NSeKKhNlsseeAkWR5wBAZLnzNpDcq/pub?output=csv'
    async function fetchTimes() {
      try {
        const res = await fetch(csvUrl)
        const text = await res.text()
        const rows = text.split('\n')
        const now = new Date()
        const dd = String(now.getDate()).padStart(2, '0')
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const yyyy = now.getFullYear()
        const today = `${dd}/${mm}/${yyyy}`
        const row = rows.find(l => l.split(',')[0]?.trim() === today)
        if (!row) return
        const c = row.split(',')
        setTimes({
          fajrStart:   c[1]  || '',
          fajrJamaat:  c[2]  || '',
          dhuhrStart:  c[4]  || '',
          dhuhrJamaat: c[5]  || '',
          asrStart:    c[6]  || '',
          asrJamaat:   c[7]  || '',
          maghrib:     c[8]  || '',
          isha:        c[9]  || '',
          ishaJamaat:  c[10] || '',
        })
      } catch (e) {
        console.error('Error fetching prayer times', e)
      }
    }
    fetchTimes()
  }, [])

  return (
    <>
      <Head>
        <title>Al-judi Masjid</title>
        <link rel="icon" href="/img.png" />
        <link rel="stylesheet" href="/Style.css" />
      </Head>

      <div className="flex flex-col">
        {/* Nav */}
        <nav className="
          flex items-center justify-between
          bg-[var(--background-start)] px-6 py-4
          border-b border-[var(--accent-color)]
        ">
          <div className="space-x-4">
            <Link
              href="/kiosk"
              className="px-4 py-2 rounded bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90"
            >
              Display
            </Link>
            <Link
              href="/admin"
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
            {current === 'dark' ? (
              <IoSunny size={24} className="text-[var(--yellow)]" />
            ) : (
              <IoMoon size={24} className="text-[var(--accent-color)]" />
            )}
          </button>
        </nav>

        {/* Main: at least 100vh */}
        <main className="min-h-screen lg:flex gap-8 p-6">
          {/* Left */}
          <section className="flex-1 space-y-4">
            <h1 className="text-4xl font-bold">
              Welcome to Al-judi Masjid
            </h1>
            <p className="arabic">
              بەخێر بێن بۆ مزگەوتی جودی
            </p>
          </section>

          {/* Right: Prayer Times Table */}
          <section className="flex-1 p-4">
            <h2 className="text-2xl mb-4 text-center">
              Prayer Times
            </h2>
            {/* Moved date/time here */}
            <div className="flex justify-center space-x-6 mb-4">
              <span>{date}</span>
              <span>{time}</span>
            </div>
            <table className="
              w-full
              table-auto
              border-collapse
              bg-[var(--secondary-color)]/20
              divide-y divide-x divide-[var(--secondary-color)]
              rounded-lg
              shadow-lg shadow-[0_8px_16px_rgba(173,184,187,0.3)]
            ">
              <thead>
                <tr className="border-b border-[var(--secondary-color)]">
                  <th className="px-2 py-1"></th>
                  <th className="px-2 py-1 text-center">Start</th>
                  <th className="
                    px-2 py-1
                    bg-[var(--accent-color)]
                    text-[var(--background-end)]
                    text-center
                  ">
                    Jama'at
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Fajr', times.fajrStart, times.fajrJamaat],
                  ['Dhuhr', times.dhuhrStart, times.dhuhrJamaat],
                  ['Asr', times.asrStart, times.asrJamaat],
                ].map(([name, s, j]) => (
                  <tr key={name} className="border-r border-[var(--secondary-color)]">
                    <td className="py-1 text-center font-medium">{name}</td>
                    <td className="py-1 text-center">{s}</td>
                    <td className="
                      py-1 text-center
                      bg-[var(--accent-color)]
                      text-[var(--background-end)]
                    ">
                      {j}
                    </td>
                  </tr>
                ))}
                <tr className="border-r border-[var(--secondary-color)]">
                  <td className="py-1 text-center font-medium">Maghrib</td>
                  <td colSpan={2} className="py-1 text-center">
                    {times.maghrib}
                  </td>
                </tr>
                <tr className="border-r border-[var(--secondary-color)]">
                  <td className="py-1 text-center font-medium">Isha</td>
                  <td className="py-1 text-center">{times.isha}</td>
                  <td className="
                    py-1 text-center
                    bg-[var(--accent-color)]
                    text-[var(--background-end)]
                  ">
                    {times.ishaJamaat}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>

        {/* Footer */}
        <footer className="
          h-[20vh]
          bg-[var(--background-end)]
          flex flex-col justify-center items-center
        ">
          <p className="text-[var(--text-color)]">
            298 Dudley Rd, Birmingham B18 4HL
          </p>
          <p className="text-[var(--text-color)] mt-2">
            for any questions don't hesitate to come inside
          </p>
        </footer>
      </div>
    </>
  )
}
