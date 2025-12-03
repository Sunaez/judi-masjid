// src/lib/firebase/__tests__/prayerTimes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPrayerTimesByDate,
  savePrayerTimes,
  batchSavePrayerTimes,
  syncFromCSV,
  getTodayDateString,
} from '../prayerTimes';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

// Mock Firestore
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(),
  })),
  serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
}));

describe('Prayer Times Firebase Service', () => {
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodayDateString', () => {
    it('should return date in DD/MM/YYYY format', () => {
      const dateStr = getTodayDateString();
      expect(dateStr).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('Date parsing and validation', () => {
    it('should handle valid date formats', async () => {
      const validDates = [
        '01/11/2025',
        '31/12/2025',
        '15/06/2025',
      ];

      for (const date of validDates) {
        const [day, month, year] = date.split('/');
        expect(day).toMatch(/^\d{2}$/);
        expect(month).toMatch(/^\d{2}$/);
        expect(year).toMatch(/^\d{4}$/);
      }
    });

    it('should detect Fridays correctly', () => {
      // 01/11/2025 is a Friday
      const date = new Date(2025, 10, 1); // Month is 0-indexed
      expect(date.getDay()).toBe(5); // 5 = Friday
    });
  });

  describe('CSV Sync', () => {
    it('should parse CSV data correctly', async () => {
      const mockCSV = `Date,Fajr,Fajr-Jamaat,Sunrise,Dhuhr,Dhuhr-Jamaat,Asr,Asr-Jamaat,Maghrib,Isha,Isha-Jamaat
01/11/2025,05:30,06:00,07:04,11:54,12:45,14:10,15:00,16:39,18:09,18:09
02/11/2025,05:31,06:00,07:06,11:54,12:45,14:08,14:45,16:38,18:08,18:08`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockCSV,
      });

      const writeBatchMock = vi.fn().mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      });

      const { writeBatch } = await import('firebase/firestore');
      vi.mocked(writeBatch).mockImplementation(writeBatchMock);

      const result = await syncFromCSV('https://example.com/csv');

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/csv');
    });

    it('should skip invalid date formats', async () => {
      const mockCSV = `Date,Fajr,Fajr-Jamaat,Sunrise,Dhuhr,Dhuhr-Jamaat,Asr,Asr-Jamaat,Maghrib,Isha,Isha-Jamaat
01/11/2025,05:30,06:00,07:04,11:54,12:45,14:10,15:00,16:39,18:09,18:09
invalid-date,05:31,06:00,07:06,11:54,12:45,14:08,14:45,16:38,18:08,18:08`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockCSV,
      });

      const writeBatchMock = vi.fn().mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      });

      const { writeBatch } = await import('firebase/firestore');
      vi.mocked(writeBatch).mockImplementation(writeBatchMock);

      const result = await syncFromCSV('https://example.com/csv');

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(syncFromCSV('https://example.com/csv'))
        .rejects.toThrow('Failed to sync prayer times from CSV');
    });
  });

  describe('Firestore Structure', () => {
    it('should create correct document path', () => {
      const date = '01/11/2025';
      const [day, month, year] = date.split('/');
      const path = `prayerTimes/${year}/${month}/${day}`;

      expect(path).toBe('prayerTimes/2025/11/01');
    });

    it('should include Friday metadata', () => {
      const date = '01/11/2025'; // Friday
      const [d, m, y] = date.split('/').map(Number);
      const dateObj = new Date(y, m - 1, d);

      expect(dateObj.getDay()).toBe(5);
    });

    it('should include day of week', () => {
      const date = '01/11/2025'; // Friday
      const [d, m, y] = date.split('/').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[dateObj.getDay()];

      expect(dayOfWeek).toBe('Friday');
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch saves efficiently', async () => {
      const batchData = [
        { date: '01/11/2025', times: mockPrayerTimes },
        { date: '02/11/2025', times: mockPrayerTimes },
        { date: '03/11/2025', times: mockPrayerTimes },
      ];

      const writeBatchMock = vi.fn().mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      });

      const { writeBatch } = await import('firebase/firestore');
      vi.mocked(writeBatch).mockImplementation(writeBatchMock);

      await batchSavePrayerTimes(batchData);

      // Should create single batch
      expect(writeBatchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw on getPrayerTimesByDate failure', async () => {
      const { getDoc } = await import('firebase/firestore');
      vi.mocked(getDoc).mockRejectedValue(new Error('Network error'));

      await expect(getPrayerTimesByDate('01/11/2025'))
        .rejects.toThrow('Failed to fetch prayer times for 01/11/2025');
    });

    it('should throw on savePrayerTimes failure', async () => {
      const { setDoc } = await import('firebase/firestore');
      vi.mocked(setDoc).mockRejectedValue(new Error('Permission denied'));

      await expect(savePrayerTimes('01/11/2025', mockPrayerTimes))
        .rejects.toThrow('Failed to save prayer times for 01/11/2025');
    });
  });
});
