import { describe, expect, it } from 'vitest'
import { parseJoinPayload, toMemberRow, toPendingRow } from './joinPayload'

const TERMS_ID = '1b4e28ba-2fa1-11d2-883f-0016d3cca427'

const valid = (over: Record<string, unknown> = {}) => ({
  memberClass: 'Personal',
  requestedLevel: 'Annual',
  firstName: ' Asha ',
  lastName: 'Rao',
  primaryEmail: ' Asha.Rao@Example.org ',
  nakshatra: 'Rohini',
  howDidYouHear: 'Temple Visit',
  notes: 'Looking forward to it',
  businessType: 'Retail',
  termsAccepted: true,
  termsVersion: '1.0',
  termsContentId: TERMS_ID,
  ...over,
})

function parsed(over: Record<string, unknown> = {}) {
  const r = parseJoinPayload(valid(over))
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('parseJoinPayload', () => {
  it('accepts a personal application, trimming names and normalising the email', () => {
    const a = parsed()
    expect(a.firstName).toBe('Asha')
    expect(a.primaryEmail).toBe('asha.rao@example.org')
    expect(a.nakshatra).toBe('Rohini')
  })

  it.each([
    [{ firstName: '' }, /name/],
    [{ primaryEmail: 'not-an-email' }, /email/],
    [{ termsAccepted: false }, /Terms/],
    [{ memberClass: 'Corporate' }, /membership type/],
    [{ requestedLevel: 'Platinum' }, /membership level/],
    [{ memberClass: 'Business', businessName: '' }, /Business name/],
    [{ nakshatra: 'Sirius' }, /Nakshatra/],
    [{ secondaryEmail: 'asha.rao@example.org' }, /differ/],
  ])('refuses %o', (over, message) => {
    const r = parseJoinPayload(valid(over))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(message)
  })

  it('refuses a body that is not an object', () => {
    expect(parseJoinPayload(null).ok).toBe(false)
    expect(parseJoinPayload('x').ok).toBe(false)
  })

  it('drops spouse fields unless the spouse box is ticked, and business fields for Personal', () => {
    const a = parsed({ secondaryFirstName: 'Ravi', businessName: 'Shop' })
    expect(a.secondaryFirstName).toBeNull()
    expect(a.businessName).toBeNull()
    expect(a.businessType).toBeNull()
    expect(parsed({ includeSpouse: true, secondaryFirstName: 'Ravi' }).secondaryFirstName).toBe('Ravi')
  })

  it('ignores a terms id that is not a UUID', () => {
    expect(parsed({ termsContentId: "x'; drop" }).termsContentId).toBeNull()
  })
})

describe('row shapes', () => {
  // Columns `members` really has (dev-mp, 2026-11-11). /join used to send
  // `business_type` and `how_did_you_hear`, which it does not.
  const MEMBER_COLUMNS = new Set([
    'member_class', 'current_level', 'requested_level', 'first_name', 'last_name', 'nakshatra', 'family_gotra',
    'secondary_first_name', 'secondary_last_name', 'secondary_nakshatra', 'business_name',
    'business_ein', 'primary_email', 'primary_phone', 'secondary_email', 'secondary_phone',
    'address_line_1', 'address_line_2', 'city', 'state', 'zip',
  ])

  it('toMemberRow writes only real `members` columns and leaves membership_id to the trigger', () => {
    const row = toMemberRow(parsed({ memberClass: 'Business', businessName: 'Shop' }))
    for (const key of Object.keys(row)) expect(MEMBER_COLUMNS.has(key), key).toBe(true)
    expect(row).not.toHaveProperty('membership_id')
    // Asked for Annual: starts Community, Annual remembered until paid.
    expect(row.current_level).toBe('Community')
    expect(row.requested_level).toBe('Annual')
    expect(toMemberRow(parsed({ requestedLevel: 'Community' })).requested_level).toBeNull()
  })

  it('toPendingRow keeps everything the applicant typed, with the terms they accepted', () => {
    const row = toPendingRow(parsed({ memberClass: 'Business', businessName: 'Shop' }))
    expect(row.requested_level).toBe('Annual')
    expect(row.how_did_you_hear).toBe('Temple Visit')
    expect(row.business_type).toBe('Retail')
    expect(row.notes).toBe('Looking forward to it')
    expect(row.terms_accepted).toBe(true)
    expect(row.terms_content_id).toBe(TERMS_ID)
  })
})
