'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronRight,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { FaStripe } from 'react-icons/fa'

import {
  MIN_DONATION_AMOUNT,
  donationFrequencyOptions,
  sanitizeDonationAmountInput,
  type DonationFrequency,
} from '@/lib/donations'

interface CheckoutSessionResponse {
  sessionId?: string
  url?: string
  error?: string
}

export default function DonationOptions({
  variant = 'compact',
}: {
  variant?: 'compact' | 'full'
}) {
  const [customAmount, setCustomAmount] = useState('')
  const [frequency, setFrequency] = useState<DonationFrequency>('once')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const donationAmount = useMemo(() => {
    const customValue = Number(customAmount)

    return Number.isFinite(customValue) && customValue > 0 ? customValue : 0
  }, [customAmount])

  const canStartCheckout = donationAmount >= MIN_DONATION_AMOUNT && !redirecting

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('donation') === 'cancelled') {
      setCheckoutStatus('Your Stripe checkout was cancelled. No payment was taken.')
    }
  }, [])

  const resetCheckoutMessages = () => {
    setCheckoutError(null)
    setCheckoutStatus(null)
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(sanitizeDonationAmountInput(value))
    resetCheckoutMessages()
  }

  const handleStripeCheckout = async () => {
    resetCheckoutMessages()
    setRedirecting(true)

    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: donationAmount,
          frequency,
        }),
      })
      const data = (await response
        .json()
        .catch(() => ({}))) as CheckoutSessionResponse

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Unable to start Stripe Checkout.')
      }

      window.location.assign(data.url)
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Unable to start Stripe Checkout. Please try again.'
      )
      setRedirecting(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] shadow-xl">
      <div className={variant === 'full' ? 'p-5 md:p-7 xl:p-8' : 'p-5 md:p-6'}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Secure giving
            </p>
            <h2
              className={`mt-2 font-bold leading-tight text-[var(--text-color)] ${
                variant === 'full'
                  ? 'text-3xl md:text-4xl'
                  : 'text-2xl md:text-3xl'
              }`}
            >
              Support Al Judi Masjid
            </h2>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[var(--accent-color)] text-[var(--background-end)]">
            <HeartHandshake className="h-6 w-6" />
          </span>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)] md:text-base">
          Enter any amount, choose whether it is one-off or monthly, then
          continue to Stripe for secure payment.
        </p>

        <div className="mt-7 grid gap-5">
          <div>
            <label
              htmlFor={`donation-amount-${variant}`}
              className="text-sm font-semibold text-[var(--text-color)]"
            >
              Donation amount
            </label>
            <span className="mt-3 flex h-12 items-center overflow-hidden rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] focus-within:border-[var(--accent-color)] focus-within:ring-2 focus-within:ring-[var(--accent-color)]/20">
              <span className="flex h-full items-center border-r border-[var(--secondary-color)] px-4 text-sm font-bold text-[var(--text-muted)]">
                GBP
              </span>
              <input
                id={`donation-amount-${variant}`}
                inputMode="decimal"
                value={customAmount}
                onChange={event => handleCustomAmount(event.target.value)}
                placeholder="Enter any amount"
                className="min-w-0 flex-1 bg-transparent px-4 text-base font-semibold text-[var(--text-color)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </span>
            <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
              Minimum donation: GBP {MIN_DONATION_AMOUNT}.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-color)]">
              Frequency
            </p>
            <div className="mt-3 grid grid-cols-2 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-1">
              {donationFrequencyOptions.map(option => {
                const isActive = frequency === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setFrequency(option.id)
                      resetCheckoutMessages()
                    }}
                    className={`h-11 rounded-md text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[var(--accent-color)] text-[var(--background-end)] shadow-sm'
                        : 'text-[var(--text-color)] hover:bg-[var(--background-start)]'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-color)]">
              Payment link
            </p>

            <div className="mt-3 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-4">
              <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <LockKeyhole className="h-4 w-4 text-[var(--accent-color)]" />
                <span>Stripe will handle the secure payment page.</span>
              </div>

              <button
                type="button"
                disabled={!canStartCheckout}
                onClick={handleStripeCheckout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-color)] px-5 py-3 font-semibold text-[var(--background-end)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {redirecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Opening Stripe Checkout...
                  </>
                ) : (
                  <>
                    <FaStripe className="h-6 w-6" aria-hidden="true" />
                    Donate securely with Stripe
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--secondary-color)] px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-color)]" />
                  Hosted by Stripe
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--secondary-color)] px-3 py-1">
                  <LockKeyhole className="h-3.5 w-3.5 text-[var(--accent-color)]" />
                  Card details stay with Stripe
                </span>
              </div>
            </div>
          </div>
        </div>

        {checkoutError && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-[var(--secondary-color)] bg-[var(--background-end)] px-3 py-2 text-sm text-[var(--text-color)]"
          >
            {checkoutError}
          </p>
        )}

        {checkoutStatus && (
          <p
            role="status"
            className="mt-4 rounded-md border border-[var(--secondary-color)] bg-[var(--background-end)] px-3 py-2 text-sm text-[var(--text-color)]"
          >
            {checkoutStatus}
          </p>
        )}
      </div>
    </article>
  )
}
