jest.mock('../../firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ path: 'settings/donation' })),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-timestamp'),
  setDoc: jest.fn(),
}));

import { onSnapshot, setDoc } from 'firebase/firestore';
import {
  DEFAULT_DONATION_SETTINGS,
  normalizeDonationSettings,
  saveDonationSettings,
  subscribeDonationSettings,
  validateDonationSettings,
} from '../donationSettings';

const mockedSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockedOnSnapshot = onSnapshot as unknown as jest.Mock;

describe('donationSettings', () => {
  beforeEach(() => {
    mockedSetDoc.mockReset();
    mockedOnSnapshot.mockReset();
  });

  it('accepts zero or a positive current amount below the target', () => {
    expect(validateDonationSettings(0, 500_000)).toBeNull();
    expect(validateDonationSettings(200_000, 500_000)).toBeNull();
    expect(validateDonationSettings(499_999.99, 500_000)).toBeNull();
  });

  it.each([
    [0, 0],
    [-1, 500_000],
    [500_000, 500_000],
    [600_000, 500_000],
    [Number.NaN, 500_000],
    [200_000, Number.POSITIVE_INFINITY],
  ])('rejects invalid values: current=%s total=%s', (current, total) => {
    expect(validateDonationSettings(current, total)).not.toBeNull();
  });

  it('falls back to defaults for malformed Firestore data', () => {
    expect(
      normalizeDonationSettings({
        currentAmount: 600_000,
        totalAmount: 500_000,
      })
    ).toEqual(DEFAULT_DONATION_SETTINGS);
  });

  it('does not write invalid values to Firestore', async () => {
    await expect(
      saveDonationSettings({
        currentAmount: 500_000,
        totalAmount: 500_000,
      })
    ).rejects.toThrow('greater than the current amount');

    expect(mockedSetDoc).not.toHaveBeenCalled();
  });

  it('writes valid values to Firestore', async () => {
    mockedSetDoc.mockResolvedValue();

    await saveDonationSettings({
      currentAmount: 250_000,
      totalAmount: 600_000,
    });

    expect(mockedSetDoc).toHaveBeenCalledWith(
      { path: 'settings/donation' },
      {
        currentAmount: 250_000,
        totalAmount: 600_000,
        updatedAt: 'server-timestamp',
      },
      { merge: true }
    );
  });

  it('streams valid Firestore changes to subscribers', () => {
    const onChange = jest.fn();
    const unsubscribe = jest.fn();

    mockedOnSnapshot.mockImplementation(
      (_reference, handleSnapshot: (snapshot: unknown) => void) => {
        handleSnapshot({
          exists: () => true,
          data: () => ({
            currentAmount: 300_000,
            totalAmount: 750_000,
          }),
        });
        return unsubscribe;
      }
    );

    const returnedUnsubscribe = subscribeDonationSettings(onChange);

    expect(onChange).toHaveBeenCalledWith({
      currentAmount: 300_000,
      totalAmount: 750_000,
      updatedAt: undefined,
    });
    expect(returnedUnsubscribe).toBe(unsubscribe);
  });
});
