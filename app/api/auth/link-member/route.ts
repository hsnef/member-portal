import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/client'

/**
 * API endpoint to auto-link an authenticated user to their member record
 * This bypasses RLS by using the service role client
 */
export async function POST(request: Request) {
  try {
    // Get the authenticated user from the request
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userEmail = user.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User has no email' },
        { status: 400 }
      )
    }

    console.log('[link-member] Attempting to link user:', user.id, 'email:', userEmail)

    // Use service client to bypass RLS
    const serviceClient = createServiceClient()

    // Check if user is already linked to a member
    const { data: existingMember, error: existingError } = await serviceClient
      .from('members')
      .select('id, membership_id, primary_email')
      .eq('auth_user_id', user.id)
      .single()

    if (existingMember) {
      console.log('[link-member] User already linked to member:', existingMember.id)
      return NextResponse.json({
        success: true,
        message: 'Already linked',
        member: existingMember
      })
    }

    // Look for member with matching email but no auth_user_id
    const { data: unlinkedMember, error: lookupError } = await serviceClient
      .from('members')
      .select('id, membership_id, primary_email, first_name, last_name')
      .eq('primary_email', userEmail)
      .is('auth_user_id', null)
      .single()

    if (lookupError || !unlinkedMember) {
      console.log('[link-member] No unlinked member found for email:', userEmail, lookupError?.message)
      return NextResponse.json(
        { error: 'No member record found for this email', details: lookupError?.message },
        { status: 404 }
      )
    }

    console.log('[link-member] Found unlinked member:', unlinkedMember.id)

    // Link the member to this auth user
    const { error: updateError } = await serviceClient
      .from('members')
      .update({ auth_user_id: user.id })
      .eq('id', unlinkedMember.id)

    if (updateError) {
      console.error('[link-member] Error linking member:', updateError)
      return NextResponse.json(
        { error: 'Failed to link member', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('[link-member] Successfully linked member:', unlinkedMember.id, 'to user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'Member linked successfully',
      member: {
        id: unlinkedMember.id,
        membership_id: unlinkedMember.membership_id,
        name: `${unlinkedMember.first_name} ${unlinkedMember.last_name}`.trim()
      }
    })

  } catch (error) {
    console.error('[link-member] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
