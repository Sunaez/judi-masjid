'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react'

import {
  MIN_DONATION_AMOUNT,
  bankDetails,
  donationFrequencyOptions,
  donationFunds,
  presetDonationAmounts,
  sanitizeDonationAmountInput,
  type DonationFrequency,
  type DonationFund,
} from '@/lib/donations'

const DONATION_URL =
  'https://pay.sumup.com/b2c/Q7IJZ8CO?utm_campaign=pdf&utm_medium=print&utm_source=qr'

const amountFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

interface CheckoutSessionResponse {
  sessionId?: string
  url?: string
  error?: string
}

function CopyBankDetailButton({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] px-3 text-sm font-semibold text-[var(--accent-color)] transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function AmountLabel({ amount }: { amount: number }) {
  return (
    <>
      <span aria-hidden="true">&pound;</span>
      {amountFormatter.format(amount)}
    </>
  )
}

export default function DonationOptions({
  variant = 'compact',
}: {
  variant?: 'compact' | 'full'
}) {
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [customAmount, setCustomAmount] = useState('')
  const [frequency, setFrequency] = useState<DonationFrequency>('once')
  const [selectedFund, setSelectedFund] = useState<DonationFund>('general')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const donationAmount = useMemo(() => {
    if (!customAmount.trim()) {
      return selectedAmount
    }

    const customValue = Number(customAmount)
    return Number.isFinite(customValue) && customValue > 0
      ? customValue
      : 0
  }, [customAmount, selectedAmount])

  const fund = donationFunds.find(item => item.id === selectedFund) ?? donationFunds[0]
  const canStartCheckout = donationAmount >= MIN_DONATION_AMOUNT && !redirecting

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const donationStatus = params.get('donation')

    if (donationStatus === 'success') {
      setCheckoutStatus('Thank you. Stripe has confirmed your donation flow.')
    }

    if (donationStatus === 'cancelled') {
      setCheckoutStatus('Your Stripe checkout was cancelled. No payment was taken.')
    }
  }, [])

  const resetCheckoutMessages = () => {
    setCheckoutError(null)
    setCheckoutStatus(null)
  }

  const handlePresetAmount = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
    resetCheckoutMessages()
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
          fund: selectedFund,
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
      <div
        className={`grid gap-0 ${
          variant === 'full'
            ? 'xl:grid-cols-[minmax(0,1fr)_420px]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]'
        }`}
      >
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
            Choose an amount and purpose, then continue to Stripe&apos;s hosted
            checkout page for the secure payment step.
          </p>

          <div className="mt-7">
            <p className="text-sm font-semibold text-[var(--text-color)]">
              Donation amount
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {presetDonationAmounts.map(amount => {
                const isActive = customAmount === '' && selectedAmount === amount

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handlePresetAmount(amount)}
                    className={`h-12 rounded-lg border px-3 text-base font-bold transition ${
                      isActive
                        ? 'border-[var(--accent-color)] bg-[var(--accent-color)] text-[var(--background-end)] shadow-md'
                        : 'border-[var(--secondary-color)] bg-[var(--background-start)] text-[var(--text-color)] hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    <AmountLabel amount={amount} />
                  </button>
                )
              })}
            </div>

            <label className="mt-3 block">
              <span className="sr-only">Custom donation amount</span>
              <span className="flex h-12 items-center overflow-hidden rounded-lg border border-[var(--secondary-color)] bg-[var(--background-start)] focus-within:border-[var(--accent-color)]">
                <span className="flex h-full items-center border-r border-[var(--secondary-color)] px-4 text-sm font-bold text-[var(--text-muted)]">
                  GBP
                </span>
                <input
                  inputMode="decimal"
                  value={customAmount}
                  onChange={event => handleCustomAmount(event.target.value)}
                  placeholder="Other amount"
                  className="min-w-0 flex-1 bg-transparent px-4 text-base font-semibold text-[var(--text-color)] outline-none placeholder:text-[var(--text-muted)]"
                />
              </span>
            </label>
          </div>

          <div className="mt-7 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
            <div>
              <p className="text-sm font-semibold text-[var(--text-color)]">
                Frequency
              </p>
              <div className="mt-3 grid grid-cols-2 rounded-lg border border-[var(--secondary-color)] bg-[var(--background-start)] p-1">
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
                      className={`h-10 rounded-md text-sm font-semibold transition ${
                        isActive
                          ? 'bg-[var(--accent-color)] text-[var(--background-end)] shadow-sm'
                          : 'text-[var(--text-color)] hover:bg-[var(--background-end)]'
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
                Donation purpose
              </p>
              <div
                className={`mt-3 grid gap-3 ${
                  variant === 'full' ? 'lg:grid-cols-3 xl:grid-cols-3' : ''
                }`}
              >
                {donationFunds.map(option => {
                  const isActive = selectedFund === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedFund(option.id)
                        resetCheckoutMessages()
                      }}
                      className={`rounded-lg border p-3 text-left transition ${
                        isActive
                          ? 'border-[var(--accent-color)] bg-[var(--background-start)] shadow-sm'
                          : 'border-[var(--secondary-color)] bg-[var(--background-end)] hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-[var(--text-color)]">
                          {option.label}
                        </span>
                        {isActive && (
                          <Check className="h-4 w-4 text-[var(--accent-color)]" />
                        )}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-[var(--text-muted)]">
                        {option.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`border-t border-[var(--secondary-color)] bg-[var(--x-background-start)] p-5 text-[var(--x-text-color)] md:p-6 ${
            variant === 'full'
              ? 'xl:border-l xl:border-t-0 xl:p-8'
              : 'lg:border-l lg:border-t-0'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
                Stripe hosted checkout
              </p>
              <h3 className="mt-1 text-xl font-bold">Donation to Al Judi Masjid</h3>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[var(--x-background-end)]">
              <LockKeyhole className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--x-secondary-color)] bg-[var(--x-background-end)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm opacity-75">
                  {frequency === 'monthly' ? 'Monthly donation' : 'One-off donation'}
                </p>
                <p className="mt-1 text-3xl font-bold leading-none">
                  <AmountLabel amount={donationAmount} />
                </p>
              </div>
              <span className="rounded-full border border-[var(--x-secondary-color)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                GBP
              </span>
            </div>
            <div className="mt-4 rounded-md bg-[var(--x-background-start)] p-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 opacity-85" />
                <div>
                  <p className="text-sm font-semibold">Secure external payment page</p>
                  <p className="text-xs opacity-75">
                    Stripe will show the available payment methods for each donor.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--x-secondary-color)] pt-4 text-sm">
              <span className="opacity-75">Purpose</span>
              <span className="text-right font-semibold">{fund.label}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="flex items-center gap-2 rounded-md border border-[var(--x-secondary-color)] px-3 py-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Hosted by Stripe</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[var(--x-secondary-color)] px-3 py-2 text-sm">
              <ReceiptText className="h-4 w-4" />
              <span>Email receipts</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[var(--x-secondary-color)] px-3 py-2 text-sm">
              <LockKeyhole className="h-4 w-4" />
              <span>No card details stored here</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!canStartCheckout}
            onClick={handleStripeCheckout}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--x-accent-color)] px-5 py-3 font-semibold text-[var(--x-background-end)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {redirecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Opening Stripe Checkout...
              </>
            ) : (
              <>
                Continue to Stripe Checkout
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>

          {checkoutError && (
            <p
              role="alert"
              className="mt-3 rounded-md border border-[var(--x-secondary-color)] bg-[var(--x-background-end)] px-3 py-2 text-sm"
            >
              {checkoutError}
            </p>
          )}

          {checkoutStatus && (
            <p
              role="status"
              className="mt-3 rounded-md border border-[var(--x-secondary-color)] bg-[var(--x-background-end)] px-3 py-2 text-sm"
            >
              {checkoutStatus}
            </p>
          )}

          <a
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--x-secondary-color)] px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-[var(--x-background-end)]"
          >
            Backup donation link
            <HeartHandshake className="h-4 w-4" />
          </a>
        </div>
      </div>

      {variant === 'full' && (
        <div className="border-t border-[var(--secondary-color)] bg-[var(--background-start)] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Bank transfer
              </p>
              <h3 className="mt-1 text-xl font-bold text-[var(--text-color)]">
                Direct donation details
              </h3>
            </div>
            <ShieldCheck className="h-6 w-6 text-[var(--accent-color)]" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {bankDetails.map(detail => (
              <div
                key={detail.label}
                className="rounded-lg border border-[var(--secondary-color)] bg-[var(--background-end)] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {detail.label}
                </p>
                <p className="mt-2 text-lg font-bold text-[var(--accent-color)]">
                  {detail.value}
                </p>
                <div className="mt-4">
                  <CopyBankDetailButton label={detail.label} value={detail.value} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
