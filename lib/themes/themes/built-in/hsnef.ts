/**
 * HSNEF Theme
 *
 * The HSNEF design system palette, expressed as a runtime theme so that the
 * design system and the Appearance settings page both keep working.
 *
 * The seven --theme-* accent/surface variables drive their design system
 * counterparts (--canvas, --surface, --ink, --ink-2, --saffron, --kumkum,
 * --line) via aliases declared in app/globals.css. Overriding them here is
 * what makes every page — ported or not — pick up the new palette.
 *
 * Fonts resolve through the next/font variables wired up in app/layout.tsx,
 * so source is 'system': there is no external stylesheet to fetch.
 */

import type { Theme } from '../../types'

export const hsnefTheme: Theme = {
  name: 'hsnef',
  displayName: 'HSNEF',
  description:
    'The HSNEF design system — warm temple palette, Instrument Sans and Instrument Serif. Accessible contrast throughout.',
  themeType: 'built-in',
  cssVariables: {
    // Runtime theming contract. These also drive the design system aliases.
    '--theme-bg-primary': '#fffbf4',
    '--theme-bg-secondary': '#ffffff',
    '--theme-text-primary': '#2b2018',
    '--theme-text-secondary': '#6a5b4b',
    '--theme-accent-primary': '#c75b12',
    '--theme-accent-secondary': '#7b2d26',
    '--theme-border': '#f1e6d5',
    '--theme-border-radius-card': '18px',
    '--theme-border-radius-button': '13px',
    '--theme-shadow-card':
      '0 1px 2px rgba(74, 47, 22, 0.04), 0 8px 24px -12px rgba(74, 47, 22, 0.14)',
    '--theme-spacing-card': '24px',
    '--theme-spacing-section': '32px',

    // Design system tokens with no --theme-* equivalent. Restated so this
    // theme is self-describing and survives being edited in the Theme Builder.
    '--canvas-deep': '#fdf3e5',
    '--surface-sunk': '#faf5ec',
    '--line-strong': '#e2d1b7',
    '--ink-3': '#9b8c7a',
    '--ink-inverse': '#fffbf4',
    '--saffron-hover': '#a94a0c',
    '--saffron-soft': '#fdefe2',
    '--saffron-ring': '#f0bb8a',
    '--marigold': '#f5a524',
    '--marigold-ink': '#a06c05',
    '--marigold-soft': '#fef4de',
    '--kumkum-ink': '#7b2d26',
    '--kumkum-soft': '#f8ece9',
    '--tulsi': '#4e7a63',
    '--tulsi-ink': '#3d6350',
    '--tulsi-soft': '#eaf2ec',
    '--lotus': '#b0526b',
    '--lotus-ink': '#97425a',
    '--lotus-soft': '#fbecef',
    '--copper': '#a8541f',
    '--copper-ink': '#8d4415',
    '--copper-soft': '#fbeee4',
    '--sandal': '#7a6a45',
    '--sandal-ink': '#665839',
    '--sandal-soft': '#f4efe1',
    '--gold': '#c9962c',
    '--success': '#4e7a63',
    '--success-soft': '#eaf2ec',
    '--warning': '#a06c05',
    '--warning-soft': '#fef4de',
    '--danger': '#b23a2e',
    '--danger-soft': '#fbebe8',
    '--neutral': '#6a5b4b',
    '--neutral-soft': '#f4ede3',
  },
  fonts: {
    header: {
      family: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
      source: 'system',
      weight: '600',
    },
    body: {
      family: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
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
      cardRadius: '18px',
      buttonRadius: '13px',
    },
    shadows: {
      card: '0 1px 2px rgba(74, 47, 22, 0.04), 0 8px 24px -12px rgba(74, 47, 22, 0.14)',
    },
  },
  isActive: true,
}
