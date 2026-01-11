/**
 * Default Theme
 * 
 * Matches the current design exactly.
 */

import type { Theme } from '../../types'

export const defaultTheme: Theme = {
  name: 'default',
  displayName: 'Default',
  description: 'Default theme matching the current design',
  themeType: 'built-in',
  cssVariables: {
    '--theme-bg-primary': '#fffaf5',
    '--theme-bg-secondary': '#ffffff',
    '--theme-text-primary': '#1a1a1a',
    '--theme-text-secondary': '#666666',
    '--theme-accent-primary': '#FF9933',
    '--theme-accent-secondary': '#800000',
    '--theme-border': '#e5e5e5',
    '--theme-border-radius-card': '8px',
    '--theme-border-radius-button': '6px',
    '--theme-shadow-card': '0 1px 3px rgba(0, 0, 0, 0.1)',
    '--theme-spacing-card': '24px',
    '--theme-spacing-section': '32px',
  },
  fonts: {
    header: {
      family: 'Arial, Helvetica, sans-serif',
      source: 'system',
      weight: '600',
    },
    body: {
      family: 'Arial, Helvetica, sans-serif',
      source: 'system',
      weight: '400',
    },
  },
  metadata: {
    spacing: {
      cardPadding: '24px',
      sectionSpacing: '32px',
    },
    borders: {
      cardRadius: '8px',
      buttonRadius: '6px',
    },
    shadows: {
      card: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
  },
  isActive: true,
}
