/**
 * The `/join` application form, validated and shaped for the database.
 *
 * `/join` used to insert into `members` straight from the browser. That failed
 * for every applicant: the `members` INSERT policy only admits staff, and the
 * payload carried two columns `members` does not have (`business_type`,
 * `how_did_you_hear`). It also invented its own `membership_id`, racing the DB
 * trigger that already assigns one.
 *
 * Now the browser posts the form to `/api/join`, and this module is the only
 * place that decides which fields go where:
 *
 *   - `toPendingRow` — everything the applicant typed, for
 *     `pending_member_registrations` (it has every column, including notes and
 *     how they heard about us), for when the office approves applications.
 *   - `toMemberRow`  — only the columns `members` actually has, for when the
 *     office has turned approval off. No `membership_id`: the trigger assigns it.
 *
 * Pure, so it is tested without Supabase (`joinPayload.test.ts`).
 */

import { NAKSHATRAS } from '@/lib/constants/nakshatras'
import { normaliseEmail } from '@/lib/auth/memberEmail'
import type { Nakshatra } from '@/types/database'

export type MemberClass = 'Personal' | 'Business'
export type MembershipLevel = 'Community' | 'Annual' | 'Lifetime'

const CLASSES: readonly MemberClass[] = ['Personal', 'Business']
const LEVELS: readonly MembershipLevel[] = ['Community', 'Annual', 'Lifetime']

export interface JoinApplication {
  memberClass: MemberClass
  requestedLevel: MembershipLevel
  firstName: string
  lastName: string
  nakshatra: Nakshatra | null
  familyGotra: string | null
  secondaryFirstName: string | null
  secondaryLastName: string | null
  secondaryNakshatra: Nakshatra | null
  businessName: string | null
  businessEin: string | null
  businessType: string | null
  primaryEmail: string
  primaryPhone: string | null
  secondaryEmail: string | null
  secondaryPhone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zip: string | null
  howDidYouHear: string | null
  notes: string | null
  /** The terms the applicant ticked, if the page had them loaded. */
  termsVersion: string | null
  termsContentId: string | null
}

export type ParseResult =
  | { ok: true; value: JoinApplication }
  | { ok: false; error: string }

const MAX_TEXT = 500
const MAX_NOTES = 2000

/** Trimmed text, or null when empty or not a string. Caps runaway input. */
function text(v: unknown, max = MAX_TEXT): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

function nakshatra(v: unknown): Nakshatra | null | 'invalid' {
  const t = text(v)
  if (!t) return null
  return (NAKSHATRAS as string[]).includes(t) ? (t as Nakshatra) : 'invalid'
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseJoinPayload(body: unknown): ParseResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request' }
  const b = body as Record<string, unknown>

  const memberClass = b.memberClass as MemberClass
  if (!CLASSES.includes(memberClass)) return { ok: false, error: 'Choose a membership type' }

  const requestedLevel = b.requestedLevel as MembershipLevel
  if (!LEVELS.includes(requestedLevel)) return { ok: false, error: 'Choose a membership level' }

  const firstName = text(b.firstName)
  const lastName = text(b.lastName)
  if (!firstName || !lastName) return { ok: false, error: 'First and last name are required' }

  const businessName = text(b.businessName)
  if (memberClass === 'Business' && !businessName) {
    return { ok: false, error: 'Business name is required' }
  }

  const primaryEmail = normaliseEmail(b.primaryEmail)
  if (!primaryEmail) return { ok: false, error: 'A valid email address is required' }

  const secondaryEmailRaw = text(b.secondaryEmail)
  const secondaryEmail = secondaryEmailRaw ? normaliseEmail(secondaryEmailRaw) : null
  if (secondaryEmailRaw && !secondaryEmail) {
    return { ok: false, error: 'The secondary email address is not valid' }
  }
  if (secondaryEmail && secondaryEmail === primaryEmail) {
    return { ok: false, error: 'The secondary email must differ from the main one' }
  }

  if (b.termsAccepted !== true) {
    return { ok: false, error: 'You must accept the Terms of Use to continue' }
  }

  const star = nakshatra(b.nakshatra)
  if (star === 'invalid') return { ok: false, error: 'Choose a Nakshatra from the list' }

  const personal = memberClass === 'Personal'
  const includeSpouse = personal && b.includeSpouse === true
  const spouseStar = includeSpouse ? nakshatra(b.secondaryNakshatra) : null
  if (spouseStar === 'invalid') return { ok: false, error: 'Choose a Nakshatra from the list' }

  const termsContentId = text(b.termsContentId)

  return {
    ok: true,
    value: {
      memberClass,
      requestedLevel,
      firstName,
      lastName,
      nakshatra: star,
      familyGotra: personal ? text(b.familyGotra) : null,
      secondaryFirstName: includeSpouse ? text(b.secondaryFirstName) : null,
      secondaryLastName: includeSpouse ? text(b.secondaryLastName) : null,
      secondaryNakshatra: spouseStar,
      businessName: personal ? null : businessName,
      businessEin: personal ? null : text(b.businessEin),
      businessType: personal ? null : text(b.businessType),
      primaryEmail,
      primaryPhone: text(b.primaryPhone),
      secondaryEmail,
      secondaryPhone: text(b.secondaryPhone),
      addressLine1: text(b.addressLine1),
      addressLine2: text(b.addressLine2),
      city: text(b.city),
      state: text(b.state),
      zip: text(b.zip),
      howDidYouHear: text(b.howDidYouHear),
      notes: text(b.notes, MAX_NOTES),
      termsVersion: text(b.termsVersion),
      termsContentId: termsContentId && UUID.test(termsContentId) ? termsContentId : null,
    },
  }
}

/** Row for `pending_member_registrations` — the office approves it later. */
export function toPendingRow(a: JoinApplication) {
  return {
    member_class: a.memberClass,
    requested_level: a.requestedLevel,
    first_name: a.firstName,
    last_name: a.lastName,
    nakshatra: a.nakshatra,
    family_gotra: a.familyGotra,
    secondary_first_name: a.secondaryFirstName,
    secondary_last_name: a.secondaryLastName,
    secondary_nakshatra: a.secondaryNakshatra,
    business_name: a.businessName,
    business_ein: a.businessEin,
    business_type: a.businessType,
    primary_email: a.primaryEmail,
    primary_phone: a.primaryPhone,
    secondary_email: a.secondaryEmail,
    secondary_phone: a.secondaryPhone,
    address_line_1: a.addressLine1,
    address_line_2: a.addressLine2,
    city: a.city,
    state: a.state,
    zip: a.zip,
    how_did_you_hear: a.howDidYouHear,
    notes: a.notes,
    terms_accepted: true,
    terms_version: a.termsVersion,
    terms_content_id: a.termsContentId,
  }
}

/**
 * Row for `members` — approval is off, so the member exists at once.
 * Only columns `members` has. `membership_id` is left to the DB trigger.
 * `business_type`, `how_did_you_hear` and `notes` have no home on `members`.
 */
export function toMemberRow(a: JoinApplication) {
  return {
    member_class: a.memberClass,
    current_level: a.requestedLevel,
    first_name: a.firstName,
    last_name: a.lastName,
    nakshatra: a.nakshatra,
    family_gotra: a.familyGotra,
    secondary_first_name: a.secondaryFirstName,
    secondary_last_name: a.secondaryLastName,
    secondary_nakshatra: a.secondaryNakshatra,
    business_name: a.businessName,
    business_ein: a.businessEin,
    primary_email: a.primaryEmail,
    primary_phone: a.primaryPhone,
    secondary_email: a.secondaryEmail,
    secondary_phone: a.secondaryPhone,
    address_line_1: a.addressLine1,
    address_line_2: a.addressLine2,
    city: a.city,
    state: a.state,
    zip: a.zip,
  }
}
