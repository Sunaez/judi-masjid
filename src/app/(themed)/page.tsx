'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'

import EidLanternBackdrop from '@/components/EidLanternBackdrop'
import { usePrayerTimesContext } from '../display/context/PrayerTimesContext'
import EidMubarakIntro from './IndexComponents/EidMubarakIntro'
import EidSalahNotice from './IndexComponents/EidSalahNotice'
import NavBar, { type SiteSectionId } from './IndexComponents/NavBar'
import Welcome from './IndexComponents/Welcome'
import PrayerTimesTable from './IndexComponents/PrayerTimeTable'
import PrayerTimeline from './IndexComponents/PrayerTimeline'
import TimetableDownload from './IndexComponents/TimetableDownload'
import UsefulLinks from './IndexComponents/UsefulLinks'
import Footer from './IndexComponents/Footer'
import QuranAndDonation from './IndexComponents/QuranAndDonation'
import DonationOptions from './IndexComponents/DonationOptions'

const sectionIds = [
  'home',
  'prayer-timetable',
  'useful-links',
  'donate',
  'contact',
] satisfies SiteSectionId[]

function isSiteSectionId(value: string): value is SiteSectionId {
  return sectionIds.includes(value as SiteSectionId)
}

function getSectionFromLocation(): SiteSectionId {
  const hash = window.location.hash.replace('#', '')

  return isSiteSectionId(hash) ? hash : 'home'
}

function getSectionUrl(section: SiteSectionId) {
  const baseUrl = `${window.location.pathname}${window.location.search}`

  return section === 'home' ? baseUrl : `${baseUrl}#${section}`
}

const contactCards = [
  {
    label: 'Visit',
    value: '298 Dudley Rd, Birmingham B18 4HL',
    href: 'https://maps.google.com/?q=298+Dudley+Rd+Birmingham+B18+4HL',
    Icon: MapPin,
  },
  {
    label: 'Sharia inquiries',
    value: '07734 155 096',
    href: 'tel:07734155096',
    Icon: Phone,
  },
  {
    label: 'Mosque email',
    value: 'judi@muslim.com',
    href: 'mailto:judi@muslim.com',
    Icon: Mail,
  },
]

function SectionShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--accent-color)] md:text-5xl">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </section>
  )
}

function HomeSection() {
  return (
    <>
      <main className="gap-8 p-0 lg:flex">
        <Welcome />
        <PrayerTimesTable />
      </main>

      <section className="px-6 pb-8">
        <PrayerTimeline />
      </section>

      <QuranAndDonation />

      <TimetableDownload />
    </>
  )
}

function PrayerTimetableSection() {
  return (
    <SectionShell eyebrow="Daily prayers" title="Prayer timetable">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-4 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--accent-color)] text-[var(--background-end)]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-color)]">
                Today at Al Judi
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Start times and jamaat times in one place.
              </p>
            </div>
          </div>
          <PrayerTimesTable />
        </div>

        <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-4 shadow-lg">
          <h2 className="text-xl font-semibold text-[var(--text-color)]">
            Timeline
          </h2>
          <PrayerTimeline />
        </div>
      </div>

      <div className="mt-2">
        <TimetableDownload />
      </div>
    </SectionShell>
  )
}

function DonateSection() {
  return (
    <SectionShell eyebrow="Support the masjid" title="Donate">
      <DonationOptions variant="full" />
    </SectionShell>
  )
}

function ContactSection() {
  return (
    <SectionShell eyebrow="Contact" title="Get in touch with Al Judi Masjid">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-3">
          {contactCards.map(({ label, value, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--accent-color)] text-[var(--background-end)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-5 block text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {label}
              </span>
              <span className="mt-2 block text-lg font-bold leading-7 text-[var(--text-color)]">
                {value}
              </span>
            </a>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--secondary-color)] bg-[var(--accent-color)] p-6 text-[var(--background-end)] shadow-lg">
          <Building2 className="h-10 w-10" />
          <h2 className="mt-4 text-2xl font-bold">Masjid contact</h2>
          <p className="mt-3 leading-7 opacity-85">
            For general masjid enquiries, prayer timetable questions, or community updates,
            contact the masjid directly.
          </p>
        </div>
      </div>
    </SectionShell>
  )
}

function renderSection(activeSection: SiteSectionId) {
  switch (activeSection) {
    case 'prayer-timetable':
      return <PrayerTimetableSection />
    case 'useful-links':
      return (
        <SectionShell eyebrow="Resources" title="Useful links">
          <UsefulLinks />
        </SectionShell>
      )
    case 'donate':
      return <DonateSection />
    case 'contact':
      return <ContactSection />
    case 'home':
    default:
      return <HomeSection />
  }
}

export default function HomePage() {
  const { isEid } = usePrayerTimesContext()
  const [activeSection, setActiveSection] = useState<SiteSectionId>('home')

  useEffect(() => {
    const syncSectionFromLocation = () => {
      setActiveSection(getSectionFromLocation())
    }

    syncSectionFromLocation()
    window.addEventListener('hashchange', syncSectionFromLocation)
    window.addEventListener('popstate', syncSectionFromLocation)

    return () => {
      window.removeEventListener('hashchange', syncSectionFromLocation)
      window.removeEventListener('popstate', syncSectionFromLocation)
    }
  }, [])

  const handleSectionChange = (section: SiteSectionId) => {
    setActiveSection(section)

    const nextUrl = getSectionUrl(section)
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (currentUrl !== nextUrl) {
      window.history.pushState({ section }, '', nextUrl)
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <EidMubarakIntro active={isEid} />
      {isEid && <EidLanternBackdrop className="opacity-75" />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex min-h-screen flex-col"
      >
        <NavBar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <EidSalahNotice />

        <div className="flex-1">
          {renderSection(activeSection)}
        </div>

        {activeSection === 'home' && <Footer />}
      </motion.div>
    </div>
  )
}
