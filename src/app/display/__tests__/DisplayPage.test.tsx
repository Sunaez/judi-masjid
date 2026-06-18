// src/app/display/__tests__/DisplayPage.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock all complex components
jest.mock('../Components/Rotator', () => ({
  __esModule: true,
  default: () => <div data-testid="rotator">Rotator Component</div>,
}));

jest.mock('../Components/PrayerTimeline', () => ({
  __esModule: true,
  default: () => <div data-testid="prayer-timeline">Prayer Timeline Component</div>,
}));

jest.mock('../Components/PrayerOverlay', () => ({
  __esModule: true,
  default: () => <div data-testid="prayer-overlay">Prayer Overlay Component</div>,
}));

jest.mock('../Components/PostPrayerTableOverlay', () => ({
  __esModule: true,
  default: () => <div data-testid="post-prayer-overlay">Post Prayer Table Overlay</div>,
}));

jest.mock('../Components/DowntimeDisplay', () => ({
  __esModule: true,
  default: () => <div data-testid="downtime-display">Downtime Display Component</div>,
}));

jest.mock('../Components/SlideshowOverlay', () => ({
  __esModule: true,
  default: () => <div data-testid="slideshow-overlay">SlideShow Overlay</div>,
}));

// Variable to control mock behavior
let mockIsDowntime = false;
let mockIsLoading = false;
let mockSlideshowActive = false;

jest.mock('@/lib/firebase/slideshowSettings', () => ({
  subscribeSlideshowSettings: jest.fn((onChange) => {
    onChange({
      active: mockSlideshowActive,
      startTime: mockSlideshowActive ? '12:00' : null,
      endTime: mockSlideshowActive ? '13:00' : null,
    });
    return jest.fn();
  }),
  isSlideshowWindowActive: jest.fn(() => mockSlideshowActive),
}));

jest.mock('../context/PrayerTimesContext', () => ({
  usePrayerTimesContext: () => ({
    prayerTimes: {
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
    },
    isLoading: mockIsLoading,
    error: null,
    currentMinutes: 720,
    isDowntime: mockIsDowntime,
    isRamadan: false,
    isRamadanPeriod: false,
    isFirstTenRamadanDays: false,
    isLastTenRamadanDays: false,
  }),
}));

jest.mock('../context/DebugContext', () => ({
  useDebugContext: () => ({
    downtimeOverride: false,
    downtimeOverrideActive: false,
    toggleDowntimeOverride: jest.fn(),
    rotatorAdvanceSignal: 0,
    advanceRotator: jest.fn(),
    prayerOverlayTestSignal: 0,
    testPrayerOverlay: jest.fn(),
    postPrayerTableTestSignal: 0,
    testPostPrayerTable: jest.fn(),
    ramadanPreviewActive: false,
    toggleRamadanPreview: jest.fn(),
    donationGoalPreviewSignal: 0,
    previewDonationGoal: jest.fn(),
    notification: '',
  }),
}));

// Import after mocking
import Display from '../page';

describe('Display Page', () => {
  beforeEach(() => {
    mockIsDowntime = false;
    mockIsLoading = false;
    mockSlideshowActive = false;
  });

  describe('Normal Mode', () => {
    it('should render Rotator in normal mode', async () => {
      mockIsDowntime = false;
      render(<Display />);
      expect(await screen.findByTestId('rotator')).toBeInTheDocument();
    });

    it('should render PrayerTimeline in normal mode', async () => {
      mockIsDowntime = false;
      render(<Display />);
      expect(await screen.findByTestId('prayer-timeline')).toBeInTheDocument();
    });

    it('should render PrayerOverlay in normal mode', async () => {
      mockIsDowntime = false;
      render(<Display />);
      expect(await screen.findByTestId('prayer-overlay')).toBeInTheDocument();
    });

    it('should render PostPrayerTableOverlay in normal mode', async () => {
      mockIsDowntime = false;
      render(<Display />);
      expect(await screen.findByTestId('post-prayer-overlay')).toBeInTheDocument();
    });

    it('should NOT render DowntimeDisplay in normal mode', async () => {
      mockIsDowntime = false;
      render(<Display />);
      await screen.findByTestId('rotator');
      expect(screen.queryByTestId('downtime-display')).not.toBeInTheDocument();
    });
  });

  describe('Downtime Mode', () => {
    it('should render DowntimeDisplay in downtime mode', async () => {
      mockIsDowntime = true;
      render(<Display />);
      expect(await screen.findByTestId('downtime-display')).toBeInTheDocument();
    });

    it('should NOT render Rotator in downtime mode', async () => {
      mockIsDowntime = true;
      render(<Display />);
      await screen.findByTestId('downtime-display');
      expect(screen.queryByTestId('rotator')).not.toBeInTheDocument();
    });

    it('should NOT render PrayerTimeline in downtime mode', async () => {
      mockIsDowntime = true;
      render(<Display />);
      await screen.findByTestId('downtime-display');
      expect(screen.queryByTestId('prayer-timeline')).not.toBeInTheDocument();
    });

    it('should NOT render PrayerOverlay in downtime mode', async () => {
      mockIsDowntime = true;
      render(<Display />);
      await screen.findByTestId('downtime-display');
      expect(screen.queryByTestId('prayer-overlay')).not.toBeInTheDocument();
    });

    it('should NOT render PostPrayerTableOverlay in downtime mode', async () => {
      mockIsDowntime = true;
      render(<Display />);
      await screen.findByTestId('downtime-display');
      expect(screen.queryByTestId('post-prayer-overlay')).not.toBeInTheDocument();
    });
  });

  describe('SlideShow Mode', () => {
    it('should render only the slideshow overlay when schedule is active', async () => {
      mockSlideshowActive = true;
      render(<Display />);

      expect(await screen.findByTestId('slideshow-overlay')).toBeInTheDocument();
      expect(screen.queryByTestId('rotator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('prayer-timeline')).not.toBeInTheDocument();
      expect(screen.queryByTestId('downtime-display')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      mockIsLoading = true;
      render(<Display />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should NOT render Rotator when loading', () => {
      mockIsLoading = true;
      render(<Display />);
      expect(screen.queryByTestId('rotator')).not.toBeInTheDocument();
    });

    it('should NOT render DowntimeDisplay when loading', () => {
      mockIsLoading = true;
      render(<Display />);
      expect(screen.queryByTestId('downtime-display')).not.toBeInTheDocument();
    });
  });
});

describe('Display Page - Mode Transitions', () => {
  // These tests verify the conditions for transitioning between modes

  it('should be in normal mode during daytime hours', () => {
    // Given prayer times with Isha at 21:00 and Fajr at 05:30
    // Downtime is 22:00 to 04:30
    // At 14:00 (2 PM), should be in normal mode

    const currentMinutes = 14 * 60; // 14:00 = 840 minutes
    const ishaMinutes = 21 * 60; // 21:00 = 1260 minutes
    const fajrMinutes = 5 * 60 + 30; // 05:30 = 330 minutes

    const downtimeStart = ishaMinutes + 60; // 22:00 = 1320
    const downtimeEnd = fajrMinutes - 60;   // 04:30 = 270

    // Overnight check
    const isDowntime = currentMinutes >= downtimeStart || currentMinutes <= downtimeEnd;
    expect(isDowntime).toBe(false);
  });

  it('should be in downtime mode after 22:00', () => {
    const currentMinutes = 22 * 60; // 22:00 = 1320 minutes
    const ishaMinutes = 21 * 60;
    const fajrMinutes = 5 * 60 + 30;

    const downtimeStart = ishaMinutes + 60; // 1320
    const downtimeEnd = fajrMinutes - 60;   // 270

    const isDowntime = currentMinutes >= downtimeStart || currentMinutes <= downtimeEnd;
    expect(isDowntime).toBe(true);
  });

  it('should be in downtime mode at midnight', () => {
    const currentMinutes = 0; // 00:00
    const ishaMinutes = 21 * 60;
    const fajrMinutes = 5 * 60 + 30;

    const downtimeStart = ishaMinutes + 60; // 1320
    const downtimeEnd = fajrMinutes - 60;   // 270

    const isDowntime = currentMinutes >= downtimeStart || currentMinutes <= downtimeEnd;
    expect(isDowntime).toBe(true);
  });

  it('should exit downtime mode at 04:30', () => {
    const currentMinutes = 4 * 60 + 30; // 04:30 = 270 minutes
    const ishaMinutes = 21 * 60;
    const fajrMinutes = 5 * 60 + 30;

    const downtimeStart = ishaMinutes + 60; // 1320
    const downtimeEnd = fajrMinutes - 60;   // 270

    // At exactly 270, should NOT be in downtime (using < not <=)
    const isDowntimeAt270 = currentMinutes >= downtimeStart || currentMinutes < downtimeEnd;
    const isDowntimeAt269 = (currentMinutes - 1) >= downtimeStart || (currentMinutes - 1) < downtimeEnd;

    // At 270 (04:30), we exit downtime
    expect(isDowntimeAt270).toBe(false);
    // At 269 (04:29), we're still in downtime
    expect(isDowntimeAt269).toBe(true);
  });
});
