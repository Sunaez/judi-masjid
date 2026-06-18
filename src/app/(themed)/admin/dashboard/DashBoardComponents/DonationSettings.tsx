'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CirclePoundSterling, Save, Target } from 'lucide-react';
import {
  DEFAULT_DONATION_SETTINGS,
  saveDonationSettings,
  subscribeDonationSettings,
  validateDonationSettings,
} from '@/lib/firebase/donationSettings';

interface DonationSettingsProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function parseAmount(value: string): number {
  if (value.trim() === '') return Number.NaN;
  return Number(value);
}

const formatPounds = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export default function DonationSettings({
  onSuccess,
  onError,
}: DonationSettingsProps) {
  const [currentAmount, setCurrentAmount] = useState(
    String(DEFAULT_DONATION_SETTINGS.currentAmount)
  );
  const [totalAmount, setTotalAmount] = useState(
    String(DEFAULT_DONATION_SETTINGS.totalAmount)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeDonationSettings(
      (settings) => {
        setCurrentAmount(String(settings.currentAmount));
        setTotalAmount(String(settings.totalAmount));
        setLoading(false);
      },
      (error) => {
        console.error('[DonationSettings] Failed to load settings:', error);
        onError('Failed to load donation settings');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onError]);

  const parsedCurrentAmount = parseAmount(currentAmount);
  const parsedTotalAmount = parseAmount(totalAmount);
  const validationError = useMemo(
    () =>
      validateDonationSettings(parsedCurrentAmount, parsedTotalAmount),
    [parsedCurrentAmount, parsedTotalAmount]
  );

  const progressPercent = validationError
    ? 0
    : (parsedCurrentAmount / parsedTotalAmount) * 100;

  const handleSave = async () => {
    const error = validateDonationSettings(
      parsedCurrentAmount,
      parsedTotalAmount
    );

    if (error) {
      onError(error);
      return;
    }

    setSaving(true);
    try {
      await saveDonationSettings({
        currentAmount: parsedCurrentAmount,
        totalAmount: parsedTotalAmount,
      });
      onSuccess('Donation settings saved');
    } catch (error) {
      console.error('[DonationSettings] Failed to save settings:', error);
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to save donation settings'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--secondary-color)] bg-[var(--background-start)] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-[var(--accent-color)] p-3 text-[var(--background-end)]">
            <CirclePoundSterling size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-2xl font-semibold text-[var(--accent-color)]">
              Donation Settings
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Update the live fundraising total and target shown on the display.
            </p>
          </div>
        </div>

        {!loading && !validationError && (
          <div className="text-right text-sm text-[var(--text-muted)]">
            <p>
              {formatPounds(parsedCurrentAmount)} of{' '}
              {formatPounds(parsedTotalAmount)}
            </p>
            <p className="font-semibold text-[var(--accent-color)]">
              {progressPercent.toFixed(1).replace(/\.0$/, '')}% complete
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-[var(--secondary-color)] border-t-[var(--accent-color)]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-color)]">
                <CirclePoundSterling size={16} aria-hidden="true" />
                Current donation amount
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={(event) => setCurrentAmount(event.target.value)}
                disabled={saving}
                className="w-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-4 py-2.5 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-2 text-sm font-medium text-[var(--text-color)]">
                <Target size={16} aria-hidden="true" />
                Total fundraising target
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                disabled={saving}
                className="w-full rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-4 py-2.5 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50"
              />
            </label>
          </div>

          <div className="mt-5">
            <div
              className="h-3 overflow-hidden rounded-full bg-[var(--secondary-color)]"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-[var(--accent-color)] transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {validationError && (
              <p
                className="mt-3 text-sm font-medium text-[var(--status-error)]"
                role="alert"
              >
                {validationError}
              </p>
            )}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || saving || Boolean(validationError)}
        className="mt-5 flex items-center gap-2 rounded-md bg-[var(--accent-color)] px-5 py-2.5 font-semibold text-[var(--background-end)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[var(--button-disabled)]"
      >
        <Save size={18} aria-hidden="true" />
        {saving ? 'Saving...' : 'Save Donation Settings'}
      </button>
    </section>
  );
}
