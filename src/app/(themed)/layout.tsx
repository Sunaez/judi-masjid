'use client'
// src/app/(themed)/layout.tsx
import './themed.css'
import { ThemeProvider } from './ThemeProvider'
import { PrayerTimesProvider } from '../display/context/PrayerTimesContext'

export default function ThemedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PrayerTimesProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </PrayerTimesProvider>
  )
}
