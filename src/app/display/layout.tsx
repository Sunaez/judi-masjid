// src/app/display/layout.tsx
import './display.css'
import { ThemeProvider } from './ThemeProvider'
import { Poppins, Zain } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Al-Judi Masjid - Display',
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
})

const zain = Zain({
  subsets: ['arabic'],
  weight: '400',
  variable: '--font-zain',
})

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <main
        className={`display-root ${poppins.variable} ${zain.variable}`}
      >
        {children}
      </main>
    </ThemeProvider>
  )
}
