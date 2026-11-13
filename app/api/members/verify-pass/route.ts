import { NextRequest, NextResponse } from 'next/server'
import { isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { lookupPass } from '@/lib/membership/pass'

/**
 * Staff check a membership pass: GET ?token=<scanned token> or ?memberId=<id>
 * (desk lookup). The token's signature is checked here, on the server, where
 * the secret is. Returns the member, their family and their standing today
 * ("Annual member, valid to December 31, 2026", "Lifetime member, no expiry"...).
 */
export async function GET(request: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: 'Only office staff can check passes' }, { status: 403 })
  const token = request.nextUrl.searchParams.get('token') ?? undefined
  const memberId = request.nextUrl.searchParams.get('memberId') ?? undefined
  const out = await lookupPass(createServiceClient(), { token, memberId })
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status })
  return NextResponse.json(out.pass)
}
