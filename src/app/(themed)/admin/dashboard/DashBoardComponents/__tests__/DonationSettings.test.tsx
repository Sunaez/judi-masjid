import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DonationSettings from '../DonationSettings';
import {
  saveDonationSettings,
  subscribeDonationSettings,
} from '@/lib/firebase/donationSettings';

jest.mock('@/lib/firebase/donationSettings', () => {
  return {
    DEFAULT_DONATION_SETTINGS: {
      currentAmount: 200_000,
      totalAmount: 500_000,
    },
    validateDonationSettings: (currentAmount: number, totalAmount: number) => {
      if (!Number.isFinite(currentAmount) || !Number.isFinite(totalAmount)) {
        return 'Both donation values must be valid numbers.';
      }
      if (currentAmount < 0) {
        return 'The current donation amount cannot be negative.';
      }
      if (currentAmount === 0 && totalAmount === 0) {
        return 'The current amount and target cannot both be zero.';
      }
      if (totalAmount <= 0) {
        return 'The donation target must be greater than zero.';
      }
      if (currentAmount >= totalAmount) {
        return 'The donation target must be greater than the current amount.';
      }
      return null;
    },
    subscribeDonationSettings: jest.fn(),
    saveDonationSettings: jest.fn(),
  };
});

const mockedSubscribe = subscribeDonationSettings as jest.MockedFunction<
  typeof subscribeDonationSettings
>;
const mockedSave = saveDonationSettings as jest.MockedFunction<
  typeof saveDonationSettings
>;

describe('DonationSettings admin panel', () => {
  beforeEach(() => {
    mockedSave.mockReset();
    mockedSubscribe.mockImplementation((onChange) => {
      onChange({ currentAmount: 200_000, totalAmount: 500_000 });
      return jest.fn();
    });
  });

  it('blocks saving when the current amount is not below the target', () => {
    render(
      <DonationSettings onSuccess={jest.fn()} onError={jest.fn()} />
    );

    fireEvent.change(screen.getByLabelText('Current donation amount'), {
      target: { value: '500000' },
    });

    expect(
      screen.getByText(
        'The donation target must be greater than the current amount.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save Donation Settings' })
    ).toBeDisabled();
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it('blocks saving when both values are zero', () => {
    render(
      <DonationSettings onSuccess={jest.fn()} onError={jest.fn()} />
    );

    fireEvent.change(screen.getByLabelText('Current donation amount'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('Total fundraising target'), {
      target: { value: '0' },
    });

    expect(
      screen.getByText('The current amount and target cannot both be zero.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save Donation Settings' })
    ).toBeDisabled();
  });

  it('saves valid values', async () => {
    const onSuccess = jest.fn();
    mockedSave.mockResolvedValue();

    render(
      <DonationSettings onSuccess={onSuccess} onError={jest.fn()} />
    );

    fireEvent.change(screen.getByLabelText('Current donation amount'), {
      target: { value: '250000' },
    });
    fireEvent.change(screen.getByLabelText('Total fundraising target'), {
      target: { value: '600000' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Save Donation Settings' })
    );

    await waitFor(() => {
      expect(mockedSave).toHaveBeenCalledWith({
        currentAmount: 250_000,
        totalAmount: 600_000,
      });
    });
    expect(onSuccess).toHaveBeenCalledWith('Donation settings saved');
  });
});
