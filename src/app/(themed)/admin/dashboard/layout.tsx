'use client'

import type { ReactNode } from 'react'

import AdminAuthGuard from '../AdminComponents/AdminAuthGuard'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>
}
