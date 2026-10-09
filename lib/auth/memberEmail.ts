/**
 * The one rule for matching a sign-in address to a member record.
 *
 * Used by `/api/auth/check-member-email` (may this address ask for a link?)
 * and `/api/auth/link-member` (which records does this account own?). They
 * used to disagree — the check accepted the primary OR secondary address in
 * any case; linking accepted only the primary, exact case — so a member could
 * pass the check, sign in, and be thrown out as "not linked".
 *
 * The rule: the member's PRIMARY email, compared case-insensitively.
 *
 * Not the secondary address: `members.auth_user_id` holds ONE account, so if a
 * spouse's secondary address could link, it would take the household's only
 * login and lock the primary holder out. Two logins per household needs a
 * schema change; until then the check tells a secondary address what to do.
 */

/** Lower-cased, trimmed. Returns '' for anything that is not plausibly an email. */
export function normaliseEmail(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const email = raw.trim().toLowerCase()
  // Deliberately loose: one @, something either side, no whitespace.
  return /^[^\s@]+@[^\s@]+$/.test(email) ? email : ''
}

/**
 * The value for a PostgREST `ilike` that matches `email` exactly, ignoring
 * case. `%` and `_` are ilike wildcards and `\` is its escape, so all three are
 * escaped — otherwise "a_b@x.org" would also match "axb@x.org".
 *
 * Pass the result to `.ilike(column, value)`, which sends it as a parameter.
 * Never interpolate an address into an `.or()` string: commas and parentheses
 * in user input would rewrite the filter.
 */
export function exactIlike(email: string): string {
  return email.replace(/[\\%_]/g, (c) => `\\${c}`)
}
