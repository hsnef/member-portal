import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/client'

/**
 * API endpoint to auto-link an authenticated user to their member record(s)
 * Supports multiple memberships per email - links ALL matching members
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

    // Check if user is already linked to any members
    const { data: existingMembers, error: existingError } = await serviceClient
      .from('members')
      .select('id, membership_id, primary_email, first_name, last_name, member_class, current_level')
      .eq('auth_user_id', user.id)

    if (existingMembers && existingMembers.length > 0) {
      console.log('[link-member] User already linked to', existingMembers.length, 'member(s)')

      // Check if there are any NEW unlinked members with same email to add
      const { data: additionalUnlinked } = await serviceClient
        .from('members')
        .select('id, membership_id, primary_email, first_name, last_name, member_class, current_level')
        .eq('primary_email', userEmail)
        .is('auth_user_id', null)

      if (additionalUnlinked && additionalUnlinked.length > 0) {
        // Link additional members
        const newlyLinked = []
        for (const member of additionalUnlinked) {
          const { error: updateError } = await serviceClient
            .from('members')
            .update({ auth_user_id: user.id })
            .eq('id', member.id)

          if (!updateError) {
            newlyLinked.push(member)
            console.log('[link-member] Linked additional member:', member.id, member.membership_id)
          }
        }

        return NextResponse.json({
          success: true,
          message: `Already had ${existingMembers.length} membership(s), linked ${newlyLinked.length} more`,
          members: [...existingMembers, ...newlyLinked],
          count: existingMembers.length + newlyLinked.length
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Already linked',
        members: existingMembers,
        count: existingMembers.length
      })
    }

    // Look for ALL members with matching email but no auth_user_id
    const { data: unlinkedMembers, error: lookupError } = await serviceClient
      .from('members')
      .select('id, membership_id, primary_email, first_name, last_name, member_class, current_level')
      .eq('primary_email', userEmail)
      .is('auth_user_id', null)

    if (lookupError || !unlinkedMembers || unlinkedMembers.length === 0) {
      console.log('[link-member] No unlinked member found for email:', userEmail, lookupError?.message)
      return NextResponse.json(
        { error: 'No member record found for this email', details: lookupError?.message },
        { status: 404 }
      )
    }

    console.log('[link-member] Found', unlinkedMembers.length, 'unlinked member(s)')

    // Link ALL members to this auth user
    const linkedMembers = []
    for (const member of unlinkedMembers) {
      const { error: updateError } = await serviceClient
        .from('members')
        .update({ auth_user_id: user.id })
        .eq('id', member.id)

      if (updateError) {
        console.error('[link-member] Error linking member:', member.id, updateError)
      } else {
        linkedMembers.push(member)
        console.log('[link-member] Linked member:', member.id, member.membership_id)
      }
    }

    if (linkedMembers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to link any members' },
        { status: 500 }
      )
    }

    console.log('[link-member] Successfully linked', linkedMembers.length, 'member(s) to user:', user.id)

    return NextResponse.json({
      success: true,
      message: `Linked ${linkedMembers.length} membership(s)`,
      members: linkedMembers,
      count: linkedMembers.length
    })

  } catch (error) {
    console.error('[link-member] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
