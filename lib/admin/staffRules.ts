/**
 * Staff-role rules shared by the Staff roles page (browser) and
 * /api/admin/staff (server). Pure: no Supabase, no keys.
 */

const STAFF_ROLES = ['Admin', 'Office Manager', 'Office Staff'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value)
}

/**
 * Whether removing `role` from `userId` would leave no Admin who is not a test
 * account. The portal must always have one: only an Admin can grant roles.
 */
export function wouldRemoveLastAdmin(
  staff: Array<{ user_id: string; roles: string[]; is_test_account: boolean }>,
  userId: string,
  role: string
): boolean {
  if (role !== 'Admin') return false
  const realAdmins = staff.filter((s) => s.roles.includes('Admin') && !s.is_test_account)
  return realAdmins.length === 1 && realAdmins[0].user_id === userId
}
