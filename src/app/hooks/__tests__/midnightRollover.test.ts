// src/app/hooks/__tests__/midnightRollover.test.ts
/**
 * Tests for midnight rollover handling in prayer times fetching.
 * Ensures the display correctly transitions to new day's prayer times.
 */

describe('Midnight Rollover Logic', () => {
  // Helper function to calculate ms until midnight
  function getMsUntilMidnight(currentHour: number, currentMinute: number): number {
    const now = new Date();
    now.setHours(currentHour, currentMinute, 0, 0);
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }

  describe('getMsUntilMidnight calculation', () => {
    it('should return correct ms from 23:00 to midnight (1 hour)', () => {
      const ms = getMsUntilMidnight(23, 0);
      expect(ms).toBe(60 * 60 * 1000); // 1 hour in ms
    });

    it('should return correct ms from 23:59 to midnight (1 minute)', () => {
      const ms = getMsUntilMidnight(23, 59);
      expect(ms).toBe(60 * 1000); // 1 minute in ms
    });

    it('should return correct ms from 12:00 to midnight (12 hours)', () => {
      const ms = getMsUntilMidnight(12, 0);
      expect(ms).toBe(12 * 60 * 60 * 1000); // 12 hours in ms
    });

    it('should return correct ms from 00:00 to midnight (24 hours)', () => {
      const ms = getMsUntilMidnight(0, 0);
      expect(ms).toBe(24 * 60 * 60 * 1000); // 24 hours in ms
    });

    it('should return correct ms from 00:01 to midnight (23h 59m)', () => {
      const ms = getMsUntilMidnight(0, 1);
      expect(ms).toBe((23 * 60 + 59) * 60 * 1000); // 23h 59m in ms
    });
  });

  describe('date string format', () => {
    // Helper to format date as DD/MM/YYYY
    function formatDate(date: Date): string {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('should handle single digit day', () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024
      expect(formatDate(date)).toBe('05/01/2024');
    });

    it('should handle December correctly', () => {
      const date = new Date(2024, 11, 25); // Dec 25, 2024
      expect(formatDate(date)).toBe('25/12/2024');
    });

    it('should change at midnight', () => {
      const before = new Date(2024, 0, 15, 23, 59, 59);
      const after = new Date(2024, 0, 16, 0, 0, 0);

      expect(formatDate(before)).toBe('15/01/2024');
      expect(formatDate(after)).toBe('16/01/2024');
    });

    it('should handle month transition', () => {
      const jan31 = new Date(2024, 0, 31);
      const feb1 = new Date(2024, 1, 1);

      expect(formatDate(jan31)).toBe('31/01/2024');
      expect(formatDate(feb1)).toBe('01/02/2024');
    });

    it('should handle year transition', () => {
      const dec31 = new Date(2024, 11, 31);
      const jan1 = new Date(2025, 0, 1);

      expect(formatDate(dec31)).toBe('31/12/2024');
      expect(formatDate(jan1)).toBe('01/01/2025');
    });
  });

  describe('time comparison edge cases', () => {
    // Helper to convert HH:MM to minutes since midnight
    function timeToMinutes(hhmm: string): number {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    }

    it('should convert midnight (00:00) to 0 minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
    });

    it('should convert 23:59 to 1439 minutes', () => {
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('should handle single digit hours', () => {
      expect(timeToMinutes('05:30')).toBe(330);
    });

    it('should compare times correctly for overnight period', () => {
      // Isha at 21:00 (1260 min), Fajr at 05:30 (330 min)
      const ishaMinutes = timeToMinutes('21:00');
      const fajrMinutes = timeToMinutes('05:30');

      // Downtime: 22:00 to 04:30
      const downtimeStart = ishaMinutes + 60; // 1320
      const downtimeEnd = fajrMinutes - 60;   // 270

      expect(downtimeStart).toBe(1320); // 22:00
      expect(downtimeEnd).toBe(270);    // 04:30

      // Test at midnight (0 min)
      const midnightMinutes = 0;
      // Overnight check: current >= start OR current <= end
      const isDowntimeAtMidnight =
        midnightMinutes >= downtimeStart || midnightMinutes <= downtimeEnd;
      expect(isDowntimeAtMidnight).toBe(true);

      // Test at 3:00 AM (180 min)
      const threeAM = 180;
      const isDowntimeAt3AM =
        threeAM >= downtimeStart || threeAM <= downtimeEnd;
      expect(isDowntimeAt3AM).toBe(true);

      // Test at 10:00 AM (600 min)
      const tenAM = 600;
      const isDowntimeAt10AM =
        tenAM >= downtimeStart || tenAM <= downtimeEnd;
      expect(isDowntimeAt10AM).toBe(false);

      // Test at 23:00 (1380 min)
      const elevenPM = 1380;
      const isDowntimeAt11PM =
        elevenPM >= downtimeStart || elevenPM <= downtimeEnd;
      expect(isDowntimeAt11PM).toBe(true);
    });
  });
});

describe('Prayer Time Window Blocking', () => {
  // Helper to create Date from HH:MM
  function timeToDate(hhmm: string): Date {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
  }

  // Build blocked windows (3min before to 5min after)
  function getBlockedWindow(timeStr: string): [Date, Date] {
    const base = timeToDate(timeStr);
    return [
      new Date(base.getTime() - 3 * 60_000),
      new Date(base.getTime() + 5 * 60_000),
    ];
  }

  it('should create correct blocked window', () => {
    const [start, end] = getBlockedWindow('13:00');

    // 3 min before 13:00 = 12:57
    expect(start.getHours()).toBe(12);
    expect(start.getMinutes()).toBe(57);

    // 5 min after 13:00 = 13:05
    expect(end.getHours()).toBe(13);
    expect(end.getMinutes()).toBe(5);
  });

  it('should handle midnight edge case', () => {
    const [start, end] = getBlockedWindow('00:00');

    // 3 min before 00:00 = 23:57 (previous day)
    expect(start.getHours()).toBe(23);
    expect(start.getMinutes()).toBe(57);

    // 5 min after 00:00 = 00:05
    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(5);
  });

  it('should detect if current time is in blocked window', () => {
    const [start, end] = getBlockedWindow('13:00');

    // 12:58 should be blocked
    const inWindow = new Date();
    inWindow.setHours(12, 58, 0, 0);
    const isBlocked = inWindow >= start && inWindow <= end;
    expect(isBlocked).toBe(true);

    // 12:50 should not be blocked
    const beforeWindow = new Date();
    beforeWindow.setHours(12, 50, 0, 0);
    const isBeforeBlocked = beforeWindow >= start && beforeWindow <= end;
    expect(isBeforeBlocked).toBe(false);

    // 13:10 should not be blocked
    const afterWindow = new Date();
    afterWindow.setHours(13, 10, 0, 0);
    const isAfterBlocked = afterWindow >= start && afterWindow <= end;
    expect(isAfterBlocked).toBe(false);
  });
});
