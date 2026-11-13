/** Donation funds a member can give to. The server accepts only these. */
export const DONATION_PURPOSES: Array<{ value: string; label: string }> = [
  { value: 'General', label: 'General Temple Fund' },
  { value: 'Building', label: 'Building & Maintenance' },
  { value: 'Festival', label: 'Festival Sponsorship' },
  { value: 'Education', label: 'Education Programs' },
  { value: 'Annadanam', label: 'Annadanam (Food Service)' },
  { value: 'Priest', label: 'Priest Support' },
  { value: 'Other', label: 'Other' },
]

/** Online donations: at least $1, and no more than this in one payment. */
export const DONATION_MIN = 1
export const DONATION_MAX = 50_000

export function isDonationFund(value: unknown): value is string {
  return typeof value === 'string' && DONATION_PURPOSES.some((p) => p.value === value)
}
