/**
 * Whether the member home should send this account on to the office console.
 *
 * Staff sign in to `/member` like everyone else. A staff account need not have
 * a membership (it is the office); with none, the member home has nothing to
 * show, so it goes to `/admin`. A staff member who IS a member stays on their
 * member home. Decided only once both the auth state and the member lookup
 * have finished, so a slow load never bounces a real member.
 */
export function shouldSendToOfficeConsole(s: {
  authLoading: boolean
  memberLoading: boolean
  hasMembership: boolean
  isStaff: boolean
}): boolean {
  return !s.authLoading && !s.memberLoading && !s.hasMembership && s.isStaff
}
