jest.mock('../../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  setDoc: jest.fn(),
}));

import {
  dailyTimeToMinutes,
  isSlideshowWindowActive,
  normalizeDailyTimeValue,
} from '../slideshowSettings';

describe('slideshowSettings daily schedule helpers', () => {
  it('normalizes daily time values', () => {
    expect(normalizeDailyTimeValue('09:30')).toBe('09:30');
    expect(normalizeDailyTimeValue(null)).toBe('');
    expect(normalizeDailyTimeValue('not-a-time')).toBe('');
  });

  it('converts daily times to minutes since midnight', () => {
    expect(dailyTimeToMinutes('00:00')).toBe(0);
    expect(dailyTimeToMinutes('12:45')).toBe(765);
    expect(dailyTimeToMinutes('24:00')).toBeNull();
  });

  it('activates during a same-day daily window', () => {
    const settings = { active: true, startTime: '12:00', endTime: '13:00' };

    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 16, 12, 0))).toBe(true);
    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 16, 12, 59))).toBe(true);
    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 16, 13, 0))).toBe(false);
  });

  it('activates during an overnight daily window', () => {
    const settings = { active: true, startTime: '22:00', endTime: '02:00' };

    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 16, 22, 0))).toBe(true);
    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 17, 1, 59))).toBe(true);
    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 17, 2, 0))).toBe(false);
    expect(isSlideshowWindowActive(settings, new Date(2026, 4, 17, 12, 0))).toBe(false);
  });
});
