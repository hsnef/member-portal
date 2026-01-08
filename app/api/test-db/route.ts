// ============================================================================
// Test Database Connection
// ============================================================================
// Verify Supabase connection and schema
// Only accessible in development mode

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createClient()

    // Test 1: Check connection
    const { error: connectionError } = await supabase
      .from('members')
      .select('count')
      .limit(0)

    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
      }, { status: 500 })
    }

    // Test 2: Check if tables exist
    const tables = [
      'members',
      'family_members',
      'memberships',
      'user_roles',
      'payments',
      'receipts',
      'requests',
      'events',
      'ledger_entries',
    ]

    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase.from(table).select('count').limit(0)
        return {
          table,
          exists: !error,
          error: error?.message,
        }
      })
    )

    // Test 3: Test MembershipID generation function
    const { data: functionTest, error: functionError } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .rpc('generate_membership_id', { p_level: 'Community' } as any)

    const allTablesExist = tableChecks.every((check) => check.exists)

    return NextResponse.json({
      success: allTablesExist && !functionError,
      connection: 'OK',
      database: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
        ? 'Supabase Cloud'
        : 'Local',
      tables: {
        total: tables.length,
        created: tableChecks.filter((t) => t.exists).length,
        details: tableChecks,
      },
      functions: {
        membershipIdGeneration: functionTest ? 'Working' : 'Failed',
        sampleId: functionTest,
        error: functionError?.message,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
