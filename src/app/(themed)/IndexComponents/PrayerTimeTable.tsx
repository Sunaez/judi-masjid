'use client'

import { useMemo, useState, useEffect } from 'react'
import { CalendarDays, Download, Moon, Sun, Sunrise, Sunset, CloudSun } from 'lucide-react'
import { RawPrayerTimes } from '../../FetchPrayerTimes'
import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'
import { getActiveTimetable, type TimetableFile } from '@/lib/firebase/timetableStorage'
import TimetableDownload from './TimetableDownload'

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
      { name: 'Fajr', start: times.fajrStart, jamaat: times.fajrJamaat, Icon: Sunrise },
      { name: 'Dhuhr', start: times.dhuhrStart, jamaat: times.dhuhrJamaat, Icon: Sun },
      { name: 'Asr', start: times.asrStart, jamaat: times.asrJamaat, Icon: CloudSun },
      { name: 'Maghrib', start: times.maghrib, jamaat: times.maghrib, Icon: Sunset },
      { name: 'Isha', start: times.ishaStart, jamaat: times.ishaJamaat, Icon: Moon },
    ]
  }, [times])

  if (isError) {
    return (
      <section className={`${variant === 'card' ? 'aero-panel prayer-card min-h-full' : 'p-0'} flex items-center justify-center`}>
        <div className="text-center text-[var(--text-color)]">
          <p className="text-xl mb-2">Failed to load prayer times</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </section>
    )
  }

  if (isLoading || !times) {
    return (
      <section className={variant === 'card' ? 'aero-panel prayer-card min-h-full' : 'p-0'}>
        <TableSkeleton />
      </section>
    )
  }

  return (
    <section
      className={variant === 'card' ? 'aero-panel prayer-card min-h-full' : 'p-0'}
    >
      <div className="prayer-card-heading">
        <h2>Prayer times</h2>
        <CalendarDays aria-hidden="true" />
      </div>
      <table className="home-prayer-table">
        <caption className="sr-only">Today&apos;s prayer start and congregational prayer times</caption>
        <thead><tr><th scope="col">Prayer</th><th scope="col">Begins</th><th scope="col">Jama&apos;at</th></tr></thead>
        <tbody>
          {prayers.map(({ name, start, jamaat, Icon }) => (
            <tr key={name}>
              <th scope="row"><span className="prayer-name"><Icon aria-hidden="true" />{name}</span></th>
              <td>{start}</td><td>{jamaat}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="prayer-table-note">Jama&apos;at is the congregational prayer. All times are local to the masjid.</p>
      <TimetableDownload
        imageSrc={activeTimetable ? activeTimetable.imageData : filePath}
        label={activeTimetable ? activeTimetable.label : `${isRamadan ? 'Ramadan' : monthName} ${year} Timetable`}
        fileName={activeTimetable ? (activeTimetable.originalName || 'timetable.jpg') : fileName}
      />
      <a
        href={activeTimetable ? activeTimetable.imageData : filePath}
        download={activeTimetable ? (activeTimetable.originalName || 'timetable.jpg') : fileName}
        className="aero-button aero-button-secondary prayer-table-download"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Download {activeTimetable ? activeTimetable.label : `${isRamadan ? 'Ramadan' : monthName} ${year} Timetable`}</span>
      </a>

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
