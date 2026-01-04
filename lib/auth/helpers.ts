// ============================================================================
// Authentication Helper Functions
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { UserRole, Member } from '@/types/database'

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get the current user's member record
 */
export async function getCurrentMember() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (error) {
    return null
  }

  return member
}

/**
 * Get the current user's roles
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  if (error || !roles) {
    return []
  }

  return roles.map((r: { role: UserRole }) => r.role)
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const roles = await getCurrentUserRoles()
  return roles.includes(requiredRole)
}

/**
 * Check if current user has any of the specified roles
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  const roles = await getCurrentUserRoles()
  return requiredRoles.some(role => roles.includes(role))
}

/**
 * Check if current user is staff (Office Staff, Office Manager, or Admin)
 */
export async function isStaff(): Promise<boolean> {
  return hasAnyRole(['Office Staff', 'Office Manager', 'Admin'])
}

/**
 * Check if current user is manager or admin
 */
export async function isManagerOrAdmin(): Promise<boolean> {
  return hasAnyRole(['Office Manager', 'Admin'])
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('Admin')
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export async function requireRole(requiredRole: UserRole) {
  await requireAuth()
  const userHasRole = await hasRole(requiredRole)
  if (!userHasRole) {
    throw new Error(`${requiredRole} role required`)
  }
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(requiredRoles: UserRole[]) {
  await requireAuth()
  const userHasRole = await hasAnyRole(requiredRoles)
  if (!userHasRole) {
    throw new Error(`One of the following roles required: ${requiredRoles.join(', ')}`)
  }
}

/**
 * Get member by membership ID
 */
export async function getMemberByMembershipId(membershipId: string): Promise<Member | null> {
  const supabase = await createClient()

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('membership_id', membershipId)
    .single()

  if (error) {
    return null
  }

  return member
}

/**
 * Login with membership number
 * This requires custom implementation with Supabase Auth
 */
export async function loginWithMembershipNumber(
  membershipId: string,
  password: string
) {
  const supabase = await createClient()

  // First, get the member's email by membership ID
  const member = await getMemberByMembershipId(membershipId)

  if (!member || !member.primary_email) {
    return { error: 'Invalid membership number' }
  }

  // Then authenticate with email/password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: member.primary_email,
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { data, error: null }
}
