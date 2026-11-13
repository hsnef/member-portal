import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { analyzeBankFile, applyBankDecisions, type BankDecision } from '@/lib/zelle/server'

/**
 * The bank's transaction file. Staff only.
 *   POST { csv }        read it and match rows to open requests (changes nothing)
 *   PUT  { decisions }  confirm the chosen rows / mark the rest as not ours
 */
async function staffUser() {
  const user = await getCurrentUser()
  if (!user) return { error: NextResponse.json({ error: 'Please sign in' }, { status: 401 }) }
  if (!(await isStaff())) return { error: NextResponse.json({ error: 'Only office staff' }, { status: 403 }) }
  return { user }
}

export async function POST(request: NextRequest) {
  const s = await staffUser()
  if ('error' in s) return s.error
  const { csv } = (await request.json().catch(() => ({}))) as { csv?: unknown }
  if (typeof csv !== 'string' || csv.length === 0) return NextResponse.json({ error: 'Choose the bank file' }, { status: 400 })
  if (csv.length > 5_000_000) return NextResponse.json({ error: 'The file is too large' }, { status: 400 })
  const out = await analyzeBankFile(createServiceClient(), csv)
  return NextResponse.json(out, { status: out.ok ? 200 : out.status })
}

export async function PUT(request: NextRequest) {
  const s = await staffUser()
  if ('error' in s) return s.error
  const { decisions } = (await request.json().catch(() => ({}))) as { decisions?: unknown }
  if (!Array.isArray(decisions) || decisions.length === 0) return NextResponse.json({ error: 'Nothing chosen' }, { status: 400 })
  const clean: BankDecision[] = decisions
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
    .filter((d) => typeof d.hash === 'string' && Number(d.amount) > 0)
    .map((d) => ({
      hash: d.hash as string,
      postedOn: typeof d.postedOn === 'string' ? d.postedOn : null,
      amount: Number(d.amount),
      memo: String(d.memo ?? '').slice(0, 300),
      sender: String(d.sender ?? '').slice(0, 200),
      requestId: typeof d.requestId === 'string' ? d.requestId : null,
    }))
  const results = await applyBankDecisions({ db: createServiceClient() }, s.user.id, clean)
  return NextResponse.json({ results })
}
