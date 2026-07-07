'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { RawPrayerTimes } from '../../FetchPrayerTimes'
import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'
import { getActiveTimetable, type TimetableFile } from '@/lib/firebase/timetableStorage'

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

export default function PrayerTimesTable({
  variant = 'card',
}: {
  variant?: 'card' | 'inline'
}) {
  // Get prayer times from Firebase context
  const { prayerTimes, isLoading, error, isRamadan } = usePrayerTimesContext()
  const isError = !!error

  // Fetch active timetable for download button
  const [activeTimetable, setActiveTimetable] = useState<TimetableFile | null>(null)
  useEffect(() => {
    let cancelled = false
    const loadActiveTimetable = () => {
      getActiveTimetable()
        .then((t) => { if (!cancelled) setActiveTimetable(t) })
        .catch(() => {})
    }

    let cleanupIdleTask: () => void

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(loadActiveTimetable, { timeout: 3000 })
      cleanupIdleTask = () => window.cancelIdleCallback(idleId)
    } else {
      const timeoutId = globalThis.setTimeout(loadActiveTimetable, 1200)
      cleanupIdleTask = () => globalThis.clearTimeout(timeoutId)
    }

    return () => {
      cancelled = true
      cleanupIdleTask()
    }
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
      <section className={`${variant === 'card' ? 'min-h-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-xl sm:p-6' : 'p-0'} flex items-center justify-center`}>
        <div className="text-center text-red-500">
          <p className="text-xl mb-2">Failed to load prayer times</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </section>
    )
  }

  if (isLoading || !times) {
    return (
      <section className={variant === 'card' ? 'min-h-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-xl sm:p-6' : 'p-0'}>
        <TableSkeleton />
      </section>
    )
  }

  return (
    <section
      className={variant === 'card' ? 'min-h-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-xl sm:p-6' : 'p-0'}
    >
      <h2 className="mb-4 text-center text-2xl font-bold text-[var(--text-color)]">
        Prayer Times
      </h2>

      <div className="overflow-hidden rounded-lg border border-[var(--secondary-color)] shadow-lg shadow-[0_8px_16px_rgba(173,184,187,0.24)]">
        <table className="w-full table-auto border-collapse bg-[var(--secondary-color)]/20 text-sm sm:text-base">
          <thead>
            <tr>
              <th className="border-b border-r border-[var(--secondary-color)] bg-[var(--secondary-color)] px-2 py-3 text-center font-bold">
                Prayer
              </th>
              <th className="border-b border-r border-[var(--secondary-color)] px-2 py-3 text-center font-bold">
                Start
              </th>
              <th className="border-b border-[var(--secondary-color)] bg-[var(--accent-color)] px-2 py-3 text-center font-bold text-[var(--background-end)]">
                Jama&apos;at
              </th>
            </tr>
          </thead>
          <tbody>
            {prayers.map(({ name, start, jamaat, icon }) => (
              <tr key={name}>
                <td className="flex items-center justify-center space-x-2 border-r border-t border-[var(--secondary-color)] bg-[var(--secondary-color)] px-2 py-3">
                  <Image
                    src={`/Icons/${icon}`}
                    alt={`${name} icon`}
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                  <span className="font-medium">{name}</span>
                </td>
                <td className="border-r border-t border-[var(--secondary-color)] px-2 py-3 text-center font-semibold">
                  {start}
                </td>
                <td className="border-t border-[var(--secondary-color)] bg-[var(--accent-color)] px-2 py-3 text-center font-semibold text-[var(--background-end)]">
                  {jamaat}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4">
        <a
          href={activeTimetable ? activeTimetable.imageData : filePath}
          download={activeTimetable ? (activeTimetable.originalName || 'timetable.jpg') : fileName}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--x-background-start)] px-4 py-2 font-semibold text-[var(--x-text-color)] transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
        >
          <Download className="h-5 w-5 mr-2" />
          <span>
            Download {activeTimetable ? activeTimetable.label : `${isRamadan ? 'Ramadan' : monthName} ${year} Timetable`}
          </span>
        </a>
      </div>

      {isRamadan && (
        <div className="mt-6">
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

          <div className="mt-4 flex justify-center">
            <a
              href={activeTimetable ? activeTimetable.imageData : filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-[var(--secondary-color)] text-[var(--text-color)] hover:bg-[var(--secondary-color)]/20 transition-colors duration-200"
            >
              Full View Ramadan Timetable
            </a>
          </div>

          <div className="block mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeTimetable ? activeTimetable.imageData : filePath}
              alt={`Ramadan ${year} timetable`}
              loading="lazy"
              decoding="async"
              className="w-full rounded-xl border border-[var(--secondary-color)] object-contain"
            />
          </div>
        </div>
      )}
    </section>
  )
}
