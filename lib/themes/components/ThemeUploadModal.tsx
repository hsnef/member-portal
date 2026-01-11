/**
 * Theme Upload Modal Component
 * 
 * Advanced option for uploading themes via JSON file.
 */

'use client'

import { useState } from 'react'
import { ThemeBuilder } from './ThemeBuilder'
import { validateTheme, sanitizeTheme } from '../utils/themeValidator'
import type { Theme } from '../types'

interface ThemeUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (theme: Theme) => void
}

export function ThemeUploadModal({ isOpen, onClose, onSave }: ThemeUploadModalProps) {
  const [jsonText, setJsonText] = useState('')
  const [validation, setValidation] = useState<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>({
    valid: true,
    errors: [],
    warnings: [],
  })
  const [previewTheme, setPreviewTheme] = useState<Partial<Theme> | null>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setJsonText(content)
      tryParseJSON(content)
    }
    reader.readAsText(file)
  }

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setJsonText(content)
    tryParseJSON(content)
  }

  const tryParseJSON = (content: string) => {
    try {
      const parsed = JSON.parse(content) as Partial<Theme>
      const sanitized = sanitizeTheme(parsed)
      const result = validateTheme(sanitized)
      setValidation(result)

      if (result.valid) {
        setPreviewTheme(sanitized)
      } else {
        setPreviewTheme(null)
      }
    } catch (error) {
      setValidation({
        valid: false,
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      })
      setPreviewTheme(null)
    }
  }

  const handleLoad = () => {
    if (validation.valid && previewTheme) {
      // Switch to ThemeBuilder with loaded theme
      onSave(previewTheme as Theme)
      setJsonText('')
      setPreviewTheme(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Upload Theme (JSON)</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JSON Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload JSON File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Paste JSON
                </label>
                <textarea
                  value={jsonText}
                  onChange={handleJsonChange}
                  placeholder='{\n  "name": "my-theme",\n  "displayName": "My Theme",\n  ...\n}'
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
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

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleLoad}
                  disabled={!validation.valid || !previewTheme}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Load Theme
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:sticky lg:top-6 h-fit">
              {previewTheme ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Preview</h3>
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Name:</strong> {previewTheme.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Display Name:</strong> {previewTheme.displayName || 'N/A'}
                    </p>
                    {previewTheme.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Description:</strong> {previewTheme.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (previewTheme.name && previewTheme.displayName) {
                            onSave(previewTheme as Theme)
                            setJsonText('')
                            setPreviewTheme(null)
                            onClose()
                          }
                        }}
                        disabled={!validation.valid || !previewTheme.name || !previewTheme.displayName}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Save Theme
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-gray-500 text-sm">
                    Upload or paste JSON to see preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
