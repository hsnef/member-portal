/**
 * Temple Configuration Constants
 *
 * These values are used throughout the application for branding,
 * receipts, invoices, and official communications.
 */

export const TEMPLE_CONFIG = {
  // Organization Details
  name: 'Hindu Society of North East Florida',
  shortName: 'HSNEF',

  // Tax Information - Update this with the actual EIN
  taxId: '59-2742302', // HSNEF Federal Tax ID (EIN)
  taxExemptStatus: '501(c)(3) nonprofit organization',

  // Address
  address: {
    line1: '4968 Greenland Road',
    city: 'Jacksonville',
    state: 'FL',
    zip: '32258',
    country: 'USA',
    full: '4968 Greenland Road, Jacksonville, FL 32258',
  },

  // Contact Information
  contact: {
    phone: '(904) 268-7630',
    email: 'office@hsnef.org',
    website: 'https://www.hsnef.org',
    memberPortal: 'https://member.hsnef.org',
  },

  // Branding colours.
  // These mirror the design system tokens in app/globals.css. Prefer the
  // Tailwind token classes (bg-saffron, text-kumkum) in the app; these
  // literals exist for surfaces that cannot read CSS variables.
  colors: {
    primary: '#c75b12',     // saffron
    primaryDark: '#a94a0c', // saffron-hover
    maroon: '#7b2d26',      // kumkum
    gold: '#c9962c',        // gold
  },

  // Receipt/Invoice Messaging
  messaging: {
    taxDeductible: 'This donation is tax-deductible to the extent allowed by law. Please retain this receipt for your tax records.',
    thankYou: 'Thank you for your support!',
    contactFooter: 'For questions about this receipt, please contact the temple office.',
  },
}

// Export individual items for convenience
export const TEMPLE_NAME = TEMPLE_CONFIG.name
export const TEMPLE_SHORT_NAME = TEMPLE_CONFIG.shortName
export const TEMPLE_TAX_ID = TEMPLE_CONFIG.taxId
export const TEMPLE_ADDRESS = TEMPLE_CONFIG.address
export const TEMPLE_CONTACT = TEMPLE_CONFIG.contact
