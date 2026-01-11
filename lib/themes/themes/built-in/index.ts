/**
 * Built-in Themes Index
 * 
 * Exports all built-in themes and provides loading utilities.
 */

import { defaultTheme } from './default'
import { floridaOuraTheme } from './florida-oura'
import type { Theme } from '../../types'

/**
 * All built-in themes
 */
export const builtInThemes: Theme[] = [
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
