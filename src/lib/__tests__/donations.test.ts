import {
  sanitizeDonationAmountInput,
  toDonationAmountInPence,
} from '../donations'

describe('donation utilities', () => {
  it('keeps donation amount input to pounds and two decimal places', () => {
    expect(sanitizeDonationAmountInput('GBP 25.678')).toBe('25.67')
    expect(sanitizeDonationAmountInput('abc10.5xyz')).toBe('10.5')
    expect(sanitizeDonationAmountInput('15')).toBe('15')
  })

  it('converts valid donation amounts to pence', () => {
    expect(toDonationAmountInPence(25)).toBe(2500)
    expect(toDonationAmountInPence('10.50')).toBe(1050)
  })

  it('rejects invalid or out-of-range donation amounts', () => {
    expect(toDonationAmountInPence(0.5)).toBeNull()
    expect(toDonationAmountInPence(100_000.01)).toBeNull()
    expect(toDonationAmountInPence('not-a-number')).toBeNull()
  })
})
