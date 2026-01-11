/**
 * Color Picker Component
 * 
 * Reusable color picker with hex input and visual swatch.
 */

'use client'

import { useState } from 'react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  required?: boolean
  className?: string
}

export function ColorPicker({
  label,
  value,
  onChange,
  required = false,
  className = '',
}: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(value || '#000000')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setHexValue(newValue)
    
    // Validate hex color
    if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setHexValue(newValue)
    onChange(newValue)
  }

  // Preset color palettes
  const presetColors = [
    '#FFFBF7', '#FFFFFF', '#3E362E', '#6B5D52',
    '#FFD8B1', '#87CEEB', '#E8E0D8', '#FF9933',
    '#800000', '#1a1a1a', '#666666', '#e5e5e5',
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-3">
        {/* Color input (native browser picker) */}
        <input
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
          title={`Pick color for ${label}`}
        />
        
        {/* Hex input */}
        <input
          type="text"
          value={hexValue}
          onChange={handleInputChange}
          placeholder="#000000"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          pattern="^#([0-9A-F]{3}|[0-9A-F]{6})$"
          title="Hex color code (e.g., #FF9933)"
        />

        {/* Visual swatch */}
        <div
          className="w-12 h-12 rounded border border-gray-300 shadow-sm"
          style={{ backgroundColor: hexValue }}
          title={`Current color: ${hexValue}`}
        />
      </div>

      {/* Preset colors */}
      <div className="flex flex-wrap gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              setHexValue(color)
              onChange(color)
            }}
            className="w-8 h-8 rounded border border-gray-300 hover:border-gray-400 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={`Use ${color}`}
          />
        ))}
      </div>
    </div>
  )
}
