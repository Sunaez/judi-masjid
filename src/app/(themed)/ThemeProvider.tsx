// /src/app/ThemeProvider.tsx
'use client'

import { ThemeProvider as NextThemeProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" enableSystem={true} defaultTheme="system">
      {children}
    </NextThemeProvider>
  )
}
