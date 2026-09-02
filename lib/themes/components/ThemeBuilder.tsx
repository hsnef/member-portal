/**
 * Theme Builder Component
 * 
 * Main form component for creating/editing themes with visual preview.
 */

'use client'

import { useState, useEffect } from 'react'
import { ColorPicker } from './ColorPicker'
import { FontSelector } from './FontSelector'
import { ThemePreview } from './ThemePreview'
import { saveTheme, getTheme } from '../utils/themeManager'
import { validateTheme, sanitizeTheme } from '../utils/themeValidator'
import { getBuiltInTheme, builtInThemes } from '../themes/built-in'
import type { Theme } from '../types'

interface ThemeBuilderProps {
  initialTheme?: Theme | null
  onSave?: (theme: Theme) => void
  onCancel?: () => void
}

export function ThemeBuilder({ initialTheme, onSave, onCancel }: ThemeBuilderProps) {
  const [formData, setFormData] = useState<Partial<Theme>>({
    name: initialTheme?.name || '',
    displayName: initialTheme?.displayName || '',
    description: initialTheme?.description || '',
    themeType: initialTheme?.themeType || 'custom',
    cssVariables: initialTheme?.cssVariables || {
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
    fonts: initialTheme?.fonts || {
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
    metadata: initialTheme?.metadata || {},
    isActive: true,
  })

  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] }>({
    valid: true,
    errors: [],
    warnings: [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate theme when form data changes
  useEffect(() => {
    const result = validateTheme(formData)
    setValidation(result)
  }, [formData])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCSSVariableChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      cssVariables: {
        ...prev.cssVariables,
        [key]: value,
      },
    }))
  }

  const handleFontChange = (fontType: 'header' | 'body', font: any) => {
    setFormData((prev) => ({
      ...prev,
      fonts: {
        ...prev.fonts!,
        [fontType]: font,
      },
    }))
  }

  const handleStartFromTheme = async (themeName: string) => {
    const theme = getBuiltInTheme(themeName) || await getTheme(themeName)
    if (theme) {
      setFormData({
        ...theme,
        name: '', // Reset name so user can create new theme
        displayName: '',
        description: '',
        themeType: 'custom', // New theme will be custom
      })
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.displayName) {
      setError('Theme name and display name are required')
      return
    }

    // Sanitize theme
    const sanitized = sanitizeTheme(formData)

    // Validate
    const result = validateTheme(sanitized)
    if (!result.valid) {
      setError(`Validation failed: ${result.errors.join(', ')}`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const themeToSave: Theme = {
        name: sanitized.name!,
        displayName: sanitized.displayName!,
        description: sanitized.description,
        themeType: sanitized.themeType || 'custom',
        cssVariables: sanitized.cssVariables || {},
        fonts: sanitized.fonts!,
        metadata: sanitized.metadata,
        isActive: sanitized.isActive !== false,
      }

      const success = await saveTheme(themeToSave)
      if (success) {
        if (onSave) {
          onSave(themeToSave)
        }
      } else {
        setError('Failed to save theme')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-custom-theme"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="My Custom Theme"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Theme description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Start Options */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
            <div className="grid grid-cols-2 gap-2">
              {builtInThemes.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => handleStartFromTheme(theme.name)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Start from {theme.displayName}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  cssVariables: {},
                  fonts: {
                    header: { family: 'Arial', source: 'system' },
                    body: { family: 'Arial', source: 'system' },
                  },
                })}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Start from Scratch
              </button>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Background Primary"
                value={formData.cssVariables?.['--theme-bg-primary'] || '#ffffff'}
                onChange={(color) => handleCSSVariableChange('--theme-bg-primary', color)}
                required
              />
              <ColorPicker
                label="Background Secondary"
                value={formData.cssVariables?.['--theme-bg-secondary'] || '#ffffff'}
                onChange={(color) => handleCSSVariableChange('--theme-bg-secondary', color)}
                required
              />
              <ColorPicker
                label="Text Primary"
                value={formData.cssVariables?.['--theme-text-primary'] || '#000000'}
                onChange={(color) => handleCSSVariableChange('--theme-text-primary', color)}
                required
              />
              <ColorPicker
                label="Text Secondary"
                value={formData.cssVariables?.['--theme-text-secondary'] || '#666666'}
                onChange={(color) => handleCSSVariableChange('--theme-text-secondary', color)}
                required
              />
              <ColorPicker
                label="Accent Primary"
                value={formData.cssVariables?.['--theme-accent-primary'] || '#c75b12'}
                onChange={(color) => handleCSSVariableChange('--theme-accent-primary', color)}
                required
              />
              <ColorPicker
                label="Accent Secondary"
                value={formData.cssVariables?.['--theme-accent-secondary'] || '#7b2d26'}
                onChange={(color) => handleCSSVariableChange('--theme-accent-secondary', color)}
              />
              <ColorPicker
                label="Border"
                value={formData.cssVariables?.['--theme-border'] || '#e5e5e5'}
                onChange={(color) => handleCSSVariableChange('--theme-border', color)}
                required
              />
            </div>
          </div>

          {/* Fonts */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Fonts</h3>
            <div className="space-y-4">
              <FontSelector
                label="Header Font"
                value={formData.fonts?.header || { family: 'Arial', source: 'system' }}
                onChange={(font) => handleFontChange('header', font)}
                required
              />
              <FontSelector
                label="Body Font"
                value={formData.fonts?.body || { family: 'Arial', source: 'system' }}
                onChange={(font) => handleFontChange('body', font)}
                required
              />
            </div>
          </div>

          {/* Spacing & Borders */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Spacing & Borders</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Padding</label>
                <input
                  type="text"
                  value={formData.cssVariables?.['--theme-spacing-card'] || '20px'}
                  onChange={(e) => handleCSSVariableChange('--theme-spacing-card', e.target.value)}
                  placeholder="20px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Spacing</label>
                <input
                  type="text"
                  value={formData.cssVariables?.['--theme-spacing-section'] || '28px'}
                  onChange={(e) => handleCSSVariableChange('--theme-spacing-section', e.target.value)}
                  placeholder="28px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Border Radius</label>
                <input
                  type="text"
                  value={formData.cssVariables?.['--theme-border-radius-card'] || '16px'}
                  onChange={(e) => handleCSSVariableChange('--theme-border-radius-card', e.target.value)}
                  placeholder="16px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Border Radius</label>
                <input
                  type="text"
                  value={formData.cssVariables?.['--theme-border-radius-button'] || '8px'}
                  onChange={(e) => handleCSSVariableChange('--theme-border-radius-button', e.target.value)}
                  placeholder="8px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">Warnings</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!validation.valid || saving || !formData.name || !formData.displayName}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Theme'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-6 h-fit">
          <ThemePreview theme={formData} />
        </div>
      </div>
    </div>
  )
}
