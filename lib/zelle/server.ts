/**
 * Server-side Zelle Payment Utilities
 *
 * These functions use the server-side Supabase client and should only
 * be called from API routes or server components.
 */

import { createClient } from '@/lib/supabase/server'
import type { ZelleSettings, ZellePaymentRequest, PaymentPurpose } from '@/types/database'
import {
  generateReferenceCode,
  generateZelleToken,
  calculateExpiryDate,
  shouldAutoConfirm,
} from './index'

// ============================================================================
// Settings (Server-side)
// ============================================================================

const DEFAULT_ZELLE_SETTINGS: ZelleSettings = {
  enabled: false,
  zelle_email: '',
  zelle_phone: '',
  auto_confirm_threshold: 50,
  request_expiry_hours: 48,
  instructions: 'Please send your Zelle payment and include the reference code in the memo field.',
}

export async function getZelleSettingsServer(): Promise<ZelleSettings> {
  const supabase = await createClient()

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

// ============================================================================
// Payment Request Operations
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

export interface CreateZelleRequestResult {
  success: boolean
  request?: ZellePaymentRequest
  error?: string
}

/**
 * Create a new Zelle payment request
 */
export async function createZelleRequest(
  params: CreateZelleRequestParams
): Promise<CreateZelleRequestResult> {
  const supabase = await createClient()
  const settings = await getZelleSettingsServer()

  if (!settings.enabled) {
    return { success: false, error: 'Zelle payments are not enabled' }
  }

  // Generate unique reference code
  let referenceCode = generateReferenceCode()

  // Check for uniqueness (extremely rare collision)
  const { data: existing } = await supabase
    .from('zelle_payment_requests')
    .select('id')
    .eq('reference_code', referenceCode)
    .single()

  if (existing) {
    referenceCode = generateReferenceCode() // Try again
  }

  // Calculate expiry
  const expiresAt = calculateExpiryDate(settings.request_expiry_hours)

  // Generate QR token
  const qrToken = generateZelleToken({
    reference: referenceCode,
    amount: params.amount,
    purpose: params.purpose,
    memberId: params.memberId,
    expiresAt: expiresAt.toISOString(),
  })

  // Insert the request
  const { data, error } = await supabase
    .from('zelle_payment_requests')
    .insert({
      reference_code: referenceCode,
      member_id: params.memberId || null,
      amount: params.amount,
      purpose: params.purpose,
      description: params.description || null,
      request_id: params.requestId || null,
      event_registration_id: params.eventRegistrationId || null,
      service_booking_id: params.serviceBookingId || null,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      qr_token: qrToken,
      created_by: params.createdBy || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating Zelle request:', error)
    return { success: false, error: 'Failed to create payment request' }
  }

  return { success: true, request: data }
}

/**
 * Get a Zelle payment request by reference code
 */
export async function getZelleRequestByReference(
  referenceCode: string
): Promise<ZellePaymentRequest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zelle_payment_requests')
    .select('*')
    .eq('reference_code', referenceCode)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Member confirms they sent the payment
 */
export async function memberConfirmPayment(
  referenceCode: string,
  memberZelleReference?: string
): Promise<{ success: boolean; autoConfirmed?: boolean; error?: string }> {
  const supabase = await createClient()
  const settings = await getZelleSettingsServer()

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from('zelle_payment_requests')
    .select('*')
    .eq('reference_code', referenceCode)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Payment request not found' }
  }

  if (request.status !== 'pending') {
    return { success: false, error: 'This payment request is no longer pending' }
  }

  // Check if expired
  if (new Date(request.expires_at) < new Date()) {
    await supabase
      .from('zelle_payment_requests')
      .update({ status: 'expired' })
      .eq('id', request.id)

    return { success: false, error: 'This payment request has expired' }
  }

  // Determine if auto-confirm applies
  const autoConfirm = shouldAutoConfirm(request.amount, settings.auto_confirm_threshold)

  if (autoConfirm) {
    // Auto-confirm: create payment record and mark complete
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        member_id: request.member_id,
        amount: request.amount,
        currency: 'usd',
        method: 'Zelle',
        purpose: request.purpose,
        zelle_reference: memberZelleReference || request.reference_code,
        notes: `Auto-confirmed Zelle payment. Reference: ${request.reference_code}`,
        payment_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return { success: false, error: 'Failed to record payment' }
    }

    // Update request status
    await supabase
      .from('zelle_payment_requests')
      .update({
        status: 'auto_confirmed',
        member_confirmed_at: new Date().toISOString(),
        member_zelle_reference: memberZelleReference || null,
        payment_id: payment.id,
      })
      .eq('id', request.id)

    return { success: true, autoConfirmed: true }
  } else {
    // Requires staff confirmation
    const { error: updateError } = await supabase
      .from('zelle_payment_requests')
      .update({
        status: 'member_confirmed',
        member_confirmed_at: new Date().toISOString(),
        member_zelle_reference: memberZelleReference || null,
      })
      .eq('id', request.id)

    if (updateError) {
      return { success: false, error: 'Failed to update payment status' }
    }

    return { success: true, autoConfirmed: false }
  }
}

/**
 * Staff confirms payment was received
 */
export async function staffConfirmPayment(
  referenceCode: string,
  staffUserId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from('zelle_payment_requests')
    .select('*')
    .eq('reference_code', referenceCode)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Payment request not found' }
  }

  if (request.status !== 'member_confirmed' && request.status !== 'pending') {
    return { success: false, error: 'This payment cannot be confirmed' }
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      member_id: request.member_id,
      amount: request.amount,
      currency: 'usd',
      method: 'Zelle',
      purpose: request.purpose,
      zelle_reference: request.member_zelle_reference || request.reference_code,
      notes: notes || `Staff-confirmed Zelle payment. Reference: ${request.reference_code}`,
      payment_date: new Date().toISOString(),
      created_by: staffUserId,
    })
    .select()
    .single()

  if (paymentError) {
    console.error('Error creating payment record:', paymentError)
    return { success: false, error: 'Failed to record payment' }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('zelle_payment_requests')
    .update({
      status: 'staff_confirmed',
      staff_confirmed_at: new Date().toISOString(),
      staff_confirmed_by: staffUserId,
      staff_notes: notes || null,
      payment_id: payment.id,
    })
    .eq('id', request.id)

  if (updateError) {
    return { success: false, error: 'Failed to update payment status' }
  }

  return { success: true }
}

/**
 * Cancel a Zelle payment request
 */
export async function cancelZelleRequest(
  referenceCode: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: request, error: fetchError } = await supabase
    .from('zelle_payment_requests')
    .select('id, status')
    .eq('reference_code', referenceCode)
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Payment request not found' }
  }

  if (request.status !== 'pending' && request.status !== 'member_confirmed') {
    return { success: false, error: 'This payment request cannot be cancelled' }
  }

  const { error: updateError } = await supabase
    .from('zelle_payment_requests')
    .update({ status: 'cancelled' })
    .eq('id', request.id)

  if (updateError) {
    return { success: false, error: 'Failed to cancel payment request' }
  }

  return { success: true }
}

/**
 * Get pending Zelle requests for staff review
 */
export async function getPendingZelleRequests(): Promise<ZellePaymentRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zelle_payment_requests')
    .select(`
      *,
      members:member_id (
        id,
        membership_id,
        first_name,
        last_name,
        business_name,
        member_class,
        primary_email
      )
    `)
    .in('status', ['pending', 'member_confirmed'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending Zelle requests:', error)
    return []
  }

  return data || []
}

/**
 * Get member's Zelle payment requests
 */
export async function getMemberZelleRequests(memberId: string): Promise<ZellePaymentRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zelle_payment_requests')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching member Zelle requests:', error)
    return []
  }

  return data || []
}
