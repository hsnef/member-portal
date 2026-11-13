import { NextRequest, NextResponse } from 'next/server'
import { isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { listOpenItems } from '@/lib/payments/office'

/** GET ?memberId= : what this member could pay for at the counter, priced. Staff only. */
export async function GET(request: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: 'Only office staff' }, { status: 403 })
  const memberId = request.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Choose a member' }, { status: 400 })
  const items = await listOpenItems(createServiceClient(), memberId)
  if (!items) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  return NextResponse.json(items)
}
