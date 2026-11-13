import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMember, getCurrentUser, isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { cancelRequest } from '@/lib/zelle/server'

/**
 * Cancel an open Zelle request: { requestId, reason? }. A member may cancel
 * their own; office staff may cancel any. A held event place is released.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { requestId?: unknown; reason?: unknown }
  if (typeof body.requestId !== 'string') return NextResponse.json({ error: 'Payment not found' }, { status: 400 })
  const reason = typeof body.reason === 'string' ? body.reason : undefined

  const staff = await isStaff()
  const by = staff ? { staffId: user.id } : { memberId: (await getCurrentMember())?.id ?? '__none__' }
  const out = await cancelRequest({ db: createServiceClient() }, body.requestId, by, reason)
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status })
  return NextResponse.json({ ok: true })
}
