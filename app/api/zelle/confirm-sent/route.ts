import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { markSent, requestView } from '@/lib/zelle/server'

/** The member says they sent it: { requestId, bankReference? }. The office is alerted. */
export async function POST(request: NextRequest) {
  const member = await getCurrentMember()
  if (!member) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { requestId?: unknown; bankReference?: unknown }
  if (typeof body.requestId !== 'string') return NextResponse.json({ error: 'Payment not found' }, { status: 400 })

  const out = await markSent(
    { db: createServiceClient() },
    member.id,
    body.requestId,
    typeof body.bankReference === 'string' ? body.bankReference : null,
  )
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status })
  return NextResponse.json({ request: requestView(out.request) })
}
