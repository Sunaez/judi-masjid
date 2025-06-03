'use client'
// src/app/(themed)/layout.tsx
import './themed.css'
import { ThemeProvider } from './ThemeProvider'

export default function ThemedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeProvider>{children}</ThemeProvider>
}
