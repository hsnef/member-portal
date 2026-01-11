/**
 * Theme Manager
 * 
 * CRUD operations for themes and theme management.
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Theme, ActiveThemeSetting } from '../types'
import { REQUIRED_CSS_VARIABLES } from '../types'

/**
 * Get active theme name from portal_settings
 */
export async function getActiveThemeName(): Promise<string> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('portal_settings')
    .select('setting_value')
    .eq('setting_key', 'active_theme')
    .single()

  if (error || !data) {
    console.error('Error fetching active theme:', error)
    return 'default'  // Default fallback
  }

  const setting = data.setting_value as ActiveThemeSetting
  return setting.themeName || 'default'
}

/**
 * Set active theme name in portal_settings
 */
export async function setActiveThemeName(themeName: string): Promise<boolean> {
  const supabase = createClient()
  
  // Get current user
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    console.error('No user found')
    return false
  }

  const { error } = await supabase
    .from('portal_settings')
    .update({
      setting_value: { themeName } as ActiveThemeSetting,
      updated_by: userData.user.id,
    })
    .eq('setting_key', 'active_theme')

  if (error) {
    console.error('Error updating active theme:', error)
    return false
  }

  return true
}

/**
 * Get theme by name
 */
export async function getTheme(themeName: string): Promise<Theme | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('theme_definitions')
    .select('*')
    .eq('name', themeName)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    // Fallback to built-in themes from code
    const { getBuiltInTheme } = await import('../themes/built-in')
    const builtInTheme = getBuiltInTheme(themeName)
    if (builtInTheme) {
      return builtInTheme
    }
    
    console.error(`Error fetching theme ${themeName}:`, error)
    return null
  }

  return mapDatabaseThemeToTheme(data)
}

/**
 * Get all themes
 */
export async function getAllThemes(): Promise<Theme[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('theme_definitions')
    .select('*')
    .eq('is_active', true)
    .order('theme_type', { ascending: false })  // built-in first
    .order('display_name', { ascending: true })

  if (error) {
    console.error('Error fetching themes:', error)
    // Fallback to built-in themes from code
    const { loadBuiltInThemes } = await import('../themes/built-in')
    return loadBuiltInThemes()
  }

  const dbThemes = (data || []).map(mapDatabaseThemeToTheme)
  
  // Ensure built-in themes are included (fallback if not in database)
  const { loadBuiltInThemes } = await import('../themes/built-in')
  const builtInThemes = loadBuiltInThemes()
  const dbThemeNames = new Set(dbThemes.map(t => t.name))
  
  // Add built-in themes that aren't in database
  for (const builtInTheme of builtInThemes) {
    if (!dbThemeNames.has(builtInTheme.name)) {
      dbThemes.push(builtInTheme)
    }
  }
  
  // Sort: built-in first, then custom, then by display name
  return dbThemes.sort((a, b) => {
    if (a.themeType !== b.themeType) {
      return a.themeType === 'built-in' ? -1 : 1
    }
    return a.displayName.localeCompare(b.displayName)
  })
}

/**
 * Save theme (create or update)
 */
export async function saveTheme(theme: Theme): Promise<boolean> {
  const supabase = createClient()
  
  // Get current user
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    console.error('No user found')
    return false
  }

  const themeData = {
    name: theme.name,
    display_name: theme.displayName,
    description: theme.description || null,
    theme_type: theme.themeType,
    css_variables: theme.cssVariables,
    fonts: theme.fonts,
    metadata: theme.metadata || {},
    is_active: theme.isActive !== false,
    updated_at: new Date().toISOString(),
  }

  // Check if theme exists
  const { data: existing } = await supabase
    .from('theme_definitions')
    .select('id')
    .eq('name', theme.name)
    .single()

  if (existing) {
    // Update existing theme
    const { error } = await supabase
      .from('theme_definitions')
      .update(themeData)
      .eq('name', theme.name)

    if (error) {
      console.error(`Error updating theme ${theme.name}:`, error)
      return false
    }
  } else {
    // Insert new theme
    const { error } = await supabase
      .from('theme_definitions')
      .insert({
        ...themeData,
        created_by: userData.user.id,
      })

    if (error) {
      console.error(`Error creating theme ${theme.name}:`, error)
      return false
    }
  }

  return true
}

/**
 * Delete theme (only custom themes)
 */
export async function deleteTheme(themeName: string): Promise<boolean> {
  const supabase = createClient()
  
  // Check if theme is built-in
  const { data: theme } = await supabase
    .from('theme_definitions')
    .select('theme_type')
    .eq('name', themeName)
    .single()

  if (!theme) {
    console.error(`Theme ${themeName} not found`)
    return false
  }

  if (theme.theme_type === 'built-in') {
    console.error('Cannot delete built-in themes')
    return false
  }

  // Soft delete (set is_active to false)
  const { error } = await supabase
    .from('theme_definitions')
    .update({ is_active: false })
    .eq('name', themeName)

  if (error) {
    console.error(`Error deleting theme ${themeName}:`, error)
    return false
  }

  return true
}

/**
 * Generate CSS string from theme
 */
export function generateThemeCSS(theme: Theme): string {
  const cssVariables = Object.entries(theme.cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  return `[data-theme="${theme.name}"] {\n${cssVariables}\n}`
}

/**
 * Inject theme CSS into document
 */
export function injectThemeCSS(css: string): void {
  if (typeof window === 'undefined') return

  // Remove old custom theme CSS
  const oldStyle = document.getElementById('custom-theme-css')
  if (oldStyle) {
    oldStyle.remove()
  }

  // Inject new CSS
  const style = document.createElement('style')
  style.id = 'custom-theme-css'
  style.textContent = css
  document.head.appendChild(style)
}

/**
 * Apply theme to document
 */
export async function applyTheme(themeName: string): Promise<void> {
  if (typeof window === 'undefined') return

  const theme = await getTheme(themeName)
  if (!theme) {
    console.error(`Theme ${themeName} not found`)
    return
  }

  // Set data-theme attribute
  document.documentElement.setAttribute('data-theme', theme.name)

  // Generate and inject CSS
  const css = generateThemeCSS(theme)
  injectThemeCSS(css)

  // Load fonts if needed
  await loadThemeFonts(theme)
}

/**
 * Load theme fonts
 */
async function loadThemeFonts(theme: Theme): Promise<void> {
  if (typeof window === 'undefined') return

  // Remove existing font links
  const existingLinks = document.querySelectorAll('link[data-theme-font]')
  existingLinks.forEach(link => link.remove())

  // Load header font if Google Font
  if (theme.fonts.header.source === 'google' && theme.fonts.header.url) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = theme.fonts.header.url
    link.setAttribute('data-theme-font', 'header')
    document.head.appendChild(link)
  }

  // Load body font if Google Font
  if (theme.fonts.body.source === 'google' && theme.fonts.body.url) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = theme.fonts.body.url
    link.setAttribute('data-theme-font', 'body')
    document.head.appendChild(link)
  }

  // Apply font families
  document.documentElement.style.setProperty('--theme-font-header', theme.fonts.header.family)
  document.documentElement.style.setProperty('--theme-font-body', theme.fonts.body.family)
}

/**
 * Map database theme to Theme interface
 */
function mapDatabaseThemeToTheme(dbTheme: any): Theme {
  return {
    id: dbTheme.id,
    name: dbTheme.name,
    displayName: dbTheme.display_name,
    description: dbTheme.description,
    themeType: dbTheme.theme_type,
    cssVariables: dbTheme.css_variables || {},
    fonts: dbTheme.fonts || {
      header: { family: 'Arial, Helvetica, sans-serif', source: 'system' },
      body: { family: 'Arial, Helvetica, sans-serif', source: 'system' },
    },
    metadata: dbTheme.metadata || {},
    createdBy: dbTheme.created_by,
    createdAt: dbTheme.created_at,
    updatedAt: dbTheme.updated_at,
    isActive: dbTheme.is_active !== false,
  }
}
