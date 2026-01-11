/**
 * Active Theme API Route
 * 
 * GET: Get active theme
 * POST: Set active theme
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveThemeNameServer, setActiveThemeNameServer, getThemeServer } from '@/lib/themes/utils/themeManager.server'
import { getCurrentUserRoles } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  try {
    const themeName = await getActiveThemeNameServer()
    const theme = await getThemeServer(themeName)

    if (!theme) {
      return NextResponse.json({ error: 'Active theme not found' }, { status: 404 })
    }

    return NextResponse.json({ themeName, theme })
  } catch (error) {
    console.error('Error fetching active theme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active theme' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Super Admin can set active theme
    const roles = await getCurrentUserRoles()
    if (!roles.includes('Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { themeName } = body

    if (!themeName || typeof themeName !== 'string') {
      return NextResponse.json(
        { error: 'Theme name is required' },
        { status: 400 }
      )
    }

    // Verify theme exists
    const theme = await getThemeServer(themeName)
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      )
    }

    // Set active theme
    const success = await setActiveThemeNameServer(themeName, user.id)
    if (!success) {
      return NextResponse.json({ error: 'Failed to set active theme' }, { status: 500 })
    }

    return NextResponse.json({ themeName, theme, message: 'Active theme updated successfully' })
  } catch (error) {
    console.error('Error setting active theme:', error)
    return NextResponse.json(
      { error: 'Failed to set active theme' },
      { status: 500 }
    )
  }
}
