'use client'

import Head from 'next/head'
import { motion } from 'motion/react'

import NavBar from './IndexComponents/NavBar'
import Welcome from './IndexComponents/Welcome'
import PrayerTimesTable from './IndexComponents/PrayerTimeTable'
import PrayerTimeline from './IndexComponents/PrayerTimeline'
import UsefulLinks from './IndexComponents/UsefulLinks'
import Footer from './IndexComponents/Footer'

export default function Home() {
  return (
    <>
      <Head>
        <title>Al-judi Masjid</title>
        <link rel="icon" href="/img.png" />
        <link rel="stylesheet" href="/Style.css" />
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col"
      >
        <NavBar />

        {/* Title & Prayer Table */}
        <main className="lg:flex gap-8 p-0">
          <Welcome />
          <PrayerTimesTable />
        </main>

        {/* Prayer Timeline */}
        <section className="px-6 pb-8">
          <PrayerTimeline />
        </section>

        {/* Useful Links */}
        <section className="px-6 pb-8">
          <UsefulLinks />
        </section>

        {/* Footer */}
        <Footer />
      </motion.div>
    </>
  )
}
