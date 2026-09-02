/**
 * Built-in Themes Index
 * 
 * Exports all built-in themes and provides loading utilities.
 */

import { hsnefTheme } from './hsnef'
import { defaultTheme } from './default'
import { floridaOuraTheme } from './florida-oura'
import type { Theme } from '../../types'

/**
 * The theme applied when nothing else is selected.
 * This is the HSNEF design system; see lib/themes/themes/built-in/hsnef.ts.
 */
export const DEFAULT_THEME_NAME = 'hsnef'

/**
 * All built-in themes. HSNEF first — it is the default.
 */
export const builtInThemes: Theme[] = [
  hsnefTheme,
  defaultTheme,
  floridaOuraTheme,
]

/**
 * Get built-in theme by name
 */
export function getBuiltInTheme(name: string): Theme | undefined {
  return builtInThemes.find(theme => theme.name === name)
}

/**
 * Load all built-in themes
 */
export function loadBuiltInThemes(): Theme[] {
  return builtInThemes
}
