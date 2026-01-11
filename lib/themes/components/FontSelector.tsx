/**
 * Font Selector Component
 * 
 * Dropdown with Google Fonts selection and font configuration.
 */

'use client'

import { useState } from 'react'
import type { ThemeFont } from '../types'

interface FontSelectorProps {
  label: string
  value: ThemeFont
  onChange: (font: ThemeFont) => void
  required?: boolean
  className?: string
}

// Popular Google Fonts for selection
const GOOGLE_FONTS = [
  { name: 'Arial, Helvetica, sans-serif', source: 'system' as const },
  { name: 'Lora', family: 'Lora', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap' },
  { name: 'Inter', family: 'Inter', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap' },
  { name: 'Playfair Display', family: 'Playfair Display', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap' },
  { name: 'Open Sans', family: 'Open Sans', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap' },
  { name: 'Roboto', family: 'Roboto', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;600&display=swap' },
  { name: 'Poppins', family: 'Poppins', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap' },
  { name: 'Merriweather', family: 'Merriweather', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
  { name: 'Montserrat', family: 'Montserrat', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap' },
  { name: 'Raleway', family: 'Raleway', source: 'google' as const, url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;600&display=swap' },
]

export function FontSelector({
  label,
  value,
  onChange,
  required = false,
  className = '',
}: FontSelectorProps) {
  const [selectedFont, setSelectedFont] = useState(value?.family || value?.name || 'Arial')

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontName = e.target.value
    const googleFont = GOOGLE_FONTS.find(f => (f.family || f.name) === fontName)

    if (googleFont) {
      const newFont: ThemeFont = {
        family: googleFont.family || googleFont.name,
        source: googleFont.source,
        url: googleFont.url,
        weight: value?.weight || (label.toLowerCase().includes('header') ? '600' : '400'),
      }
      setSelectedFont(fontName)
      onChange(newFont)
    } else {
      // System font
      const newFont: ThemeFont = {
        family: fontName,
        source: 'system',
        weight: value?.weight || '400',
      }
      setSelectedFont(fontName)
      onChange(newFont)
    }
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...value,
      weight: e.target.value,
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-3">
        <select
          value={selectedFont}
          onChange={handleFontChange}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {GOOGLE_FONTS.map((font) => (
            <option key={font.name} value={font.family || font.name}>
              {font.name}
            </option>
          ))}
        </select>

        <select
          value={value?.weight || '400'}
          onChange={handleWeightChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="300">Light (300)</option>
          <option value="400">Regular (400)</option>
          <option value="500">Medium (500)</option>
          <option value="600">Semi-Bold (600)</option>
          <option value="700">Bold (700)</option>
        </select>
      </div>

      {/* Font preview */}
      <div
        className="p-3 border border-gray-200 rounded-md bg-gray-50"
        style={{
          fontFamily: value?.family || value?.name || 'Arial',
          fontWeight: value?.weight || '400',
        }}
      >
        <p className="text-sm text-gray-600">
          The quick brown fox jumps over the lazy dog
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
        </p>
      </div>
    </div>
  )
}
