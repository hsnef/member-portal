/**
 * Themes API Route
 * 
 * GET: List all themes
 * POST: Create new theme
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllThemesServer, saveThemeServer } from '@/lib/themes/utils/themeManager.server'
import { validateTheme, sanitizeTheme } from '@/lib/themes/utils/themeValidator'
import { getCurrentUserRoles } from '@/lib/auth/helpers'
import type { Theme } from '@/lib/themes/types'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Anyone can list themes (needed for theme selection)
    const themes = await getAllThemesServer()

    return NextResponse.json({ themes })
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
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

    // Only Super Admin can create themes
    const roles = await getCurrentUserRoles()
    if (!roles.includes('Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const themeData = body as Partial<Theme>

    // Sanitize theme
    const sanitized = sanitizeTheme(themeData)

    // Validate theme
    const validation = validateTheme(sanitized)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors, warnings: validation.warnings },
        { status: 400 }
      )
    }

    // Save theme
    const theme: Theme = {
      name: sanitized.name!,
      displayName: sanitized.displayName!,
      description: sanitized.description,
      themeType: sanitized.themeType || 'custom',
      cssVariables: sanitized.cssVariables || {},
      fonts: sanitized.fonts!,
      metadata: sanitized.metadata,
      isActive: sanitized.isActive !== false,
    }

    const success = await saveThemeServer(theme, user.id)
    if (!success) {
      return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 })
    }

    return NextResponse.json({ theme, message: 'Theme saved successfully' })
  } catch (error) {
    console.error('Error creating theme:', error)
    return NextResponse.json(
      { error: 'Failed to create theme' },
      { status: 500 }
    )
  }
}
