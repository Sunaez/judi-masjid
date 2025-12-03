// src/app/FetchPrayerTimes.tsx
'use client'

import useSWR from 'swr'

export interface RawPrayerTimes {
  fajrStart:   string
  fajrJamaat:  string
  sunrise:     string
  dhuhrStart:  string
  dhuhrJamaat: string
  asrStart:    string
  asrJamaat:   string
  maghrib:     string
  ishaStart:   string
  ishaJamaat:  string
}

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfoFEcprp-CYQjw40GrjdNWToUSvv10TjQzpw30vPkpLdwLz5NSeKKhNlsseeAkWR5wBAZLnzNpDcq/pub?output=csv'

/** Returns today's date in DD/MM/YYYY format */
function todayKey(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Fetcher function for SWR - fetches and parses prayer times CSV
 */
async function fetcher(): Promise<RawPrayerTimes> {
  const res = await fetch(CSV_URL, {
    // Cache for 5 minutes in the browser
    next: { revalidate: 300 }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch prayer times (status ${res.status})`)
  }

  const text = await res.text()
  const rows = text
    .trim()
    .split('\n')
    .map(row => row.split(',').map(cell => cell.trim()))

  const key = todayKey()
  const todayRow = rows.find(cols => cols[0] === key)
  if (!todayRow) {
    throw new Error(`No prayer times found for ${key}`)
  }

  // columns: [ date, fajrStart, fajrJamaat, sunrise, dhuhrStart, dhuhrJamaat,
  //            asrStart, asrJamaat, maghrib, ishaStart, ishaJamaat ]
  const [
    ,
    fajrStart,
    fajrJamaat,
    sunrise,
    dhuhrStart,
    dhuhrJamaat,
    asrStart,
    asrJamaat,
    maghrib,
    ishaStart,
    ishaJamaat,
  ] = todayRow

  return {
    fajrStart,
    fajrJamaat,
    sunrise,
    dhuhrStart,
    dhuhrJamaat,
    asrStart,
    asrJamaat,
    maghrib,
    ishaStart,
    ishaJamaat,
  }
}

/**
 * Custom hook that uses SWR to fetch and cache prayer times
 * Automatically revalidates every 5 minutes and on window focus
 */
export function usePrayerTimes() {
  const { data, error, isLoading } = useSWR<RawPrayerTimes>(
    'prayer-times',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // Refresh every 5 minutes
      dedupingInterval: 60000,  // Dedupe requests within 1 minute
    }
  )

  return {
    times: data,
    isLoading,
    isError: error,
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use usePrayerTimes hook instead for better caching
 */
export async function fetchPrayerTimes(): Promise<RawPrayerTimes> {
  return fetcher()
}
