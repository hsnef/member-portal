import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { finishIfPaid, markNotReceived, recordReceived } from '@/lib/zelle/server'

/**
 * Office staff act on a Zelle request. Body { requestId, action }:
 *   action 'received': { amount, receivedOn?, bankReference?, submissionId, extra?: 'donation' | 'refund' }
 *     records what arrived; settles when the full amount is in.
 *   action 'finish':   settles a request whose money is all in (after an earlier failure).
 *   action 'not_received': { reason } tells the member nothing arrived.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  if (!(await isStaff())) return NextResponse.json({ error: 'Only office staff can confirm Zelle payments' }, { status: 403 })

  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (typeof b.requestId !== 'string') return NextResponse.json({ error: 'Payment not found' }, { status: 400 })
  const deps = { db: createServiceClient() }
  const extra = b.extra === 'donation' ? 'donation' : 'refund'

  let out
  switch (b.action) {
    case 'received': {
      const amount = Number(b.amount)
      if (!(amount > 0)) return NextResponse.json({ error: 'Enter the amount that arrived' }, { status: 400 })
      if (typeof b.submissionId !== 'string' || !b.submissionId) {
        return NextResponse.json({ error: 'Missing form id; reload the page' }, { status: 400 })
      }
      out = await recordReceived(deps, user.id, {
        requestId: b.requestId,
        amount,
        receivedOn: typeof b.receivedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.receivedOn) ? b.receivedOn : null,
        bankReference: typeof b.bankReference === 'string' ? b.bankReference : null,
        submissionId: b.submissionId,
        extra,
      })
      break
    }
    case 'finish':
      out = await finishIfPaid(deps, user.id, b.requestId, extra)
      break
    case 'not_received':
      out = await markNotReceived(deps, user.id, b.requestId, typeof b.reason === 'string' ? b.reason : '')
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: out.status })
  return NextResponse.json(out)
}
