import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Cron job to cleanup login logs older than 1 year
 *
 * This endpoint should be called by Vercel Cron or external scheduler
 * Configured in vercel.json: "0 2 * * *" (daily at 2 AM)
 *
 * Security: Requires CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    // Check authorization header
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron job attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Call the cleanup function
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('cleanup_old_login_logs')

    if (error) {
      console.error('Error running cleanup function:', error)
      return NextResponse.json(
        {
          error: 'Cleanup failed',
          message: error.message,
          success: false,
        },
        { status: 500 }
      )
    }

    const deletedCount = data?.[0]?.deleted_count || 0

    console.log(`Cleanup completed successfully. Deleted ${deletedCount} login log records.`)

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} login log records older than 1 year`,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    )
  }
}
