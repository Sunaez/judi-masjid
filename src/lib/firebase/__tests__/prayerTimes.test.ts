import {
  batchSavePrayerTimes,
  getPrayerTimesByDate,
  getTodayDateString,
  savePrayerTimes,
  syncFromCSV,
} from '../prayerTimes'
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import {
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore'

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
}))

const mockedGetDoc = getDoc as jest.Mock
const mockedSetDoc = setDoc as jest.Mock
const mockedWriteBatch = writeBatch as jest.Mock

describe('prayerTimes firebase service', () => {
  const mockPrayerTimes: RawPrayerTimes = {
    fajrStart: '05:30',
    fajrJamaat: '06:00',
    sunrise: '07:04',
    dhuhrStart: '11:54',
    dhuhrJamaat: '12:45',
    asrStart: '14:10',
    asrJamaat: '15:00',
    maghrib: '16:39',
    ishaStart: '18:09',
    ishaJamaat: '18:09',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns DD/MM/YYYY from getTodayDateString', () => {
    expect(getTodayDateString()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('throws friendly error when getPrayerTimesByDate fails', async () => {
    mockedGetDoc.mockRejectedValue(new Error('Network error'))

    await expect(getPrayerTimesByDate('01/11/2025')).rejects.toThrow(
      'Failed to fetch prayer times for 01/11/2025'
    )
  })

  it('throws friendly error when savePrayerTimes fails', async () => {
    mockedSetDoc.mockRejectedValue(new Error('Permission denied'))

    await expect(savePrayerTimes('01/11/2025', mockPrayerTimes)).rejects.toThrow(
      'Failed to save prayer times for 01/11/2025'
    )
  })

  it('batch-saves multiple prayer time rows in a single batch', async () => {
    await batchSavePrayerTimes([
      { date: '01/11/2025', times: mockPrayerTimes },
      { date: '02/11/2025', times: mockPrayerTimes },
    ])

    expect(mockedWriteBatch).toHaveBeenCalledTimes(1)
  })

  it('syncs CSV rows and counts successes/failures', async () => {
    const mockCSV = `Date,Fajr,Fajr-Jamaat,Sunrise,Dhuhr,Dhuhr-Jamaat,Asr,Asr-Jamaat,Maghrib,Isha,Isha-Jamaat
01/11/2025,05:30,06:00,07:04,11:54,12:45,14:10,15:00,16:39,18:09,18:09
invalid-date,05:31,06:00,07:06,11:54,12:45,14:08,14:45,16:38,18:08,18:08`

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => mockCSV,
    } as Response)

    const result = await syncFromCSV('https://example.com/csv')

    expect(result).toEqual({ success: 1, failed: 1 })
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/csv')
  })

  it('throws when CSV fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(syncFromCSV('https://example.com/csv')).rejects.toThrow(
      'Failed to sync prayer times from CSV'
    )
  })
})
