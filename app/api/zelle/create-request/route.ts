import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMember } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { parseCheckoutItem } from '@/lib/payments/checkout'
import { openZelleRequest, readZelleSettings, recipientView, requestView } from '@/lib/zelle/server'

/**
 * A member chooses Zelle for an item: { item } as for a card checkout. The
 * server prices it and opens a request (or returns the open one for the same
 * item), and emails the instructions. Returns the request and where to send.
 */
export async function POST(request: NextRequest) {
  const member = await getCurrentMember()
  if (!member) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const item = parseCheckoutItem(await request.json().catch(() => null))
  if (!item) return NextResponse.json({ error: 'Nothing to pay for' }, { status: 400 })

  const db = createServiceClient()
  const out = await openZelleRequest({ db }, member, item, member.auth_user_id)
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status })
  return NextResponse.json({
    request: requestView(out.request),
    reused: out.reused,
    recipient: recipientView(await readZelleSettings(db)),
  })
}
