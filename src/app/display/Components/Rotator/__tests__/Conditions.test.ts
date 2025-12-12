// src/app/display/Components/Rotator/__tests__/Conditions.test.ts
import { renderHook } from '@testing-library/react';
import useValidMessages, { useWeatherMessages } from '../Conditions';
import type { MessageWithConditions } from '../Messages';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

// Helper to create mock messages
function createMessage(
  id: string,
  conditions: MessageWithConditions['conditions']
): MessageWithConditions {
  return {
    id,
    sourceType: 'other',
    other: { arabicText: 'Test', englishText: 'Test' },
    conditions,
  };
}

// Mock prayer times
const mockPrayerTimes: RawPrayerTimes = {
  fajrStart: '05:00',
  fajrJamaat: '05:30',
  sunrise: '06:30',
  dhuhrStart: '12:00',
  dhuhrJamaat: '13:00',
  asrStart: '15:00',
  asrJamaat: '16:00',
  maghrib: '18:30',
  ishaStart: '20:00',
  ishaJamaat: '21:00',
};

describe('useValidMessages', () => {
  // Save original Date
  const RealDate = global.Date;

  afterEach(() => {
    global.Date = RealDate;
  });

  // Helper to mock current time
  function mockTime(hours: number, minutes: number, dayOfWeek: string = 'Monday') {
    const mockDate = new Date(2024, 0, 15, hours, minutes, 0); // Jan 15, 2024
    // Adjust to make it the right day of week
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };
    const targetDay = dayMap[dayOfWeek];
    const currentDay = mockDate.getDay();
    mockDate.setDate(mockDate.getDate() + (targetDay - currentDay));

    jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (args.length === 0) {
        return mockDate;
      }
      // @ts-ignore
      return new RealDate(...args);
    });
  }

  describe('normal condition', () => {
    it('should always include messages with normal condition', () => {
      mockTime(10, 0);
      const messages = [
        createMessage('1', [{ type: 'normal' }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('1');
    });
  });

  describe('time condition', () => {
    it('should include message when current time is within range', () => {
      mockTime(10, 30);
      const messages = [
        createMessage('1', [{ type: 'time', entries: [{ from: '09:00', to: '12:00' }] }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should exclude message when current time is outside range', () => {
      mockTime(14, 0);
      const messages = [
        createMessage('1', [{ type: 'time', entries: [{ from: '09:00', to: '12:00' }] }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(0);
    });

    it('should include message when time matches any of multiple ranges', () => {
      mockTime(15, 30);
      const messages = [
        createMessage('1', [{
          type: 'time',
          entries: [
            { from: '09:00', to: '12:00' },
            { from: '15:00', to: '17:00' },
          ],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should handle edge case at exact start time', () => {
      mockTime(9, 0);
      const messages = [
        createMessage('1', [{ type: 'time', entries: [{ from: '09:00', to: '12:00' }] }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should handle edge case at exact end time', () => {
      mockTime(12, 0);
      const messages = [
        createMessage('1', [{ type: 'time', entries: [{ from: '09:00', to: '12:00' }] }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });
  });

  describe('prayer condition', () => {
    it('should include message when within duration before prayer', () => {
      // 10 minutes before Dhuhr jamaat (13:00)
      mockTime(12, 50);
      const messages = [
        createMessage('1', [{
          type: 'prayer',
          entries: [{ when: 'before', name: 'Dhuhr', duration: 15 }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should include message when within duration after prayer', () => {
      // 10 minutes after Dhuhr jamaat (13:00)
      mockTime(13, 10);
      const messages = [
        createMessage('1', [{
          type: 'prayer',
          entries: [{ when: 'after', name: 'Dhuhr', duration: 15 }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should include message when within duration before or after (both)', () => {
      // 5 minutes after Asr jamaat (16:00)
      mockTime(16, 5);
      const messages = [
        createMessage('1', [{
          type: 'prayer',
          entries: [{ when: 'both', name: 'Asr', duration: 10 }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should exclude message when outside prayer duration', () => {
      // 30 minutes after Dhuhr jamaat (13:00)
      mockTime(13, 30);
      const messages = [
        createMessage('1', [{
          type: 'prayer',
          entries: [{ when: 'after', name: 'Dhuhr', duration: 15 }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(0);
    });

    it('should handle Maghrib correctly (no Jamaat suffix)', () => {
      // 10 minutes before Maghrib (18:30)
      mockTime(18, 20);
      const messages = [
        createMessage('1', [{
          type: 'prayer',
          entries: [{ when: 'before', name: 'Maghrib', duration: 15 }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should handle multiple prayer entries (OR logic)', () => {
      // 10 minutes before Fajr jamaat (05:30)
      mockTime(5, 20);
      const messages = [
        createMessage('1', [{
          type: 'prayer',
          entries: [
            { when: 'before', name: 'Dhuhr', duration: 15 },
            { when: 'before', name: 'Fajr', duration: 15 },
          ],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });
  });

  describe('weather condition', () => {
    it('should include message when weather matches', () => {
      mockTime(10, 0);
      const messages = [
        createMessage('1', [{
          type: 'weather',
          entries: [{ weather: 'Rain' }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, 'Rain')
      );

      expect(result.current).toHaveLength(1);
    });

    it('should exclude message when weather does not match', () => {
      mockTime(10, 0);
      const messages = [
        createMessage('1', [{
          type: 'weather',
          entries: [{ weather: 'Rain' }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, 'Clear')
      );

      expect(result.current).toHaveLength(0);
    });

    it('should include message when any weather entry matches', () => {
      mockTime(10, 0);
      const messages = [
        createMessage('1', [{
          type: 'weather',
          entries: [{ weather: 'Rain' }, { weather: 'Snow' }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, 'Snow')
      );

      expect(result.current).toHaveLength(1);
    });

    it('should include message when weather is null (fallback)', () => {
      mockTime(10, 0);
      const messages = [
        createMessage('1', [{
          type: 'weather',
          entries: [{ weather: 'Rain' }],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      // Weather condition passes when weather data is unavailable
      expect(result.current).toHaveLength(1);
    });
  });

  describe('day condition', () => {
    it('should include message when today matches', () => {
      mockTime(10, 0, 'Friday');
      const messages = [
        createMessage('1', [{
          type: 'day',
          entries: ['Friday', 'Saturday'],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should exclude message when today does not match', () => {
      mockTime(10, 0, 'Monday');
      const messages = [
        createMessage('1', [{
          type: 'day',
          entries: ['Friday', 'Saturday'],
        }]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(0);
    });
  });

  describe('multiple conditions (AND logic)', () => {
    it('should require all conditions to pass', () => {
      mockTime(10, 0, 'Friday');
      const messages = [
        createMessage('1', [
          { type: 'time', entries: [{ from: '09:00', to: '12:00' }] },
          { type: 'day', entries: ['Friday'] },
        ]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(1);
    });

    it('should exclude if any condition fails', () => {
      mockTime(10, 0, 'Monday'); // Time passes but day fails
      const messages = [
        createMessage('1', [
          { type: 'time', entries: [{ from: '09:00', to: '12:00' }] },
          { type: 'day', entries: ['Friday'] },
        ]),
      ];

      const { result } = renderHook(() =>
        useValidMessages(messages, mockPrayerTimes, null)
      );

      expect(result.current).toHaveLength(0);
    });
  });
});

describe('useWeatherMessages', () => {
  it('should only return messages with weather conditions matching current weather', () => {
    const messages = [
      createMessage('1', [{ type: 'weather', entries: [{ weather: 'Rain' }] }]),
      createMessage('2', [{ type: 'weather', entries: [{ weather: 'Clear' }] }]),
      createMessage('3', [{ type: 'normal' }]),
    ];

    const { result } = renderHook(() =>
      useWeatherMessages(messages, 'Rain')
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('1');
  });

  it('should return empty array when no weather data', () => {
    const messages = [
      createMessage('1', [{ type: 'weather', entries: [{ weather: 'Rain' }] }]),
    ];

    const { result } = renderHook(() =>
      useWeatherMessages(messages, null)
    );

    expect(result.current).toHaveLength(0);
  });

  it('should not include normal messages', () => {
    const messages = [
      createMessage('1', [{ type: 'normal' }]),
    ];

    const { result } = renderHook(() =>
      useWeatherMessages(messages, 'Clear')
    );

    expect(result.current).toHaveLength(0);
  });
});
