/**
 * The membership pass, on the server: what staff see when they scan a pass or
 * look a member up at the desk, and the daily membership expiry. Service-role
 * client; the route checks the caller is staff.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, FamilyMember, Member } from '@/types/database'
import { verifyQRToken } from '@/lib/qr-token'
import { standing, templeToday, type Standing } from './standing'

type Client = SupabaseClient<Database>

export interface PassView {
  member: Member
  familyMembers: FamilyMember[]
  standing: Standing
}

export type PassOutcome = { ok: true; pass: PassView } | { ok: false; status: number; error: string }

/** Look a member up by a scanned pass token, or by id (desk lookup). */
export async function lookupPass(db: Client, by: { token?: string; memberId?: string }, today = templeToday()): Promise<PassOutcome> {
  let memberId = by.memberId
  if (by.token) {
    try {
      memberId = verifyQRToken(by.token).memberId
    } catch (e) {
      return { ok: false, status: 400, error: e instanceof Error ? e.message : 'Invalid QR code' }
    }
  }
  if (!memberId) return { ok: false, status: 400, error: 'Scan a pass or choose a member' }

  const { data: member } = await db.from('members').select('*').eq('id', memberId).maybeSingle()
  if (!member) return { ok: false, status: 404, error: 'This pass does not match a member. It may belong to a deleted record.' }

  const [{ data: rows }, { data: family }] = await Promise.all([
    db.from('memberships').select('level, status, start_date, end_date').eq('member_id', memberId),
    member.member_class === 'Personal'
      ? db.from('family_members').select('*').eq('member_id', memberId).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as FamilyMember[] }),
  ])
  return {
    ok: true,
    pass: { member, familyMembers: (family ?? []) as FamilyMember[], standing: standing(member.current_level, rows ?? [], today) },
  }
}

export interface ExpiryResult {
  membershipsExpired: number
  membersMovedToCommunity: number
}

/**
 * Every day: Annual memberships past their end date are marked Expired, and
 * an Annual member with no current or future Annual membership goes back to
 * Community (with a Community number; decided 2026-11-11). Members with no
 * membership rows at all (imported without dates) are left as they are.
 */
export async function runMembershipExpiry(db: Client, today = templeToday()): Promise<ExpiryResult> {
  const result: ExpiryResult = { membershipsExpired: 0, membersMovedToCommunity: 0 }

  const { data: ended } = await db
    .from('memberships')
    .update({ status: 'Expired' })
    .eq('level', 'Annual')
    .eq('status', 'Active')
    .lt('end_date', today)
    .select('member_id')
  result.membershipsExpired = ended?.length ?? 0

  const candidates = [...new Set((ended ?? []).map((r) => r.member_id))]
  for (const memberId of candidates) {
    const { data: member } = await db.from('members').select('current_level').eq('id', memberId).single()
    if (member?.current_level !== 'Annual') continue
    const { count } = await db
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', memberId)
      .eq('level', 'Annual')
      .eq('status', 'Active')
      .gte('end_date', today)
    if ((count ?? 0) > 0) continue
    const { error } = await db.rpc('set_member_level', { p_member_id: memberId, p_level: 'Community' })
    if (error) console.error('[membership expiry] could not move to Community', memberId, error.message)
    else result.membersMovedToCommunity++
  }
  return result
}
