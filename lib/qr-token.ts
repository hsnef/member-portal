import jwt from 'jsonwebtoken'

/**
 * Server only. The secret lives in the environment (QR_TOKEN_SECRET, per
 * Vercel environment). There is no fallback: a default committed to this
 * public repository would let anyone forge a pass, and checking a pass in the
 * browser (which never has the secret) could only ever fail. Passes are
 * checked by /api/members/verify-pass.
 */
function secret(): string {
  const s = process.env.QR_TOKEN_SECRET
  if (!s) throw new Error('QR_TOKEN_SECRET is not set')
  return s
}

export interface QRTokenPayload {
  membershipId: string
  memberId: string
  memberClass: 'Personal' | 'Business'
  level: 'Community' | 'Annual' | 'Lifetime'
  // Token will also include standard JWT claims (iat, exp)
}

/**
 * Generate a signed JWT token for QR code
 * Token expires in 1 year (can be scanned even if member is offline)
 */
export function generateQRToken(payload: QRTokenPayload): string {
  return jwt.sign(payload, secret(), {
    expiresIn: '1y',
    issuer: 'hsnef-membership-portal',
  })
}

/**
 * Verify and decode a QR token
 * Returns payload if valid, throws error if invalid/expired
 */
export function verifyQRToken(token: string): QRTokenPayload {
  try {
    const decoded = jwt.verify(token, secret(), {
      issuer: 'hsnef-membership-portal',
    }) as QRTokenPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('QR code has expired. Please refresh your membership pass.')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid QR code. Please contact support.')
    }
    throw error
  }
}

/**
 * Generate the full URL that will be encoded in the QR code
 */
export function generateQRCodeURL(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/verify-qr?token=${token}`
}
