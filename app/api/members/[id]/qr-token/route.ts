import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQRToken } from '@/lib/qr-token'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memberId } = await params

  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, membership_id, member_class, current_level, auth_user_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user owns this member record
    if (member.auth_user_id !== user.id) {
      // Check if user is staff
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const isStaff = roles?.some(r =>
        r.role === 'Admin' || r.role === 'Office Manager' || r.role === 'Office Staff'
      )

      if (!isStaff) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Generate QR token
    const token = generateQRToken({
      membershipId: member.membership_id,
      memberId: member.id,
      memberClass: member.member_class,
      level: member.current_level,
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error generating QR token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
