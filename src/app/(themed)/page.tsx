'use client'

import { motion } from 'motion/react'

import EidLanternBackdrop from '@/components/EidLanternBackdrop'
import { usePrayerTimesContext } from '../display/context/PrayerTimesContext'
import EidMubarakIntro from './IndexComponents/EidMubarakIntro'
import EidSalahNotice from './IndexComponents/EidSalahNotice'
import NavBar from './IndexComponents/NavBar'
import Welcome from './IndexComponents/Welcome'
import PrayerTimesTable from './IndexComponents/PrayerTimeTable'
import PrayerTimeline from './IndexComponents/PrayerTimeline'
import TimetableDownload from './IndexComponents/TimetableDownload'
import UsefulLinks from './IndexComponents/UsefulLinks'
import Footer from './IndexComponents/Footer'

export default function Home() {
  const { isEidAlFitr } = usePrayerTimesContext()

  return (
    <div className="relative overflow-hidden">
      <EidMubarakIntro active={isEidAlFitr} />
      {isEidAlFitr && <EidLanternBackdrop className="opacity-75" />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col"
      >
        <NavBar />
        <EidSalahNotice />

        {/* Title & Prayer Table */}
        <main className="lg:flex gap-8 p-0">
          <Welcome />
          <PrayerTimesTable />
        </main>

        {/* Prayer Timeline */}
        <section className="px-6 pb-8">
          <PrayerTimeline />
        </section>

        {/* Prayer Timetable Download */}
        <TimetableDownload />

        {/* Useful Links */}
        <section className="px-6 pb-8">
          <UsefulLinks />
        </section>

        {/* Footer */}
        <Footer />
      </motion.div>
    </div>
  )
}
