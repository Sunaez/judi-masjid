import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreError,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface DonationSettings {
  currentAmount: number;
  totalAmount: number;
  updatedAt?: Timestamp;
}

export type EditableDonationSettings = Pick<
  DonationSettings,
  'currentAmount' | 'totalAmount'
>;

export const DEFAULT_DONATION_SETTINGS: DonationSettings = {
  currentAmount: 200_000,
  totalAmount: 500_000,
};

const DONATION_SETTINGS_REF = doc(db, 'settings', 'donation');

export function validateDonationSettings(
  currentAmount: number,
  totalAmount: number
): string | null {
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
}

export function normalizeDonationSettings(data: unknown): DonationSettings {
  if (!data || typeof data !== 'object') {
    return DEFAULT_DONATION_SETTINGS;
  }

  const value = data as Record<string, unknown>;
  const currentAmount = value.currentAmount;
  const totalAmount = value.totalAmount;

  if (
    typeof currentAmount !== 'number' ||
    typeof totalAmount !== 'number' ||
    validateDonationSettings(currentAmount, totalAmount)
  ) {
    return DEFAULT_DONATION_SETTINGS;
  }

  return {
    currentAmount,
    totalAmount,
    updatedAt: value.updatedAt as Timestamp | undefined,
  };
}

export function subscribeDonationSettings(
  onChange: (settings: DonationSettings) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(
    DONATION_SETTINGS_REF,
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? normalizeDonationSettings(snapshot.data())
          : DEFAULT_DONATION_SETTINGS
      );
    },
    onError
  );
}

export async function saveDonationSettings(
  settings: EditableDonationSettings
): Promise<void> {
  const validationError = validateDonationSettings(
    settings.currentAmount,
    settings.totalAmount
  );

  if (validationError) {
    throw new Error(validationError);
  }

  await setDoc(
    DONATION_SETTINGS_REF,
    {
      currentAmount: settings.currentAmount,
      totalAmount: settings.totalAmount,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
