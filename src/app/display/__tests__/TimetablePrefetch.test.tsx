import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import TimetablePrefetch from '../Components/TimetablePrefetch';
import { getPrayerTimesByDate } from '@/lib/firebase/prayerTimes';
import { readTimetable } from '@/lib/timetableCache';

jest.mock('@/lib/firebase/prayerTimes', () => ({
  getPrayerTimesByDate: jest.fn(), getTomorrowDateString: () => '10/09/2026',
}));
const times = { fajrStart: '05:00', fajrJamaat: '05:30', sunrise: '06:30', dhuhrStart: '12:00',
  dhuhrJamaat: '13:00', asrStart: '15:00', asrJamaat: '16:00', maghrib: '18:30', ishaStart: '20:00', ishaJamaat: '21:00' };
afterEach(() => { cleanup(); jest.useRealTimers(); jest.resetAllMocks(); });

it('retries a missing future timetable and persists it under its actual date', async () => {
  jest.useFakeTimers();
  jest.mocked(getPrayerTimesByDate).mockResolvedValueOnce(null).mockResolvedValue(times);
  render(<TimetablePrefetch />);
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  expect(readTimetable('10/09/2026')).toBeNull();
  await act(async () => { await jest.advanceTimersByTimeAsync(300_000); });
  expect(readTimetable('10/09/2026')).toEqual(times);
  expect(readTimetable('09/09/2026')).toBeNull();
});

it('does not persist a response arriving after cleanup', async () => {
  let resolve!: (value: typeof times) => void;
  jest.mocked(getPrayerTimesByDate).mockReturnValue(new Promise(done => { resolve = done; }));
  const { unmount } = render(<TimetablePrefetch />);
  unmount();
  await act(async () => { resolve(times); });
  expect(readTimetable('10/09/2026')).toBeNull();
});
