// src/app/display/Components/__tests__/DowntimeDisplay.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      temp: 15,
      condition: 'Clear',
      iconCode: '01d',
    }),
  })),
}));

// Mock prayer times context
const mockPrayerTimes = {
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

jest.mock('../../context/PrayerTimesContext', () => ({
  usePrayerTimesContext: () => ({
    prayerTimes: mockPrayerTimes,
    isLoading: false,
    error: null,
    currentMinutes: 1380, // 23:00
    isDowntime: true,
  }),
}));

// Import after mocking
import DowntimeDisplay from '../DowntimeDisplay';

describe('DowntimeDisplay', () => {
  const RealDate = global.Date;

  beforeEach(() => {
    jest.useFakeTimers();
    const mockDate = new Date(2024, 0, 15, 23, 30, 45);
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
    global.Date = RealDate;
  });

  it('should render without crashing', () => {
    render(<DowntimeDisplay />);
    expect(screen.getByText('Off-Peak Mode')).toBeInTheDocument();
  });

  it('should display the current time', () => {
    render(<DowntimeDisplay />);
    // The time should be displayed (23:30)
    expect(screen.getByText('23:30')).toBeInTheDocument();
  });

  it('should display the date', () => {
    render(<DowntimeDisplay />);
    // Should show the Gregorian date
    expect(screen.getByText(/Monday/i)).toBeInTheDocument();
    expect(screen.getByText(/January/i)).toBeInTheDocument();
    expect(screen.getByText(/2024/i)).toBeInTheDocument();
  });

  it('should display next Fajr time', () => {
    render(<DowntimeDisplay />);
    expect(screen.getByText('Next Fajr')).toBeInTheDocument();
    expect(screen.getByText('05:30')).toBeInTheDocument();
  });

  it('should have dark background styling', () => {
    const { container } = render(<DowntimeDisplay />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.style.background).toContain('linear-gradient');
    expect(mainDiv.style.background).toContain('#0a0a0f');
  });
});

describe('DowntimeDisplay - Time Updates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should update time every second', () => {
    const mockDate = new Date(2024, 0, 15, 23, 30, 0);
    jest.setSystemTime(mockDate);

    render(<DowntimeDisplay />);
    expect(screen.getByText('23:30')).toBeInTheDocument();

    // Advance time by 30 seconds
    jest.advanceTimersByTime(30000);
    const newDate = new Date(2024, 0, 15, 23, 30, 30);
    jest.setSystemTime(newDate);

    // Force a re-render by advancing timers
    jest.advanceTimersByTime(1000);
  });
});
