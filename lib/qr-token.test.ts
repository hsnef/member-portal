import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'

import { generateQRCodeURL, generateQRToken, verifyQRToken, type QRTokenPayload } from './qr-token'

// Must match vitest.setup.ts, which sets this before the module under test is
// imported. Tests sign their own tokens with it to forge specific failures.
const SECRET = 'test-qr-secret-not-a-real-key'
const ISSUER = 'hsnef-membership-portal'

const payload: QRTokenPayload = {
  membershipId: 'HSNEF-1234',
  memberId: '00000000-0000-4000-8000-000000000001',
  memberClass: 'Personal',
  level: 'Annual',
}

describe('generateQRToken / verifyQRToken', () => {
  it('round-trips a payload', () => {
    const decoded = verifyQRToken(generateQRToken(payload))

    expect(decoded.membershipId).toBe(payload.membershipId)
    expect(decoded.memberId).toBe(payload.memberId)
    expect(decoded.memberClass).toBe(payload.memberClass)
    expect(decoded.level).toBe(payload.level)
  })

  it('issues tokens that expire a year out, not sooner', () => {
    const { iat, exp } = jwt.decode(generateQRToken(payload)) as { iat: number; exp: number }
    const days = (exp - iat) / 86_400

    // A pass that expires early strands a member at the door.
    expect(days).toBeGreaterThan(364)
    expect(days).toBeLessThan(367)
  })

  // The whole point of signing. A forged pass must not open the door.
  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign(payload, 'attacker-supplied-secret', { issuer: ISSUER })

    expect(() => verifyQRToken(forged)).toThrow('Invalid QR code')
  })

  it('rejects a token whose payload was edited after signing', () => {
    const [header, body, signature] = generateQRToken(payload).split('.')
    const edited = { ...payload, level: 'Lifetime' }
    const tamperedBody = Buffer.from(JSON.stringify(edited)).toString('base64url')

    expect(() => verifyQRToken(`${header}.${tamperedBody}.${signature}`)).toThrow('Invalid QR code')
  })

  it('rejects a token issued by someone else', () => {
    const wrongIssuer = jwt.sign(payload, SECRET, { issuer: 'some-other-system' })

    expect(() => verifyQRToken(wrongIssuer)).toThrow('Invalid QR code')
  })

  it('reports expiry separately, so staff can tell "renew this" from "this is fake"', () => {
    const expired = jwt.sign(payload, SECRET, { issuer: ISSUER, expiresIn: '-1s' })

    // Distinct message: an expired pass is a renewal conversation, a bad
    // signature is a security one. Collapsing them would hide both.
    expect(() => verifyQRToken(expired)).toThrow('QR code has expired')
  })

  it('rejects a token that is not a JWT at all', () => {
    expect(() => verifyQRToken('not-a-token')).toThrow('Invalid QR code')
    expect(() => verifyQRToken('')).toThrow('Invalid QR code')
  })
})

describe('generateQRCodeURL', () => {
  it('builds a verify URL against an explicit base', () => {
    expect(generateQRCodeURL('abc', 'https://member.hsnef.org')).toBe(
      'https://member.hsnef.org/verify-qr?token=abc'
    )
  })

  it('falls back to NEXT_PUBLIC_APP_URL when no base is given', () => {
    expect(generateQRCodeURL('abc')).toBe('https://member.example.org/verify-qr?token=abc')
  })
})
