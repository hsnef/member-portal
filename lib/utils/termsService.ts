/**
 * Terms of Use Service
 *
 * Handles fetching terms content, checking acceptance status,
 * and recording term acceptances with version tracking.
 */

import { createClient } from '@/lib/supabase/client'

export interface TermsContent {
  id: string
  version: string
  title: string
  content: string
  content_format: 'markdown' | 'html' | 'plain'
  is_active: boolean
  effective_date: string
  created_at: string
  updated_at: string
}

export interface TermsAcceptance {
  id: string
  member_id: string
  auth_user_id: string
  terms_version: string
  terms_content_id: string
  accepted_at: string
  ip_address?: string
  user_agent?: string
  acceptance_method: 'registration' | 'first_login' | 'forced_update'
}

/**
 * Get the currently active terms content
 */
export async function getActiveTerms(): Promise<TermsContent | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('terms_content')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching active terms:', error)
    return null
  }

  return data
}

/**
 * Check if a user has accepted the current active terms
 */
export async function hasAcceptedCurrentTerms(
  authUserId: string,
  memberId?: string
): Promise<boolean> {
  const supabase = createClient()

  // Get active terms version
  const activeTerms = await getActiveTerms()
  if (!activeTerms) {
    console.warn('No active terms found')
    return true // No terms to accept
  }

  // Check if user has accepted this version
  const query = supabase
    .from('terms_acceptances')
    .select('id')
    .eq('terms_version', activeTerms.version)

  if (memberId) {
    query.eq('member_id', memberId)
  } else {
    query.eq('auth_user_id', authUserId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error checking terms acceptance:', error)
    return false
  }

  return !!data
}

/**
 * Record a terms acceptance (uses server-side API for accurate IP)
 */
export async function recordTermsAcceptance(params: {
  termsVersion: string
  termsContentId: string
  memberId?: string
  acceptanceMethod: 'registration' | 'first_login' | 'forced_update'
}): Promise<boolean> {
  try {
    const response = await fetch('/api/accept-terms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        termsVersion: params.termsVersion,
        termsContentId: params.termsContentId,
        memberId: params.memberId,
        acceptanceMethod: params.acceptanceMethod,
      }),
    })

    if (!response.ok) {
      // Try to get JSON error, fallback to text
      let error
      try {
        error = await response.json()
      } catch {
        error = await response.text()
      }
      console.error('Error recording terms acceptance:', {
        status: response.status,
        statusText: response.statusText,
        error,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Error calling accept-terms API:', error)
    return false
  }
}

/**
 * Record terms acceptance for unauthenticated user (during /join)
 * Stores with member_id only, auth_user_id will be added at first login
 */
export async function recordTermsAcceptanceForMember(params: {
  memberId: string
  termsVersion: string
  termsContentId: string
  acceptanceMethod: 'registration' | 'first_login' | 'forced_update'
}): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.from('terms_acceptances').insert({
    member_id: params.memberId,
    auth_user_id: null, // Will be filled in at first login
    terms_version: params.termsVersion,
    terms_content_id: params.termsContentId,
    ip_address: null, // Can't get server-side IP from client
    user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    acceptance_method: params.acceptanceMethod,
  })

  if (error) {
    console.error('Error recording terms acceptance for member:', error)
    return false
  }

  return true
}

/**
 * Get user's IP address (client-side approximation)
 * For server-side, use request headers
 */
export async function getUserIpAddress(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Error fetching IP address:', error)
    return undefined
  }
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  return typeof window !== 'undefined' ? window.navigator.userAgent : ''
}

/**
 * Record a terms acceptance bypass (when user encounters errors)
 */
export async function recordTermsBypass(params: {
  termsVersion: string
  termsContentId: string
  memberId?: string
  errorMessage: string
  retryCount: number
}): Promise<boolean> {
  try {
    const response = await fetch('/api/bypass-terms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      console.error('Failed to record bypass')
      return false
    }

    return true
  } catch (error) {
    console.error('Error recording bypass:', error)
    return false
  }
}

/**
 * Check if user has an unresolved bypass that should trigger re-prompt
 */
export async function hasUnresolvedBypass(
  authUserId: string,
  memberId?: string
): Promise<boolean> {
  const supabase = createClient()

  const query = supabase
    .from('terms_acceptance_bypasses')
    .select('id')
    .eq('should_reprompt', true)
    .eq('resolved', false)

  if (memberId) {
    query.eq('member_id', memberId)
  } else {
    query.eq('auth_user_id', authUserId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error checking bypass status:', error)
    return false
  }

  return !!data
}

/**
 * Get all terms versions (for admin)
 */
export async function getAllTermsVersions(): Promise<TermsContent[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('terms_content')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching terms versions:', error)
    return []
  }

  return data || []
}

/**
 * Get acceptance history for a member (for admin)
 */
export async function getMemberAcceptanceHistory(
  memberId: string
): Promise<TermsAcceptance[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('terms_acceptances')
    .select('*')
    .eq('member_id', memberId)
    .order('accepted_at', { ascending: false })

  if (error) {
    console.error('Error fetching acceptance history:', error)
    return []
  }

  return data || []
}

/**
 * Create new terms version (for admin)
 */
export async function createTermsVersion(params: {
  version: string
  title: string
  content: string
  contentFormat?: 'markdown' | 'html' | 'plain'
  effectiveDate: string
  setAsActive?: boolean
}): Promise<boolean> {
  const supabase = createClient()

  // Get current user
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    console.error('No user found')
    return false
  }

  // If setting as active, deactivate others first
  if (params.setAsActive) {
    await supabase
      .from('terms_content')
      .update({ is_active: false })
      .eq('is_active', true)
  }

  const { error } = await supabase.from('terms_content').insert({
    version: params.version,
    title: params.title,
    content: params.content,
    content_format: params.contentFormat || 'markdown',
    effective_date: params.effectiveDate,
    is_active: params.setAsActive || false,
    created_by: userData.user.id,
  })

  if (error) {
    console.error('Error creating terms version:', error)
    return false
  }

  return true
}

/**
 * Set a terms version as active (for admin)
 */
export async function setActiveTermsVersion(versionId: string): Promise<boolean> {
  const supabase = createClient()

  // Deactivate all versions
  await supabase.from('terms_content').update({ is_active: false }).eq('is_active', true)

  // Activate the specified version
  const { error } = await supabase
    .from('terms_content')
    .update({ is_active: true })
    .eq('id', versionId)

  if (error) {
    console.error('Error setting active terms version:', error)
    return false
  }

  return true
}
