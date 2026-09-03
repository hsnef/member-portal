import jwt from 'jsonwebtoken'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  calculateExpiryDate,
  formatAmount,
  generateReferenceCode,
  generateZelleToken,
  getStatusLabel,
  getTimeRemaining,
  getZellePaymentURL,
  shouldAutoConfirm,
  verifyZelleToken,
  type ZelleTokenPayload,
} from './index'

// Must match vitest.setup.ts, which sets this before this module is imported.
const SECRET = 'test-zelle-secret-not-a-real-key'
const ISSUER = 'hsnef-zelle-payment'

function payload(overrides: Partial<ZelleTokenPayload> = {}): ZelleTokenPayload {
  return {
    reference: 'HSNEF-Z-ABCD',
    amount: 100,
    purpose: 'donation',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  } as ZelleTokenPayload
}

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// The money decision. This is the function that decides whether a payment is
// confirmed without a human looking at it, so it gets the most attention.
// ---------------------------------------------------------------------------
describe('shouldAutoConfirm', () => {
  it('auto-confirms below the threshold', () => {
    expect(shouldAutoConfirm(49, 50)).toBe(true)
  })

  it('auto-confirms exactly AT the threshold', () => {
    // Deliberate characterisation of the boundary: the comparison is `<=`, so a
    // payment equal to the threshold skips staff review. If the intent was
    // "under $50 only", this test is what fails when someone tightens it.
    expect(shouldAutoConfirm(50, 50)).toBe(true)
  })

  it('holds anything above the threshold for staff', () => {
    expect(shouldAutoConfirm(50.01, 50)).toBe(false)
    expect(shouldAutoConfirm(5000, 50)).toBe(false)
  })

  it('holds every payment when the threshold is zero', () => {
    // A zero threshold must mean "review everything", not "review nothing".
    expect(shouldAutoConfirm(0.01, 0)).toBe(false)
    expect(shouldAutoConfirm(1, 0)).toBe(false)
  })
})

describe('generateZelleToken / verifyZelleToken', () => {
  it('round-trips a payload', () => {
    const decoded = verifyZelleToken(generateZelleToken(payload()))

    expect(decoded).not.toBeNull()
    expect(decoded?.reference).toBe('HSNEF-Z-ABCD')
    expect(decoded?.amount).toBe(100)
  })

  it('returns null rather than throwing for a bad token', () => {
    // Callers branch on null; a throw here would surface as a 500 instead of a
    // "payment link is not valid" page.
    expect(verifyZelleToken('not-a-token')).toBeNull()
    expect(verifyZelleToken('')).toBeNull()
  })

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign(payload(), 'attacker-supplied-secret', { issuer: ISSUER })

    expect(verifyZelleToken(forged)).toBeNull()
  })

  it('rejects an amount edited after signing', () => {
    // The attack that matters: pay $1, claim $1,000 of credit.
    const [header, , signature] = generateZelleToken(payload({ amount: 1 })).split('.')
    const inflated = Buffer.from(JSON.stringify(payload({ amount: 1000 }))).toString('base64url')

    expect(verifyZelleToken(`${header}.${inflated}.${signature}`)).toBeNull()
  })

  it('rejects a token issued by someone else', () => {
    expect(verifyZelleToken(jwt.sign(payload(), SECRET, { issuer: 'other' }))).toBeNull()
  })

  it('rejects a token whose payload expiry has passed', () => {
    const stale = payload({ expiresAt: new Date(Date.now() - 1000).toISOString() })

    // Signature is still valid here — it is the in-payload expiry that rejects it.
    expect(verifyZelleToken(jwt.sign(stale, SECRET, { issuer: ISSUER }))).toBeNull()
  })

  it('KNOWN WEAKNESS: a malformed expiresAt does not expire the token', () => {
    // Documents current behaviour, it is not an endorsement. `new Date('garbage')`
    // is Invalid Date, and `Invalid Date < now` is false, so the payload expiry
    // check silently passes and only the 48h JWT `exp` still caps the token.
    // Left as-is here because fixing it changes payment business logic; raised
    // separately rather than changed under cover of adding tests.
    const malformed = jwt.sign(payload({ expiresAt: 'not-a-date' }), SECRET, { issuer: ISSUER })

    expect(verifyZelleToken(malformed)).not.toBeNull()
  })
})

describe('generateReferenceCode', () => {
  it('uses the HSNEF-Z- prefix and four characters', () => {
    expect(generateReferenceCode()).toMatch(/^HSNEF-Z-[A-Z2-9]{4}$/)
  })

  it('never emits characters that are misread when written on a memo line', () => {
    // The codes get hand-copied into a Zelle memo field, so 0/O and 1/I are out.
    const codes = Array.from({ length: 300 }, () => generateReferenceCode().slice(8))

    expect(codes.join('')).not.toMatch(/[01OI]/)
  })
})

describe('calculateExpiryDate', () => {
  it('defaults to 48 hours out', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))

    expect(calculateExpiryDate().toISOString()).toBe('2026-03-03T12:00:00.000Z')
  })

  it('honours an explicit window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))

    expect(calculateExpiryDate(1).toISOString()).toBe('2026-03-01T13:00:00.000Z')
  })
})

describe('getTimeRemaining', () => {
  it('counts down in days once past 24 hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))

    expect(getTimeRemaining('2026-03-03T14:00:00Z')).toBe('2d 2h')
  })

  it('counts down in hours and minutes under a day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))

    expect(getTimeRemaining('2026-03-01T15:30:00Z')).toBe('3h 30m')
  })

  it('says Expired once the moment has passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'))

    expect(getTimeRemaining('2026-03-01T11:59:59Z')).toBe('Expired')
  })
})

describe('formatAmount', () => {
  it('renders whole dollars with cents', () => {
    expect(formatAmount(50)).toBe('$50.00')
  })

  it('keeps cents rather than rounding them away', () => {
    expect(formatAmount(1234.56)).toBe('$1,234.56')
  })

  it('renders zero', () => {
    expect(formatAmount(0)).toBe('$0.00')
  })
})

describe('getStatusLabel', () => {
  it('distinguishes awaiting-payment from awaiting-confirmation', () => {
    expect(getStatusLabel('pending')).toBe('Awaiting Payment')
    expect(getStatusLabel('member_confirmed')).toBe('Awaiting Confirmation')
  })

  it('shows both confirmed routes as simply Confirmed', () => {
    // A member should not have to care whether a human or the threshold cleared it.
    expect(getStatusLabel('staff_confirmed')).toBe('Confirmed')
    expect(getStatusLabel('auto_confirmed')).toBe('Confirmed')
  })

  it('covers every status, so a new one cannot render undefined', () => {
    const statuses = [
      'pending',
      'member_confirmed',
      'staff_confirmed',
      'auto_confirmed',
      'cancelled',
      'expired',
    ] as const

    for (const status of statuses) {
      expect(getStatusLabel(status)).toBeTruthy()
    }
  })
})

describe('getZellePaymentURL', () => {
  it('builds against an explicit base', () => {
    expect(getZellePaymentURL('HSNEF-Z-ABCD', 'https://member.hsnef.org')).toBe(
      'https://member.hsnef.org/pay/HSNEF-Z-ABCD'
    )
  })

  it('falls back to NEXT_PUBLIC_APP_URL', () => {
    expect(getZellePaymentURL('HSNEF-Z-ABCD')).toBe('https://member.example.org/pay/HSNEF-Z-ABCD')
  })
})
