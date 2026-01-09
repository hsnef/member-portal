/**
 * Portal Settings Utility
 *
 * Provides functions to read and manage portal-wide configuration settings.
 * Settings are stored in the portal_settings table and can be modified by admins.
 */

import { createClient } from '@/lib/supabase/client'

export interface PortalSetting {
  id: string
  setting_key: string
  setting_value: Record<string, any>
  setting_type: 'boolean' | 'string' | 'number' | 'json'
  display_name: string
  description?: string
  category: string
  updated_by?: string
  created_at: string
  updated_at: string
}

/**
 * Get a specific setting value by key
 */
export async function getSettingValue(settingKey: string): Promise<any> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('portal_settings')
    .select('setting_value, setting_type')
    .eq('setting_key', settingKey)
    .single()

  if (error || !data) {
    console.error(`Error fetching setting ${settingKey}:`, error)
    return null
  }

  // Extract the actual value based on type
  if (data.setting_type === 'boolean') {
    return data.setting_value.enabled === true
  } else if (data.setting_type === 'string' || data.setting_type === 'number') {
    return data.setting_value.value
  } else {
    return data.setting_value
  }
}

/**
 * Check if traditional login is enabled
 */
export async function isTraditionalLoginEnabled(): Promise<boolean> {
  const value = await getSettingValue('enable_traditional_login')
  return value === true
}

/**
 * Check if member approval is required
 */
export async function isMemberApprovalRequired(): Promise<boolean> {
  const value = await getSettingValue('require_member_approval')
  return value === true
}

/**
 * Get all settings by category
 */
export async function getSettingsByCategory(category: string): Promise<PortalSetting[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('portal_settings')
    .select('*')
    .eq('category', category)
    .order('display_name')

  if (error) {
    console.error(`Error fetching settings for category ${category}:`, error)
    return []
  }

  return data || []
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<PortalSetting[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('portal_settings')
    .select('*')
    .order('category, display_name')

  if (error) {
    console.error('Error fetching all settings:', error)
    return []
  }

  return data || []
}

/**
 * Update a setting value (admin only)
 */
export async function updateSetting(
  settingKey: string,
  value: any,
  settingType: 'boolean' | 'string' | 'number' | 'json'
): Promise<boolean> {
  const supabase = createClient()

  // Get current user
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    console.error('No user found')
    return false
  }

  // Format value based on type
  let settingValue: Record<string, any>
  if (settingType === 'boolean') {
    settingValue = { enabled: value === true }
  } else if (settingType === 'string' || settingType === 'number') {
    settingValue = { value }
  } else {
    settingValue = value
  }

  const { error } = await supabase
    .from('portal_settings')
    .update({
      setting_value: settingValue,
      updated_by: userData.user.id,
    })
    .eq('setting_key', settingKey)

  if (error) {
    console.error(`Error updating setting ${settingKey}:`, error)
    return false
  }

  return true
}

/**
 * Get organization info
 */
export async function getOrganizationInfo(): Promise<{
  name: string
  email: string
  phone: string
}> {
  const [name, email, phone] = await Promise.all([
    getSettingValue('organization_name'),
    getSettingValue('organization_email'),
    getSettingValue('organization_phone'),
  ])

  return {
    name: name || 'HSNEF',
    email: email || 'info@hsnef.org',
    phone: phone || '(555) 123-4567',
  }
}

/**
 * Membership pricing structure
 */
export interface MembershipPricing {
  community: {
    price: number
    displayPrice: string
    description: string
  }
  annual: {
    price: number
    displayPrice: string
    description: string
  }
  lifetime: {
    price: number
    displayPrice: string
    description: string
  }
}

/**
 * Get membership pricing settings
 * Returns pricing for all membership levels
 */
export async function getMembershipPricing(): Promise<MembershipPricing> {
  const value = await getSettingValue('membership_pricing')

  // Default pricing if not set
  const defaultPricing: MembershipPricing = {
    community: {
      price: 0,
      displayPrice: 'Free',
      description: 'Free community membership',
    },
    annual: {
      price: 101,
      displayPrice: '$101/year',
      description: 'Annual membership with full benefits',
    },
    lifetime: {
      price: 1008,
      displayPrice: '$1,008 (one-time)',
      description: 'Lifetime membership - one-time payment',
    },
  }

  if (!value) {
    return defaultPricing
  }

  return value as MembershipPricing
}

/**
 * Update membership pricing settings (Office Manager only)
 */
export async function updateMembershipPricing(
  pricing: MembershipPricing
): Promise<boolean> {
  return await updateSetting('membership_pricing', pricing, 'json')
}
