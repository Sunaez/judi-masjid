'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { IoDownload } from 'react-icons/io5'
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

// Loading skeleton component
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  )
}

export default function PrayerTimesTable() {
  const [times, setTimes] = useState<TableTimes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  // Fetch prayer times
  useEffect(() => {
    fetchPrayerTimes()
      .then((t: RawPrayerTimes) => {
        setTimes({
          fajrStart: t.fajrStart,
          fajrJamaat: t.fajrJamaat,
          dhuhrStart: t.dhuhrStart,
          dhuhrJamaat: t.dhuhrJamaat,
          asrStart: t.asrStart,
          asrJamaat: t.asrJamaat,
          maghrib: t.maghrib,
          ishaStart: t.ishaStart,
          ishaJamaat: t.ishaJamaat,
        })
        setIsLoading(false)
      })
      .catch((e) => {
        console.error('Error fetching prayer times', e)
        setIsError(true)
        setIsLoading(false)
      })
  }, [])

  // Memoize month/year calculations
  const { monthNum, year, monthName, fileName, filePath } = useMemo(() => {
    const now = new Date()
    const monthNum = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const monthName = now.toLocaleString('default', { month: 'long' })
    const fileName = `${monthNum}-${year}.jpg`
    const filePath = `/Timetables/${fileName}`

    return { monthNum, year, monthName, fileName, filePath }
  }, [])

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

  // Download handler: triggers download of the computed file
  const downloadTimetable = () => {
    const link = document.createElement('a')
    link.href = filePath
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
        <button
          onClick={downloadTimetable}
          className="flex items-center px-4 py-2 bg-[var(--x-background-start)] text-[var(--x-text-color)] rounded-lg hover:px-6 hover:py-3 transition-all duration-200"
        >
          <IoDownload className="h-5 w-5 mr-2" />
          <span>Download {monthName} {year} Timetable</span>
        </button>
      </div>
    </motion.section>
  )
}
