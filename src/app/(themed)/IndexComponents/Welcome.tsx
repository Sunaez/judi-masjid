'use client'

import { ArrowDown, HeartHandshake, MapPin } from 'lucide-react'
import { SiGooglemaps } from 'react-icons/si'
import { usePrayerTimesContext } from '../../display/context/PrayerTimesContext'
import AeroLandscape from '@/components/AeroLandscape'

const englishLines = ['Welcome to', 'Al-Judi Masjid.']
const kurdishWords = ['بەخێر', 'بێن', 'بۆ', 'مزگەوتی', 'جودی']

export default function Welcome() {
  const { isEid } = usePrayerTimesContext()

  const showPrayerTimes = () => {
    const section = document.getElementById('home-prayers')
    section?.focus({ preventScroll: true })
    section?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <section className="home-welcome" aria-labelledby="welcome-title">
      <div className="welcome-copy">
        <p className="welcome-location welcome-intro"><MapPin size={16} aria-hidden="true" /> Birmingham</p>
        <h1 id="welcome-title" aria-label="Welcome to Al-Judi Masjid.">
          {englishLines.map((line, lineIndex) => (
            <span key={line} className="welcome-heading-line" aria-hidden="true">
              {Array.from(line).map((letter, index) => (
                <span key={index} className="welcome-letter" style={{ animationDelay: `${lineIndex * 240 + index * 40}ms` }}>
                  {letter === ' ' ? '\u00a0' : letter}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="welcome-kurdish" lang="ckb" dir="rtl">
          <span className="sr-only">بەخێر بێن بۆ مزگەوتی جودی</span>
          <span aria-hidden="true">
            {kurdishWords.map((word, index) => (
              <span key={word} className="welcome-word" style={{ animationDelay: `${550 + index * 100}ms` }}>{word}{index < kurdishWords.length - 1 ? '\u00a0' : ''}</span>
            ))}
          </span>
        </p>
        <p className="welcome-description welcome-extra">A place for prayer, reflection, and belonging.<br className="hidden sm:block" /> Join us, every day.</p>
        {isEid && <p className="welcome-eid welcome-extra">Eid Mubarak to you and your family</p>}
        <div className="welcome-actions welcome-extra">
          <a className="aero-button" href="#donate"><HeartHandshake size={18} aria-hidden="true" /> Support the masjid</a>
        </div>
      </div>
      <AeroLandscape />
      <div className="welcome-bottom welcome-extra">
        <a className="welcome-address" href="https://maps.google.com/?q=298+Dudley+Rd+Birmingham+B18+4HL" target="_blank" rel="noopener noreferrer" aria-label="298 Dudley Road, Birmingham B18 4HL — open in Google Maps">
          <SiGooglemaps size={20} aria-hidden="true" />
          <span>298 Dudley Road, Birmingham B18 4HL</span>
        </a>
        <button type="button" className="welcome-scroll" onClick={showPrayerTimes}>Explore prayer times <ArrowDown size={18} aria-hidden="true" /></button>
      </div>
    </section>
  )
}
