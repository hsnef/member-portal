/**
 * Utility functions for formatting form input values
 */

/**
 * Format phone number as (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Limit to 10 digits
  const limited = digits.slice(0, 10)

  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Format EIN as XX-XXXXXXX
 */
export function formatEIN(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Limit to 9 digits
  const limited = digits.slice(0, 9)

  // Format with hyphen after first 2 digits
  if (limited.length <= 2) return limited
  return `${limited.slice(0, 2)}-${limited.slice(2)}`
}

/**
 * Format ZIP code as XXXXX or XXXXX-XXXX
 */
export function formatZipCode(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Limit to 9 digits
  const limited = digits.slice(0, 9)

  // Format with hyphen after first 5 digits if more than 5
  if (limited.length <= 5) return limited
  return `${limited.slice(0, 5)}-${limited.slice(5)}`
}

/**
 * Unformat phone number (remove formatting)
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Unformat EIN (remove formatting)
 */
export function unformatEIN(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Unformat ZIP code (remove formatting)
 */
export function unformatZipCode(value: string): string {
  return value.replace(/\D/g, '')
}
