import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { runDailyZelle } from '@/lib/zelle/server'
import { runMembershipExpiry } from '@/lib/membership/pass'

/**
 * The daily job (vercel.json, 13:00 UTC):
 * - Zelle: one reminder, expiry (releasing held event places), and event
 *   places held by card checkouts abandoned for a day (lib/zelle/server.ts).
 * - Membership: Annual memberships past their end date expire, and members
 *   with no current Annual membership go back to Community (lib/membership/pass.ts).
 * Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`. Each part
 * runs even if the other fails.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createServiceClient()
  const [zelle, membership] = await Promise.allSettled([runDailyZelle({ db }), runMembershipExpiry(db)])
  const result = {
    zelle: zelle.status === 'fulfilled' ? zelle.value : { error: String(zelle.reason) },
    membership: membership.status === 'fulfilled' ? membership.value : { error: String(membership.reason) },
  }
  console.log('[cron daily]', JSON.stringify(result))
  const failed = zelle.status === 'rejected' || membership.status === 'rejected'
  return NextResponse.json(result, { status: failed ? 500 : 200 })
}
