// src/app/FetchPrayerTimes.tsx

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
 * Fetches the CSV and parses today's row into a RawPrayerTimes object.
 */
export async function fetchPrayerTimes(): Promise<RawPrayerTimes> {
  const res = await fetch(CSV_URL)
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
