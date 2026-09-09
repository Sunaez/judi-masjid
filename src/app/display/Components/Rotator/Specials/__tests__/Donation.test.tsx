import React from 'react';
import { act, render, screen } from '@testing-library/react';
import Donation from '../Donation';
import {
  subscribeDonationSettings,
  type DonationSettings,
} from '@/lib/firebase/donationSettings';

jest.mock('gsap', () => ({
  gsap: {
    context: (callback: () => void) => {
      callback();
      return { revert: jest.fn() };
    },
    timeline: () => ({
      from: jest.fn().mockReturnThis(),
      fromTo: jest.fn().mockReturnThis(),
      to: jest.fn().mockReturnThis(),
    }),
  },
}));

jest.mock('@/lib/firebase/donationSettings', () => ({
  DEFAULT_DONATION_SETTINGS: {
    currentAmount: 200_000,
    totalAmount: 500_000,
  },
  subscribeDonationSettings: jest.fn(),
}));

const mockedSubscribe = subscribeDonationSettings as jest.MockedFunction<
  typeof subscribeDonationSettings
>;

describe('Donation rotator slide', () => {
  it('does not present placeholder amounts before the first valid snapshot', () => {
    mockedSubscribe.mockImplementation(() => jest.fn());
    render(<Donation displayDuration={20_000} />);
    expect(screen.queryByText('£200,000')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Donation total temporarily unavailable');
  });

  it('updates the displayed amounts when Firestore settings change', () => {
    let emitSettings: ((settings: DonationSettings) => void) | undefined;

    mockedSubscribe.mockImplementation((onChange) => {
      emitSettings = onChange;
      onChange({ currentAmount: 200_000, totalAmount: 500_000 });
      return jest.fn();
    });

    render(<Donation displayDuration={20_000} />);

    expect(screen.getAllByText('£200,000').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('progressbar', {
        name: '£200,000 raised of £500,000',
      })
    ).toHaveAttribute('aria-valuenow', '200000');

    act(() => {
      emitSettings?.({ currentAmount: 300_000, totalAmount: 750_000 });
    });

    expect(screen.getAllByText('£300,000').length).toBeGreaterThan(0);
    expect(screen.getByText(/£750,000 goal/)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', {
        name: '£300,000 raised of £750,000',
      })
    ).toHaveAttribute('aria-valuemax', '750000');
  });

  it('keeps the last verified totals when the next rotation cannot load settings', () => {
    mockedSubscribe.mockImplementation(onChange => {
      onChange({ currentAmount: 321_000, totalAmount: 750_000 });
      return jest.fn();
    });
    const { unmount } = render(<Donation displayDuration={20_000} />);
    unmount();
    mockedSubscribe.mockImplementation(() => jest.fn());
    render(<Donation displayDuration={20_000} />);
    expect(screen.getAllByText('£321,000').length).toBeGreaterThan(0);
    expect(screen.queryByText('£200,000')).not.toBeInTheDocument();
  });
});
