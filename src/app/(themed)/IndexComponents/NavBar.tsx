'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { CalendarDays, CloudSun, HeartHandshake, Home, Link2, MapPin, Moon, Sun } from 'lucide-react'
import { useWeather } from '@/app/hooks/useWeather'

export type SiteSectionId = 'home' | 'prayer-timetable' | 'useful-links' | 'donate' | 'contact'

const sections = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'prayer-timetable', label: 'Prayer times', Icon: CalendarDays },
  { id: 'useful-links', label: 'Resources', Icon: Link2 },
  { id: 'donate', label: 'Donate', Icon: HeartHandshake },
  { id: 'contact', label: 'Contact', Icon: MapPin },
] as const

export default function NavBar({ activeSection, onSectionChange }: {
  activeSection: SiteSectionId
  onSectionChange: (section: SiteSectionId) => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { weather } = useWeather()
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="#home" className="site-brand" onClick={event => { event.preventDefault(); onSectionChange('home') }}>
          <span className="site-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 26V16h20v10M9 16c0-5 5-6 8-11 3 5 8 6 8 11M17 5V2M14 26v-6q3-5 6 0v6M3 26V9M1 10h4M3 9V5M1 26h28" /></svg>
          </span>
          <span>Al-Judi Masjid</span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          {sections.map(({ id, label, Icon }) => (
            <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'page' : undefined}
              onClick={event => { event.preventDefault(); onSectionChange(id) }}>
              <Icon size={19} aria-hidden="true" /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="site-header-tools">
          {weather && <span className="site-weather" title={weather.condition}><CloudSun size={19} aria-hidden="true" />{Math.round(weather.temp)}°C</span>}
          <Link className="site-display-link" href="/display/">Display <span aria-hidden="true">↗</span></Link>
          <button type="button" className="site-theme-toggle" onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to day theme' : 'Switch to night theme'} title={isDark ? 'Day theme' : 'Night theme'}>
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  )
}
