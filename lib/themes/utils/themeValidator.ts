/**
 * Theme Validator
 * 
 * Validates theme structure and values.
 */

import type { Theme, ThemeValidationResult } from '../types'
import { REQUIRED_CSS_VARIABLES } from '../types'

/**
 * Validate color format (hex, rgb, rgba, hsl, hsla, or named colors)
 */
function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false

  // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(color)) {
    return true
  }

  // RGB/RGBA: rgb(r, g, b) or rgba(r, g, b, a)
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
    return true
  }

  // HSL/HSLA: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
    return true
  }

  // Named colors or CSS variables
  if (/^[a-z-]+$/i.test(color) || color.startsWith('var(')) {
    return true
  }

  return false
}

/**
 * Validate CSS variable value
 */
function isValidCSSValue(value: string): boolean {
  if (!value || typeof value !== 'string') return false

  // Allow CSS variables, colors, lengths, percentages, keywords, etc.
  // This is a simplified check - CSS is very permissive
  return value.length > 0 && value.length < 1000
}

/**
 * Validate font URL
 */
function isValidFontURL(url: string | undefined): boolean {
  if (!url) return true  // URL is optional

  // Must be a valid URL
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validate font family
 */
function isValidFontFamily(family: string): boolean {
  if (!family || typeof family !== 'string') return false
  return family.length > 0 && family.length < 200
}

/**
 * Validate theme structure
 */
export function validateTheme(theme: Partial<Theme>): ThemeValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!theme.name) {
    errors.push('Theme name is required')
  } else if (!/^[a-z0-9-]+$/.test(theme.name)) {
    errors.push('Theme name must be lowercase letters, numbers, and hyphens only')
  }

  if (!theme.displayName) {
    errors.push('Display name is required')
  }

  if (!theme.themeType) {
    errors.push('Theme type is required')
  } else if (theme.themeType !== 'built-in' && theme.themeType !== 'custom') {
    errors.push('Theme type must be "built-in" or "custom"')
  }

  // Validate CSS variables
  if (!theme.cssVariables || typeof theme.cssVariables !== 'object') {
    errors.push('CSS variables are required')
  } else {
    // Check required variables
    for (const requiredVar of REQUIRED_CSS_VARIABLES) {
      if (!theme.cssVariables[requiredVar]) {
        errors.push(`Required CSS variable missing: ${requiredVar}`)
      } else if (!isValidCSSValue(theme.cssVariables[requiredVar])) {
        errors.push(`Invalid CSS value for ${requiredVar}`)
      }
    }

    // Validate color values (if they look like colors)
    const colorVariables = [
      '--theme-bg-primary',
      '--theme-bg-secondary',
      '--theme-text-primary',
      '--theme-text-secondary',
      '--theme-accent-primary',
      '--theme-accent-secondary',
    ]

    for (const varName of colorVariables) {
      const value = theme.cssVariables[varName]
      if (value && !isValidColor(value)) {
        warnings.push(`Value for ${varName} may not be a valid color: ${value}`)
      }
    }
  }

  // Validate fonts
  if (!theme.fonts || typeof theme.fonts !== 'object') {
    errors.push('Fonts configuration is required')
  } else {
    // Validate header font
    if (!theme.fonts.header) {
      errors.push('Header font is required')
    } else {
      if (!isValidFontFamily(theme.fonts.header.family)) {
        errors.push('Header font family is invalid')
      }
      if (theme.fonts.header.source === 'google' && !theme.fonts.header.url) {
        errors.push('Google Font URL is required for header font')
      }
      if (theme.fonts.header.url && !isValidFontURL(theme.fonts.header.url)) {
        errors.push('Header font URL is invalid')
      }
    }

    // Validate body font
    if (!theme.fonts.body) {
      errors.push('Body font is required')
    } else {
      if (!isValidFontFamily(theme.fonts.body.family)) {
        errors.push('Body font family is invalid')
      }
      if (theme.fonts.body.source === 'google' && !theme.fonts.body.url) {
        errors.push('Google Font URL is required for body font')
      }
      if (theme.fonts.body.url && !isValidFontURL(theme.fonts.body.url)) {
        errors.push('Body font URL is invalid')
      }
    }
  }

  // Validate metadata (optional)
  if (theme.metadata && typeof theme.metadata !== 'object') {
    warnings.push('Metadata should be an object')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Sanitize theme data (remove invalid fields)
 */
export function sanitizeTheme(theme: Partial<Theme>): Partial<Theme> {
  const sanitized: Partial<Theme> = {
    ...theme,
  }

  // Ensure name is lowercase with hyphens only
  if (sanitized.name) {
    sanitized.name = sanitized.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Remove invalid CSS variables
  if (sanitized.cssVariables) {
    const cleanVars: Record<string, string> = {}
    for (const [key, value] of Object.entries(sanitized.cssVariables)) {
      if (typeof key === 'string' && typeof value === 'string' && isValidCSSValue(value)) {
        cleanVars[key] = value
      }
    }
    sanitized.cssVariables = cleanVars
  }

  return sanitized
}
