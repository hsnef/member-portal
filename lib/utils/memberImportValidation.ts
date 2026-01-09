/**
 * Member Import Validation Utilities
 *
 * Functions to validate member data during CSV import
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Validate Member_Number format
 * Format: XXYYZZZZ (8 digits)
 * XX = Member_Class (11=Personal, 21=Business)
 * YY = Member_Type/Level (00=Community, 01=Annual, 02=Lifetime)
 * ZZZZ = Sequence number
 */
export function validateMemberNumberFormat(
  memberNumber: string,
  memberClass?: string,
  memberType?: string
): { isValid: boolean; error?: string } {
  if (!memberNumber || memberNumber.trim() === '') {
    return { isValid: true } // Empty is OK - system will auto-generate
  }

  const cleaned = memberNumber.trim()

  // Must be exactly 8 digits
  if (!/^\d{8}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Member_Number must be exactly 8 digits (format: XXYYZZZZ)'
    }
  }

  const classPrefix = cleaned.substring(0, 2)
  const typePrefix = cleaned.substring(2, 4)

  // Validate class prefix
  const validClassPrefixes = ['11', '21', '99'] // Personal, Business, Test
  if (!validClassPrefixes.includes(classPrefix)) {
    return {
      isValid: false,
      error: `Invalid Member_Class prefix "${classPrefix}". Must be 11 (Personal) or 21 (Business)`
    }
  }

  // Validate type prefix
  const validTypePrefixes = ['00', '01', '02'] // Community, Annual, Lifetime
  if (!validTypePrefixes.includes(typePrefix)) {
    return {
      isValid: false,
      error: `Invalid Member_Type prefix "${typePrefix}". Must be 00 (Community), 01 (Annual), or 02 (Lifetime)`
    }
  }

  // If memberClass is provided, validate it matches
  if (memberClass) {
    const expectedPrefix = memberClass.toLowerCase() === 'business' ? '21' : '11'
    if (classPrefix !== expectedPrefix) {
      return {
        isValid: false,
        error: `Member_Number class prefix "${classPrefix}" doesn't match Member_Class "${memberClass}"`
      }
    }
  }

  // If memberType is provided, validate it matches
  if (memberType) {
    let expectedPrefix = '00' // Community default
    if (memberType.toLowerCase().includes('annual')) expectedPrefix = '01'
    if (memberType.toLowerCase().includes('lifetime')) expectedPrefix = '02'

    if (typePrefix !== expectedPrefix) {
      return {
        isValid: false,
        error: `Member_Number type prefix "${typePrefix}" doesn't match Member_Type "${memberType}"`
      }
    }
  }

  return { isValid: true }
}

/**
 * Check if Member_Number already exists in database
 */
export async function isMemberNumberUnique(memberNumber: string): Promise<boolean> {
  if (!memberNumber || memberNumber.trim() === '') {
    return true // Empty is OK
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('membership_id', memberNumber.trim())
    .limit(1)

  if (error) {
    console.error('Error checking member number uniqueness:', error)
    return false // Assume not unique on error
  }

  return !data || data.length === 0
}

/**
 * Generate next available Member_Number for given class and type
 */
export async function generateMemberNumber(
  memberClass: 'Personal' | 'Business',
  memberType: 'Community' | 'Annual' | 'Lifetime'
): Promise<string> {
  const classPrefix = memberClass === 'Business' ? '21' : '11'

  let typePrefix = '00'
  if (memberType === 'Annual') typePrefix = '01'
  if (memberType === 'Lifetime') typePrefix = '02'

  const prefix = `${classPrefix}${typePrefix}`

  // Find highest sequence number for this prefix
  const supabase = createClient()
  const { data, error } = await supabase
    .from('members')
    .select('membership_id')
    .like('membership_id', `${prefix}%`)
    .order('membership_id', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error generating member number:', error)
    // Fallback to 0001
    return `${prefix}0001`
  }

  if (!data || data.length === 0) {
    // No existing members with this prefix
    return `${prefix}0001`
  }

  // Extract sequence number and increment
  const lastNumber = data[0].membership_id
  const lastSequence = parseInt(lastNumber.substring(4), 10)
  const nextSequence = lastSequence + 1

  // Pad to 4 digits
  const sequenceStr = nextSequence.toString().padStart(4, '0')

  return `${prefix}${sequenceStr}`
}

/**
 * Parse Mailing_Address into components
 * Format: "Street, City, State Zip, Country"
 * Example: "123 Main St, Jacksonville, FL 32256, USA"
 */
export function parseMailingAddress(mailingAddress: string): {
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  country: string
} {
  const result = {
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  }

  if (!mailingAddress || mailingAddress.trim() === '') {
    return result
  }

  try {
    // Split by commas
    const parts = mailingAddress.split(',').map(p => p.trim())

    if (parts.length < 2) {
      // Not enough parts, store as-is in address_line_1
      result.address_line_1 = mailingAddress.trim()
      return result
    }

    // First part is street address
    result.address_line_1 = parts[0]

    // Last part might be country
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1]
      // Check if last part looks like a country (alphabetic, 2-20 chars)
      if (/^[A-Za-z\s]{2,20}$/.test(lastPart)) {
        result.country = lastPart
        parts.pop() // Remove country from parts
      }
    }

    // Second to last part should contain State and Zip
    if (parts.length >= 2) {
      const stateZipPart = parts[parts.length - 1]
      // Extract state and zip from format like "FL 32256"
      const stateZipMatch = stateZipPart.match(/([A-Za-z\s]+)\s+(\d{5}(-\d{4})?)/)

      if (stateZipMatch) {
        result.state = stateZipMatch[1].trim()
        result.zip = stateZipMatch[2].trim()
        parts.pop() // Remove state/zip from parts
      }
    }

    // Remaining parts (if any) are city
    if (parts.length >= 2) {
      result.city = parts.slice(1).join(', ').trim()
    }

  } catch (error) {
    console.error('Error parsing mailing address:', error)
    // On error, store everything in address_line_1
    result.address_line_1 = mailingAddress.trim()
  }

  return result
}

/**
 * Check if a row is truly empty (all fields blank)
 */
export function isRowEmpty(row: any): boolean {
  if (!row) return true

  const values = Object.values(row) as string[]
  return !values.some(val => val && val.trim() !== '')
}
