// src/app/IndexComponents/PrayerTimesTable.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fetchPrayerTimes, RawPrayerTimes } from '../../FetchPrayerTimes'

// 1. Container variants: animate section in, then stagger children
const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      when: 'beforeChildren',
      delayChildren: 0.4,
      staggerChildren: 0.15,
    },
  },
}

// 2. Row variants: fade & slide up each row
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
}

type TableTimes = Omit<RawPrayerTimes, 'sunrise'>

export default function PrayerTimesTable() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [times, setTimes] = useState<TableTimes>({
    fajrStart:   '', fajrJamaat:  '',
    dhuhrStart:  '', dhuhrJamaat: '',
    asrStart:    '', asrJamaat:   '',
    maghrib:     '',
    ishaStart:   '', ishaJamaat:  ''
  })

  // Clock: update date & time every second
  useEffect(() => {
    function tick() {
      const now = new Date()
      setDate(
        now.toLocaleDateString('en-US', {
          month: 'long',
          day:   'numeric',
        })
      )
      setTime(
        now.toLocaleTimeString('en-US', {
          hour:   '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch prayer times via shared function
  useEffect(() => {
    fetchPrayerTimes()
      .then((t: RawPrayerTimes) => {
        setTimes({
          fajrStart:   t.fajrStart,
          fajrJamaat:  t.fajrJamaat,
          dhuhrStart:  t.dhuhrStart,
          dhuhrJamaat: t.dhuhrJamaat,
          asrStart:    t.asrStart,
          asrJamaat:   t.asrJamaat,
          maghrib:     t.maghrib,
          ishaStart:   t.ishaStart,
          ishaJamaat:  t.ishaJamaat,
        })
      })
      .catch((e) => console.error('Error fetching prayer times', e))
  }, [])

  const prayers = [
    { name: 'Fajr',    start: times.fajrStart,   jamaat: times.fajrJamaat, icon: 'icon-fajr.svg' },
    { name: 'Dhuhr',   start: times.dhuhrStart,  jamaat: times.dhuhrJamaat, icon: 'icon-dhuhr.svg' },
    { name: 'Asr',     start: times.asrStart,    jamaat: times.asrJamaat,   icon: 'icon-asr.svg' },
    { name: 'Maghrib', start: times.maghrib,     jamaat: times.maghrib,     icon: 'icon-maghrib.svg' },
    { name: 'Isha',    start: times.ishaStart,   jamaat: times.ishaJamaat,  icon: 'icon-isha.svg' },
  ]

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-1 p-4 min-h-[50vh]"
    >
      <h2 className="text-2xl mb-4 text-center">Prayer Times</h2>
      <div className="flex justify-center space-x-6 mb-4">
        <span>{date}</span>
        <span>{time}</span>
      </div>

      <table
        className="
          w-full table-auto border-collapse
          bg-[var(--secondary-color)]/20
          rounded-lg shadow-lg
          shadow-[0_8px_16px_rgba(173,184,187,0.3)]
        "
      >
        <thead>
          <tr>
            <th className="px-2 py-1 border border-[var(--secondary-color)] bg-[var(--secondary-color)] text-center">
              Prayer
            </th>
            <th className="px-2 py-1 border border-[var(--secondary-color)] text-center">
              Start
            </th>
            <th className="px-2 py-1 border border-[var(--secondary-color)] bg-[var(--accent-color)] text-[var(--background-end)] text-center">
              Jama’at
            </th>
          </tr>
        </thead>
        <tbody>
          {prayers.map(({ name, start, jamaat, icon }) => (
            <motion.tr key={name} variants={rowVariants}>
              <td className="py-1 border border-[var(--secondary-color)] flex items-center justify-center space-x-2 bg-[var(--secondary-color)]">
                <img
                  src={`/Icons/${icon}`}
                  alt={`${name} icon`}
                  className="h-6 w-6"
                />
                <span className="font-medium">{name}</span>
              </td>
              <td className="py-1 border border-[var(--secondary-color)] text-center">
                {start}
              </td>
              <td className="py-1 border border-[var(--secondary-color)] text-center bg-[var(--accent-color)] text-[var(--background-end)]">
                {jamaat}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.section>
  )
}
