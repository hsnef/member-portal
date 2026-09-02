/**
 * Theme Preview Component
 * 
 * Real-time preview of theme with sample components.
 */

'use client'

import type { Theme } from '../types'

interface ThemePreviewProps {
  theme: Partial<Theme>
  className?: string
}

export function ThemePreview({ theme, className = '' }: ThemePreviewProps) {
  if (!theme.cssVariables) {
    return (
      <div className={`p-6 border border-gray-300 rounded-lg bg-gray-50 ${className}`}>
        <p className="text-gray-500 text-sm">Preview will appear here</p>
      </div>
    )
  }

  // Generate inline styles for preview
  const previewStyles: React.CSSProperties = {
    backgroundColor: theme.cssVariables['--theme-bg-primary'] || '#ffffff',
    color: theme.cssVariables['--theme-text-primary'] || '#000000',
    fontFamily: theme.fonts?.body?.family || 'Arial, sans-serif',
  }

  const cardStyles: React.CSSProperties = {
    backgroundColor: theme.cssVariables['--theme-bg-secondary'] || '#ffffff',
    borderColor: theme.cssVariables['--theme-border'] || '#e5e5e5',
    borderRadius: theme.cssVariables['--theme-border-radius-card'] || '8px',
    boxShadow: theme.cssVariables['--theme-shadow-card'] || 'none',
    padding: theme.cssVariables['--theme-spacing-card'] || '24px',
  }

  const buttonStyles: React.CSSProperties = {
    backgroundColor: theme.cssVariables['--theme-accent-primary'] || '#c75b12',
    color: '#ffffff',
    borderRadius: theme.cssVariables['--theme-border-radius-button'] || '6px',
  }

  const headerFont = theme.fonts?.header?.family || 'Arial, sans-serif'
  const headerWeight = theme.fonts?.header?.weight || '600'

  return (
    <div
      className={`p-6 rounded-lg border border-gray-300 ${className}`}
      style={previewStyles}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: headerFont, fontWeight: headerWeight }}>
        Theme Preview
      </h3>

      {/* Sample Card */}
      <div className="mb-4 border rounded-lg" style={cardStyles}>
        <h4
          className="text-lg font-semibold mb-2"
          style={{ fontFamily: headerFont, fontWeight: headerWeight }}
        >
          Sample Card Title
        </h4>
        <p className="text-sm mb-3" style={{ color: theme.cssVariables['--theme-text-secondary'] || '#666666' }}>
          This is a preview of how your theme will look. Colors, fonts, and spacing are shown here.
        </p>
        <button
          className="px-4 py-2 rounded-md font-medium text-sm"
          style={buttonStyles}
        >
          Primary Button
        </button>
      </div>

      {/* Sample Text */}
      <div className="space-y-2">
        <p
          className="text-base font-semibold"
          style={{ fontFamily: headerFont, fontWeight: headerWeight }}
        >
          Header Text Style
        </p>
        <p className="text-sm" style={{ color: theme.cssVariables['--theme-text-secondary'] || '#666666' }}>
          Body text with secondary color
        </p>
      </div>

      {/* Color Swatches */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="text-center">
          <div
            className="w-full h-12 rounded border border-gray-300 mb-1"
            style={{ backgroundColor: theme.cssVariables['--theme-bg-primary'] || '#ffffff' }}
          />
          <p className="text-xs text-gray-600">Primary BG</p>
        </div>
        <div className="text-center">
          <div
            className="w-full h-12 rounded border border-gray-300 mb-1"
            style={{ backgroundColor: theme.cssVariables['--theme-accent-primary'] || '#c75b12' }}
          />
          <p className="text-xs text-gray-600">Accent</p>
        </div>
        <div className="text-center">
          <div
            className="w-full h-12 rounded border border-gray-300 mb-1"
            style={{ backgroundColor: theme.cssVariables['--theme-text-primary'] || '#000000' }}
          />
          <p className="text-xs text-gray-600">Text</p>
        </div>
        <div className="text-center">
          <div
            className="w-full h-12 rounded border border-gray-300 mb-1"
            style={{ backgroundColor: theme.cssVariables['--theme-border'] || '#e5e5e5' }}
          />
          <p className="text-xs text-gray-600">Border</p>
        </div>
      </div>
    </div>
  )
}
