import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMember, isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { listMemberOpen, readZelleSettings, recipientView, requestView } from '@/lib/zelle/server'

/**
 * GET /api/zelle/request/<reference>: one request, for the member it belongs
 * to (or staff), with where to send the money.
 * GET /api/zelle/request/mine: the signed-in member's open requests.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params
  const member = await getCurrentMember()
  const staff = await isStaff()
  if (!member && !staff) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

  const db = createServiceClient()
  const recipient = recipientView(await readZelleSettings(db))

  if (reference === 'mine') {
    if (!member) return NextResponse.json({ requests: [], recipient })
    return NextResponse.json({ requests: await listMemberOpen(db, member.id), recipient })
  }

  const { data: req } = await db.from('zelle_requests').select('*').eq('reference_code', reference.toUpperCase()).maybeSingle()
  if (!req || (!staff && req.member_id !== member?.id)) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  const { data: transfers } = await db.from('zelle_transfers').select('amount').eq('request_id', req.id)
  const received = (transfers ?? []).reduce((s, t) => s + Number(t.amount), 0)
  return NextResponse.json({ request: requestView(req, received), recipient })
}
