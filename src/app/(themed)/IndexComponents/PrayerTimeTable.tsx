'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { IoDownload } from 'react-icons/io5'
import { RawPrayerTimes } from '../../FetchPrayerTimes'
import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'
import { getActiveTimetable, type TimetableFile } from '@/lib/firebase/timetableStorage'

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

// Loading skeleton component
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 rounded w-3/4 mx-auto mb-4" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }}></div>
        ))}
      </div>
    </div>
  )
}

export default function PrayerTimesTable() {
  // Get prayer times from Firebase context
  const { prayerTimes, isLoading, error, isRamadan } = usePrayerTimesContext()
  const isError = !!error

  // Fetch active timetable for download button
  const [activeTimetable, setActiveTimetable] = useState<TimetableFile | null>(null)
  useEffect(() => {
    let cancelled = false
    getActiveTimetable()
      .then((t) => { if (!cancelled) setActiveTimetable(t) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Transform prayer times to table format (omit sunrise)
  const times: TableTimes | null = useMemo(() => {
    if (!prayerTimes) return null
    return {
      fajrStart: prayerTimes.fajrStart,
      fajrJamaat: prayerTimes.fajrJamaat,
      dhuhrStart: prayerTimes.dhuhrStart,
      dhuhrJamaat: prayerTimes.dhuhrJamaat,
      asrStart: prayerTimes.asrStart,
      asrJamaat: prayerTimes.asrJamaat,
      maghrib: prayerTimes.maghrib,
      ishaStart: prayerTimes.ishaStart,
      ishaJamaat: prayerTimes.ishaJamaat,
    }
  }, [prayerTimes])

  // Memoize month/year calculations
  const { year, monthName, fileName, filePath } = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const monthName = now.toLocaleString('default', { month: 'long' })
    const monthNum = String(now.getMonth() + 1).padStart(2, '0')
    const fileName = isRamadan ? `R-${year}.jpg` : `${monthNum}-${year}.jpg`
    const filePath = `/Timetables/${fileName}`

    return { year, monthName, fileName, filePath }
  }, [isRamadan])

  // Memoize prayers array
  const prayers = useMemo(() => {
    if (!times) return []

    return [
      { name: 'Fajr', start: times.fajrStart, jamaat: times.fajrJamaat, icon: 'icon-fajr.svg' },
      { name: 'Dhuhr', start: times.dhuhrStart, jamaat: times.dhuhrJamaat, icon: 'icon-dhuhr.svg' },
      { name: 'Asr', start: times.asrStart, jamaat: times.asrJamaat, icon: 'icon-asr.svg' },
      { name: 'Maghrib', start: times.maghrib, jamaat: times.maghrib, icon: 'icon-maghrib.svg' },
      { name: 'Isha', start: times.ishaStart, jamaat: times.ishaJamaat, icon: 'icon-isha.svg' },
    ]
  }, [times])

  if (isError) {
    return (
      <section className="flex-1 p-4 min-h-[50vh] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-xl mb-2">Failed to load prayer times</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </section>
    )
  }

  if (isLoading || !times) {
    return (
      <section className="flex-1 p-4 min-h-[50vh]">
        <TableSkeleton />
      </section>
    )
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-1 p-4 min-h-[50vh]"
    >
      <h2 className="text-2xl mb-4 text-center">Prayer Times</h2>

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
              Jama'at
            </th>
          </tr>
        </thead>
        <tbody>
          {prayers.map(({ name, start, jamaat, icon }) => (
            <motion.tr key={name} variants={rowVariants}>
              <td className="py-1 border border-[var(--secondary-color)] flex items-center justify-center space-x-2 bg-[var(--secondary-color)]">
                <Image
                  src={`/Icons/${icon}`}
                  alt={`${name} icon`}
                  width={24}
                  height={24}
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

      <div className="flex justify-center mt-4">
        <a
          href={activeTimetable ? activeTimetable.imageData : filePath}
          download={activeTimetable ? (activeTimetable.originalName || 'timetable.jpg') : fileName}
          className="flex items-center px-4 py-2 bg-[var(--x-background-start)] text-[var(--x-text-color)] rounded-lg hover:px-6 hover:py-3 transition-all duration-200"
        >
          <IoDownload className="h-5 w-5 mr-2" />
          <span>
            Download {activeTimetable ? activeTimetable.label : `${isRamadan ? 'Ramadan' : monthName} ${year} Timetable`}
          </span>
        </a>
      </div>

      {isRamadan && (
        <motion.div variants={rowVariants} className="mt-6">
          <div className="rounded-2xl border border-[var(--secondary-color)] bg-[var(--secondary-color)]/20 p-4 text-center shadow-lg">
            <p className="text-3xl font-bold text-[var(--accent-color)]">Ramadan Mubarak</p>
            <p className="mt-2 text-base text-[var(--text-color)]">
              View and download the Ramadan timetable directly below.
            </p>
          </div>

          <div className="mt-4 flex justify-center">
            <a
              href={activeTimetable ? activeTimetable.imageData : filePath}
              download={activeTimetable ? (activeTimetable.originalName || 'timetable.jpg') : fileName}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--accent-color)] text-[var(--background-end)] hover:opacity-90 transition-opacity duration-200"
            >
              Download Ramadan Timetable
            </a>
          </div>

          <div className="block mt-4">
            <img
              src={activeTimetable ? activeTimetable.imageData : filePath}
              alt={`Ramadan ${year} timetable`}
              className="w-full rounded-xl border border-[var(--secondary-color)] object-contain"
            />
          </div>
        </motion.div>
      )}
    </motion.section>
  )
}
