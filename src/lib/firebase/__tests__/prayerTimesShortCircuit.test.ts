import { getPrayerTimesByDate } from '../prayerTimes'
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes'
import { getDoc } from 'firebase/firestore'

// localStorage key used by the "simulate connection error" flag (req #4).
const FLAG_KEY = 'judi.display.simulatedConnectionError'

jest.mock('@/lib/firebase', () => ({ db: {} }))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}))

// Faithfully replicate displayFlags.ts localStorage behavior against a real key.
// (The module's exports resolve as `undefined` when imported in isolation under
// next/jest's babel transform, so we stub it here to exercise the guard directly.)
jest.mock('@/app/display/context/displayFlags', () => {
  const FLAG_KEY = 'judi.display.simulatedConnectionError'
  return {
    FLAG_KEY,
    isSimulatedConnectionError: () => localStorage.getItem(FLAG_KEY) === 'true',
  }
})

const mockedGetDoc = getDoc as jest.Mock

describe('prayerTimes simulated-connection-error guard (req #4)', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedGetDoc.mockReset()
    // Default: document does not exist.
    mockedGetDoc.mockResolvedValue({ exists: () => false } as any)
  })

  it('short-circuits Firestore and returns null when the flag is set', async () => {
    localStorage.setItem(FLAG_KEY, 'true')

    const result = await getPrayerTimesByDate('01/11/2025')

    expect(result).toBeNull()
    expect(mockedGetDoc).not.toHaveBeenCalled()
  })

  it('proceeds to Firestore when the flag is not set', async () => {
    const result = await getPrayerTimesByDate('01/11/2025')

    expect(mockedGetDoc).toHaveBeenCalledTimes(1)
    // Document does not exist → null.
    expect(result).toBeNull()
  })

  it('returns the stored prayer times when the document exists', async () => {
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

    mockedGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...mockPrayerTimes, date: '01/11/2025' }),
    } as any)

    const result = await getPrayerTimesByDate('01/11/2025')

    expect(result).toEqual(mockPrayerTimes)
  })

  it('throws a friendly error when Firestore read fails', async () => {
    mockedGetDoc.mockRejectedValue(new Error('Network error'))

    await expect(getPrayerTimesByDate('01/11/2025')).rejects.toThrow(
      'Failed to fetch prayer times for 01/11/2025'
    )
  })
})
