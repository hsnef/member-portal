import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { runDailyZelle } from '@/lib/zelle/server'

/**
 * Daily (vercel.json): Zelle reminders, expiry (releasing held event places),
 * and event places held by card checkouts abandoned for a day.
 * Called by Vercel Cron with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runDailyZelle({ db: createServiceClient() })
    console.log('[cron zelle]', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[cron zelle] failed', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
