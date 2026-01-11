/**
 * Theme API Route (Specific Theme)
 * 
 * GET: Get specific theme
 * PUT: Update theme
 * DELETE: Delete theme
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getThemeServer, saveThemeServer, deleteThemeServer } from '@/lib/themes/utils/themeManager.server'
import { validateTheme, sanitizeTheme } from '@/lib/themes/utils/themeValidator'
import { getCurrentUserRoles } from '@/lib/auth/helpers'
import type { Theme } from '@/lib/themes/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const themeName = params.name

    // Anyone can get theme (needed for theme application)
    const theme = await getThemeServer(themeName)

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    return NextResponse.json({ theme })
  } catch (error) {
    console.error('Error fetching theme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Check authentication and role
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Super Admin can update themes
    const roles = await getCurrentUserRoles()
    if (!roles.includes('Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const themeName = params.name

    // Check if theme is built-in (cannot update built-in themes)
    const existingTheme = await getThemeServer(themeName)
    if (existingTheme?.themeType === 'built-in') {
      return NextResponse.json(
        { error: 'Cannot update built-in themes' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const themeData = body as Partial<Theme>

    // Ensure name matches URL parameter
    if (themeData.name && themeData.name !== themeName) {
      return NextResponse.json(
        { error: 'Theme name cannot be changed' },
        { status: 400 }
      )
    }

    // Sanitize theme
    const sanitized = sanitizeTheme({ ...themeData, name: themeName })

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
      name: themeName,
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
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
    }

    return NextResponse.json({ theme, message: 'Theme updated successfully' })
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    // Check authentication and role
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Super Admin can delete themes
    const roles = await getCurrentUserRoles()
    if (!roles.includes('Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const themeName = params.name

    // Check if theme is built-in (cannot delete built-in themes)
    const existingTheme = await getThemeServer(themeName)
    if (existingTheme?.themeType === 'built-in') {
      return NextResponse.json(
        { error: 'Cannot delete built-in themes' },
        { status: 400 }
      )
    }

    const success = await deleteThemeServer(themeName)
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Theme deleted successfully' })
  } catch (error) {
    console.error('Error deleting theme:', error)
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    )
  }
}
