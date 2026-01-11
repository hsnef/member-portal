/**
 * Florida Oura Theme
 * 
 * Calming vibrant Florida vibe with sky brightness and crisp modern design.
 * Incorporates Oura CSS choices with reduced spacing.
 */

import type { Theme } from '../../types'

export const floridaOuraTheme: Theme = {
  name: 'florida-oura',
  displayName: 'Florida Oura',
  description: 'Calming vibrant Florida vibe with sky brightness and crisp modern design',
  themeType: 'built-in',
  cssVariables: {
    '--theme-bg-primary': '#FFFBF7',
    '--theme-bg-secondary': '#FFFFFF',
    '--theme-text-primary': '#3E362E',
    '--theme-text-secondary': '#6B5D52',
    '--theme-accent-primary': '#FFD8B1',
    '--theme-accent-secondary': '#87CEEB',
    '--theme-border': '#E8E0D8',
    '--theme-border-radius-card': '16px',
    '--theme-border-radius-button': '8px',
    '--theme-shadow-card': '0 4px 12px rgba(62, 54, 46, 0.08)',
    '--theme-spacing-card': '20px',
    '--theme-spacing-section': '28px',
  },
  fonts: {
    header: {
      family: 'Lora, serif',
      source: 'google',
      url: 'https://fonts.googleapis.com/css2?family=Lora:wght@600&display=swap',
      weight: '600',
    },
    body: {
      family: 'Inter, sans-serif',
      source: 'google',
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap',
      weight: '400',
    },
  },
  metadata: {
    spacing: {
      cardPadding: '20px',
      sectionSpacing: '28px',
    },
    borders: {
      cardRadius: '16px',
      buttonRadius: '8px',
    },
    shadows: {
      card: '0 4px 12px rgba(62, 54, 46, 0.08)',
    },
  },
  isActive: true,
}
