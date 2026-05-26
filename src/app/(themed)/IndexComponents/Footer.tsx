// src/app/(themed)/IndexComponents/Footer.tsx

'use client'

import Link from 'next/link'
import { Mail, MapPin, Monitor, Phone, ShieldCheck } from 'lucide-react'

const accessLinks = [
  {
    href: '/display/',
    label: 'Display',
    description: 'Masjid screen view',
    Icon: Monitor,
  },
  {
    href: '/admin/',
    label: 'Admin',
    description: 'Prayer and message tools',
    Icon: ShieldCheck,
  },
]

const contactItems = [
  {
    label: 'Address',
    value: '298 Dudley Rd, Birmingham B18 4HL',
    Icon: MapPin,
  },
  {
    label: 'Sharia inquiries',
    value: '07734 155 096',
    Icon: Phone,
  },
  {
    label: 'Mosque',
    value: 'judi@muslim.com',
    Icon: Mail,
  },
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[var(--accent-color)] px-6 py-12 text-[var(--background-end)]">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase opacity-70">
              Al-Judi Masjid
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
              Visit us or get in touch
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 opacity-80">
              We welcome visitors for daily prayers, community support, and general enquiries.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {contactItems.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex min-h-24 gap-3 rounded-lg border border-[var(--background-end)]/20 bg-[var(--background-end)]/10 p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--background-end)] text-[var(--accent-color)]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium opacity-70">{label}</span>
                  <span className="mt-1 block text-base font-semibold leading-6">{value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 lg:pl-6">
          <div>
            <h3 className="text-lg font-semibold">Site access</h3>
          </div>

          <div className="grid gap-3">
            {accessLinks.map(({ href, label, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 rounded-lg bg-[var(--background-end)] px-4 py-4 text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--accent-color)] text-[var(--background-end)]">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{label}</span>
                  <span className="mt-0.5 block text-sm opacity-70">{description}</span>
                </span>
                <span className="text-xl leading-none transition group-hover:translate-x-1" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>

          <div className="border-t border-[var(--background-end)]/20 pt-4 text-sm opacity-70">
            Website/TV screen: alanddazad4@gmail.com
          </div>
        </div>
      </div>
    </footer>
  )
}
