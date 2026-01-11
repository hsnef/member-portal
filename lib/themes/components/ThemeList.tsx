/**
 * Theme List Component
 * 
 * Display all themes with actions.
 */

'use client'

import { useState } from 'react'
import type { Theme } from '../types'

interface ThemeListProps {
  themes: Theme[]
  activeThemeName?: string
  onSelect?: (theme: Theme) => void
  onEdit?: (theme: Theme) => void
  onDelete?: (theme: Theme) => void
  onDuplicate?: (theme: Theme) => void
}

export function ThemeList({
  themes,
  activeThemeName,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}: ThemeListProps) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null)

  const groupedThemes = {
    builtIn: themes.filter((t) => t.themeType === 'built-in'),
    custom: themes.filter((t) => t.themeType === 'custom'),
  }

  return (
    <div className="space-y-6">
      {/* Built-in Themes */}
      {groupedThemes.builtIn.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Built-in Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedThemes.builtIn.map((theme) => (
              <ThemeCard
                key={theme.name}
                theme={theme}
                isActive={theme.name === activeThemeName}
                onSelect={onSelect}
                onDuplicate={onDuplicate}
                expanded={expandedTheme === theme.name}
                onToggleExpand={() =>
                  setExpandedTheme(expandedTheme === theme.name ? null : theme.name)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Themes */}
      {groupedThemes.custom.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Custom Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedThemes.custom.map((theme) => (
              <ThemeCard
                key={theme.name}
                theme={theme}
                isActive={theme.name === activeThemeName}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                expanded={expandedTheme === theme.name}
                onToggleExpand={() =>
                  setExpandedTheme(expandedTheme === theme.name ? null : theme.name)
                }
                canDelete={true}
              />
            ))}
          </div>
        </div>
      )}

      {themes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No themes available</p>
        </div>
      )}
    </div>
  )
}

interface ThemeCardProps {
  theme: Theme
  isActive: boolean
  onSelect?: (theme: Theme) => void
  onEdit?: (theme: Theme) => void
  onDelete?: (theme: Theme) => void
  onDuplicate?: (theme: Theme) => void
  expanded: boolean
  onToggleExpand: () => void
  canDelete?: boolean
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  expanded,
  onToggleExpand,
  canDelete = false,
}: ThemeCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{theme.displayName}</h4>
          {theme.description && (
            <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
          )}
          {isActive && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded">
              Active
            </span>
          )}
        </div>

        {/* Color Swatches */}
        <div className="flex gap-1">
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: theme.cssVariables['--theme-bg-primary'] || '#ffffff' }}
            title="Primary Background"
          />
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: theme.cssVariables['--theme-accent-primary'] || '#FF9933' }}
            title="Accent Color"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {onSelect && (
          <button
            onClick={() => onSelect(theme)}
            disabled={isActive}
            className={`px-3 py-1 text-sm rounded ${
              isActive
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
          >
            {isActive ? 'Active' : 'Select'}
          </button>
        )}
        {onEdit && theme.themeType === 'custom' && (
          <button
            onClick={() => onEdit(theme)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        )}
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(theme)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Duplicate
          </button>
        )}
        {onDelete && canDelete && theme.themeType === 'custom' && (
          <button
            onClick={() => {
              if (confirm(`Delete theme "${theme.displayName}"?`)) {
                onDelete(theme)
              }
            }}
            className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
