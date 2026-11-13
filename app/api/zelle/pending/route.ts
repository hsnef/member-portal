import { NextResponse } from 'next/server'
import { isStaff } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { listQueue } from '@/lib/zelle/server'

/** The office Zelle queue: open requests, then those closed in the last 60 days. Staff only. */
export async function GET() {
  if (!(await isStaff())) return NextResponse.json({ error: 'Only office staff' }, { status: 403 })
  return NextResponse.json({ requests: await listQueue(createServiceClient()) })
}
