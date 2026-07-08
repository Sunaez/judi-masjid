export const MIN_DONATION_AMOUNT = 1
export const MAX_DONATION_AMOUNT = 100_000

export const donationFrequencyOptions = [
  { id: 'once', label: 'One-off' },
  { id: 'monthly', label: 'Monthly' },
] as const

export type DonationFrequency = (typeof donationFrequencyOptions)[number]['id']

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
