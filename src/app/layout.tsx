import './globals.css'
import type { Metadata } from 'next'
import { Poppins, Zain } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

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

export const metadata: Metadata = {
  title: 'Al-Judi Masjid',
  description: 'Kiosk display & admin for Al-Judi Masjid',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning silences the class mismatch 
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${zain.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          enableSystem
          defaultTheme="system"
          // turn off auto color-scheme style injection
          enableColorScheme={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
