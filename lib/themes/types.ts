/**
 * Theme System Types
 * 
 * TypeScript interfaces and types for the theme system.
 */

/**
 * Font source types
 */
export type FontSource = 'system' | 'google' | 'custom'

/**
 * Font definition
 */
export interface ThemeFont {
  family: string
  source: FontSource
  url?: string  // For Google Fonts or custom fonts
  weight?: string | number
}

/**
 * Fonts configuration
 */
export interface ThemeFonts {
  header: ThemeFont
  body: ThemeFont
}

/**
 * Spacing configuration
 */
export interface ThemeSpacing {
  cardPadding: string
  sectionSpacing: string
}

/**
 * Border configuration
 */
export interface ThemeBorders {
  cardRadius: string
  buttonRadius: string
}

/**
 * Shadow configuration
 */
export interface ThemeShadows {
  card: string
}

/**
 * Theme metadata
 */
export interface ThemeMetadata {
  spacing?: ThemeSpacing
  borders?: ThemeBorders
  shadows?: ThemeShadows
  [key: string]: any  // Allow additional metadata
}

/**
 * CSS variables object
 */
export interface ThemeCSSVariables {
  [key: string]: string  // CSS variable name -> value
}

/**
 * Complete theme definition
 */
export interface Theme {
  id?: string
  name: string
  displayName: string
  description?: string
  themeType: 'built-in' | 'custom'
  cssVariables: ThemeCSSVariables
  fonts: ThemeFonts
  metadata?: ThemeMetadata
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  isActive?: boolean
}

/**
 * Active theme setting structure
 */
export interface ActiveThemeSetting {
  themeName: string
}

/**
 * Required CSS variable names
 */
export const REQUIRED_CSS_VARIABLES = [
  '--theme-bg-primary',
  '--theme-bg-secondary',
  '--theme-text-primary',
  '--theme-text-secondary',
  '--theme-accent-primary',
  '--theme-border',
  '--theme-border-radius-card',
  '--theme-border-radius-button',
  '--theme-shadow-card',
  '--theme-spacing-card',
  '--theme-spacing-section',
] as const

/**
 * CSS variable names type
 */
export type CSSVariableName = typeof REQUIRED_CSS_VARIABLES[number]

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
