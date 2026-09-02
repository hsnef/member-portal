/**
 * Zelle Payment Utilities
 *
 * Provides functions for Zelle payment operations including:
 * - Token generation for QR codes
 * - Settings management
 * - Reference code generation
 */

import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import type { ZelleSettings, ZellePaymentRequest, PaymentPurpose } from '@/types/database'

const ZELLE_TOKEN_SECRET = process.env.ZELLE_TOKEN_SECRET || process.env.QR_TOKEN_SECRET || 'zelle-secret-change-in-production'

// ============================================================================
// Token Generation
// ============================================================================

export interface ZelleTokenPayload {
  reference: string
  amount: number
  purpose: PaymentPurpose
  memberId?: string
  expiresAt: string
}

/**
 * Generate a signed JWT token for Zelle payment QR code
 */
export function generateZelleToken(payload: ZelleTokenPayload): string {
  return jwt.sign(payload, ZELLE_TOKEN_SECRET, {
    expiresIn: '48h', // Default expiry, actual expiry is in payload
    issuer: 'hsnef-zelle-payment',
  })
}

/**
 * Verify and decode a Zelle payment token
 */
export function verifyZelleToken(token: string): ZelleTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ZELLE_TOKEN_SECRET, {
      issuer: 'hsnef-zelle-payment',
    }) as ZelleTokenPayload

    // Check if expired based on payload
    if (new Date(decoded.expiresAt) < new Date()) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

// ============================================================================
// QR Code Generation
// ============================================================================

/**
 * Generate QR code data URL for a Zelle payment
 */
export async function generateZelleQRCode(
  referenceCode: string,
  baseUrl?: string
): Promise<string> {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const url = `${base}/pay/${referenceCode}`

  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

/**
 * Generate the payment URL for a reference code
 */
export function getZellePaymentURL(referenceCode: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/pay/${referenceCode}`
}

// ============================================================================
// Reference Code Generation
// ============================================================================

/**
 * Generate a unique reference code for Zelle payment
 * Format: HSNEF-Z-XXXX (where XXXX is alphanumeric)
 */
export function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like 0, O, 1, I
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `HSNEF-Z-${code}`
}

// ============================================================================
// Settings Management
// ============================================================================

const DEFAULT_ZELLE_SETTINGS: ZelleSettings = {
  enabled: false,
  zelle_email: '',
  zelle_phone: '',
  auto_confirm_threshold: 50,
  request_expiry_hours: 48,
  instructions: 'Please send your Zelle payment and include the reference code in the memo field.',
}

/**
 * Get Zelle payment settings from portal_settings
 */
export async function getZelleSettings(): Promise<ZelleSettings> {
  const supabase = createClient()

  const settingKeys = [
    'zelle_enabled',
    'zelle_email',
    'zelle_phone',
    'zelle_auto_confirm_threshold',
    'zelle_request_expiry_hours',
    'zelle_instructions',
  ]

  const { data, error } = await supabase
    .from('portal_settings')
    .select('setting_key, setting_value, setting_type')
    .in('setting_key', settingKeys)

  if (error || !data) {
    console.error('Error fetching Zelle settings:', error)
    return DEFAULT_ZELLE_SETTINGS
  }

  const settings: ZelleSettings = { ...DEFAULT_ZELLE_SETTINGS }

  for (const row of data) {
    const value = row.setting_type === 'boolean'
      ? row.setting_value?.enabled === true
      : row.setting_value?.value

    switch (row.setting_key) {
      case 'zelle_enabled':
        settings.enabled = value === true
        break
      case 'zelle_email':
        settings.zelle_email = value || ''
        break
      case 'zelle_phone':
        settings.zelle_phone = value || ''
        break
      case 'zelle_auto_confirm_threshold':
        settings.auto_confirm_threshold = typeof value === 'number' ? value : 50
        break
      case 'zelle_request_expiry_hours':
        settings.request_expiry_hours = typeof value === 'number' ? value : 48
        break
      case 'zelle_instructions':
        settings.instructions = value || DEFAULT_ZELLE_SETTINGS.instructions
        break
    }
  }

  return settings
}

/**
 * Check if Zelle payments are enabled
 */
export async function isZelleEnabled(): Promise<boolean> {
  const settings = await getZelleSettings()
  return settings.enabled && (!!settings.zelle_email || !!settings.zelle_phone)
}

// ============================================================================
// Payment Request Helpers
// ============================================================================

export interface CreateZelleRequestParams {
  memberId?: string
  amount: number
  purpose: PaymentPurpose
  description?: string
  requestId?: string
  eventRegistrationId?: string
  serviceBookingId?: string
  createdBy?: string
}

/**
 * Calculate expiration date based on settings
 */
export function calculateExpiryDate(expiryHours: number = 48): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + expiryHours)
  return expiry
}

/**
 * Check if a payment request should auto-confirm
 */
export function shouldAutoConfirm(amount: number, threshold: number): boolean {
  return amount <= threshold
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ZellePaymentRequest['status']): string {
  const labels: Record<ZellePaymentRequest['status'], string> = {
    pending: 'Awaiting Payment',
    member_confirmed: 'Awaiting Confirmation',
    staff_confirmed: 'Confirmed',
    auto_confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    expired: 'Expired',
  }
  return labels[status]
}

/**
 * Get status color class for styling
 */
export function getStatusColor(status: ZellePaymentRequest['status']): string {
  const colors: Record<ZellePaymentRequest['status'], string> = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    member_confirmed: 'text-blue-600 bg-blue-50 border-blue-200',
    staff_confirmed: 'text-green-600 bg-green-50 border-green-200',
    auto_confirmed: 'text-green-600 bg-green-50 border-green-200',
    cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
    expired: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[status]
}

/**
 * Calculate time remaining until expiry
 */
export function getTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }

  return `${hours}h ${minutes}m`
}
