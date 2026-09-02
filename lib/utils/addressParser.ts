/**
 * Parse a full address string into components
 * Format: "Street Address, City, State ZipCode"
 * Example: "94 Birchfield Ln, St. Augustine, FL 32092"
 */
export function parseAddress(fullAddress: string): {
  address_line_1: string
  city: string
  state: string
  zip: string
} {
  // Default values
  const result = {
    address_line_1: '',
    city: '',
    state: '',
    zip: '',
  }

  if (!fullAddress || fullAddress.trim() === '') {
    return result
  }

  try {
    // Split by commas
    const parts = fullAddress.split(',').map(p => p.trim())

    if (parts.length < 2) {
      // Not enough parts, return address as-is
      result.address_line_1 = fullAddress.trim()
      return result
    }

    // First part is street address
    result.address_line_1 = parts[0]

    // Last part should contain state and zip
    const lastPart = parts[parts.length - 1]

    // Extract state and zip from last part
    // Format: "FL 32092" or "Florida 32092"
    const stateZipMatch = lastPart.match(/([A-Za-z\s]+)\s+(\d{5}(-\d{4})?)/)

    if (stateZipMatch) {
      result.state = stateZipMatch[1].trim()
      result.zip = stateZipMatch[2].trim()
    }

    // City is everything between first and last part
    if (parts.length === 3) {
      result.city = parts[1].trim()
    } else if (parts.length > 3) {
      // Multiple commas, join middle parts as city
      result.city = parts.slice(1, -1).join(', ').trim()
    }

    // If city wasn't found and we have state/zip, try to extract city from last part
    if (!result.city && stateZipMatch) {
      const cityFromLast = lastPart.substring(0, lastPart.indexOf(stateZipMatch[0])).trim()
      if (cityFromLast) {
        result.city = cityFromLast
      }
    }

  } catch (error) {
    console.error('Error parsing address:', error)
    // On error, put everything in address_line_1
    result.address_line_1 = fullAddress.trim()
  }

  return result
}

/**
 * Parse and normalize phone number with international support
 * - Detects existing country codes (keeps them)
 * - Adds +1 (US) if no country code present
 * - Returns normalized format: +1234567890
 */
export function parsePhone(phone: string): string {
  if (!phone) return ''

  // Remove all non-digit characters except leading +
  const cleaned = phone.trim().replace(/[^\d+]/g, '')

  if (!cleaned) return ''

  // If already has country code (starts with +)
  if (cleaned.startsWith('+')) {
    return cleaned
  }

  // If starts with 1 and has 11 digits total (US number with country code without +)
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`
  }

  // Otherwise, add +1 (US country code) as default
  return `+1${cleaned}`
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateStr: string): string | null {
  if (!dateStr) return null

  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD
  } catch {
    return null
  }
}
