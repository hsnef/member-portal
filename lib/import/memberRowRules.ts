/**
 * Rules for one row of the member import CSV (`/admin/members/import`).
 *
 * Decided 2026-11-11 (Sujit): the temple sends its data in OUR template, and a
 * row that does not fit is refused with a reason, not guessed at. Except for
 * membership numbers: EVERY imported member gets a new number from the
 * database (1/2/3 + five digits + 00, DEC-012), and whatever number the file
 * carries is kept as the member's legacy ID. This follows the original brief
 * (docs/reference/hsnef-membership-portal-final-prompt-v3.md §2.1.2).
 *
 * The importer used to validate numbers against a different scheme
 * ("XXYYZZZZ": 11/21 class + 00/01/02 type) that the database rejects, and it
 * read an unrecognised level as Community without saying so.
 */

import { NAKSHATRAS } from '@/lib/constants/nakshatras'
import type { Nakshatra } from '@/types/database'

export type MemberLevel = 'Community' | 'Annual' | 'Lifetime'
export type MemberClass = 'Personal' | 'Business'

/** Accepted spellings for Member_Type, case-insensitive. */
const LEVELS: Record<string, MemberLevel> = {
  community: 'Community',
  annual: 'Annual',
  lifetime: 'Lifetime',
}

/** Accepted spellings for Member_Class. Blank means Personal (the default model). */
const CLASSES: Record<string, MemberClass> = {
  '': 'Personal',
  personal: 'Personal',
  individual: 'Personal',
  family: 'Personal',
  business: 'Business',
  corporate: 'Business',
}

export const ACCEPTED_LEVELS = ['Community', 'Annual', 'Lifetime'] as const
export const ACCEPTED_CLASSES = ['Personal (or Individual, Family)', 'Business (or Corporate)'] as const

/** The level, or null when blank or not one of the three. */
export function parseMemberLevel(raw: string | undefined): MemberLevel | null {
  return LEVELS[(raw ?? '').trim().toLowerCase()] ?? null
}

/** The class, or null when it is something we do not accept. */
export function parseMemberClass(raw: string | undefined): MemberClass | null {
  return CLASSES[(raw ?? '').trim().toLowerCase()] ?? null
}

/**
 * The Nakshatra in its canonical spelling, null when blank, or 'invalid'.
 * Case-insensitive, so "rohini" imports as "Rohini". `members.nakshatra` is an
 * enum, so anything else would fail the insert.
 */
export function parseNakshatra(raw: string | undefined): Nakshatra | null | 'invalid' {
  const t = (raw ?? '').trim()
  if (!t) return null
  const hit = NAKSHATRAS.find((n) => n.toLowerCase() === t.toLowerCase())
  return hit ?? 'invalid'
}

/**
 * The file's own member number, kept as `legacy_id` for traceability. Never
 * used as the membership number.
 */
export function legacyMemberNumber(raw: string | undefined): string | null {
  const t = (raw ?? '').trim()
  return t ? t.slice(0, 50) : null
}
