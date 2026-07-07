export const MIN_DONATION_AMOUNT = 1
export const MAX_DONATION_AMOUNT = 100_000

export const presetDonationAmounts = [10, 25, 50, 100] as const

export const donationFrequencyOptions = [
  { id: 'once', label: 'One-off' },
  { id: 'monthly', label: 'Monthly' },
] as const

export const donationFunds = [
  {
    id: 'general',
    label: 'General donation',
    description: 'Support the daily running costs of the masjid.',
  },
  {
    id: 'maintenance',
    label: 'Masjid upkeep',
    description: 'Help maintain prayer spaces and facilities.',
  },
  {
    id: 'community',
    label: 'Community work',
    description: 'Contribute towards classes, events, and local support.',
  },
] as const

export const bankDetails = [
  { label: 'Account name', value: 'Al-Judi Masjid' },
  { label: 'Account number', value: '89886445' },
  { label: 'Sort code', value: '51-70-32' },
] as const

export type DonationFrequency = (typeof donationFrequencyOptions)[number]['id']
export type DonationFund = (typeof donationFunds)[number]['id']

export function getDonationFund(fundId: unknown) {
  return donationFunds.find(fund => fund.id === fundId) ?? null
}

export function isDonationFrequency(value: unknown): value is DonationFrequency {
  return donationFrequencyOptions.some(option => option.id === value)
}

export function sanitizeDonationAmountInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '')
  const [wholeAmount, ...decimalParts] = cleaned.split('.')
  const decimals = decimalParts.join('').slice(0, 2)

  return decimalParts.length > 0 ? `${wholeAmount}.${decimals}` : wholeAmount
}

export function toDonationAmountInPence(amount: unknown) {
  const numericAmount =
    typeof amount === 'number' || typeof amount === 'string'
      ? Number(amount)
      : Number.NaN

  if (!Number.isFinite(numericAmount)) {
    return null
  }

  const roundedAmount = Math.round(numericAmount * 100) / 100

  if (
    roundedAmount < MIN_DONATION_AMOUNT ||
    roundedAmount > MAX_DONATION_AMOUNT
  ) {
    return null
  }

  return Math.round(roundedAmount * 100)
}
