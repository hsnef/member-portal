/**
 * Appearance Settings Page
 * 
 * Admin page for theme selection and management (Super Admin only).
 */

'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useThemes } from '@/lib/themes/hooks/useThemes'
import { useTheme } from '@/lib/themes/hooks/useTheme'
import { ThemeList } from '@/lib/themes/components/ThemeList'
import { ThemeBuilder } from '@/lib/themes/components/ThemeBuilder'
import { ThemeUploadModal } from '@/lib/themes/components/ThemeUploadModal'
import {
  getActiveThemeName,
  getTheme,
  saveTheme,
  deleteTheme,
  applyTheme,
} from '@/lib/themes/utils/themeManager'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import type { Theme } from '@/lib/themes/types'

export default function AppearanceSettingsPage() {
  const router = useRouter()
  const { user, roles, loading: authLoading } = useAuth()
  const { themes, loading: themesLoading, refreshThemes } = useThemes()
  const { refreshTheme: refreshActiveTheme } = useTheme()
  const [activeThemeName, setActiveThemeNameState] = useState<string>('default')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [duplicatingTheme, setDuplicatingTheme] = useState<Theme | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || !roles.includes('Admin'))) {
      router.push('/unauthorized')
      return
    }

    if (user && roles.includes('Admin')) {
      loadActiveTheme()
    }
  }, [user, roles, authLoading, router])

  const loadActiveTheme = async () => {
    try {
      setLoading(true)
      const themeName = await getActiveThemeName()
      setActiveThemeNameState(themeName)
    } catch (error) {
      console.error('Error loading active theme:', error)
      setMessage({ type: 'error', text: 'Failed to load active theme' })
    } finally {
      setLoading(false)
    }
  }

  const handleThemeSelect = async (theme: Theme) => {
    try {
      setSaving(true)
      setMessage(null)

      // Use API route to set active theme
      const response = await fetch('/api/themes/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeName: theme.name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply theme')
      }

      setActiveThemeNameState(theme.name)
      await applyTheme(theme.name)
      await refreshActiveTheme()
      setMessage({ type: 'success', text: `Theme "${theme.displayName}" applied successfully!` })
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error selecting theme:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to apply theme' })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNew = () => {
    setEditingTheme(null)
    setShowBuilder(true)
  }

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme)
    setShowBuilder(true)
  }

  const handleDuplicate = (theme: Theme) => {
    setDuplicatingTheme(theme)
    setEditingTheme({
      ...theme,
      name: `${theme.name}-copy`,
      displayName: `${theme.displayName} (Copy)`,
      themeType: 'custom',
    })
    setShowBuilder(true)
  }

  const handleSaveTheme = async (theme: Theme) => {
    try {
      setSaving(true)
      const success = await saveTheme(theme)
      if (success) {
        await refreshThemes()
        setShowBuilder(false)
        setEditingTheme(null)
        setDuplicatingTheme(null)
        setMessage({ type: 'success', text: `Theme "${theme.displayName}" saved successfully!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Failed to save theme' })
      }
    } catch (error) {
      console.error('Error saving theme:', error)
      setMessage({ type: 'error', text: 'Failed to save theme' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTheme = async (theme: Theme) => {
    try {
      setSaving(true)
      const success = await deleteTheme(theme.name)
      if (success) {
        await refreshThemes()
        if (activeThemeName === theme.name) {
          // If deleted theme was active, switch to default
          await handleThemeSelect(await getTheme('default') || themes[0])
        }
        setMessage({ type: 'success', text: `Theme "${theme.displayName}" deleted successfully!` })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Failed to delete theme' })
      }
    } catch (error) {
      console.error('Error deleting theme:', error)
      setMessage({ type: 'error', text: 'Failed to delete theme' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Appearance Settings</h1>
          <p className="text-gray-600 mt-2">Manage themes for the entire portal</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Active Theme Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Active Theme</h2>
          {themesLoading ? (
            <p className="text-gray-500">Loading themes...</p>
          ) : (
            <div className="flex items-center gap-4">
              <select
                value={activeThemeName}
                onChange={(e) => {
                  const selectedTheme = themes.find(t => t.name === e.target.value)
                  if (selectedTheme) {
                    handleThemeSelect(selectedTheme)
                  }
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {themes.map((theme) => (
                  <option key={theme.name} value={theme.name}>
                    {theme.displayName}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  const selectedTheme = themes.find(t => t.name === activeThemeName)
                  if (selectedTheme) {
                    await handleThemeSelect(selectedTheme)
                  }
                }}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Applying...' : 'Apply Theme'}
              </button>
            </div>
          )}
        </div>

        {/* Theme Management Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Theme Management</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Upload JSON (Advanced)
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Theme
              </button>
            </div>
          </div>

          {themesLoading ? (
            <p className="text-gray-500">Loading themes...</p>
          ) : (
            <ThemeList
              themes={themes}
              activeThemeName={activeThemeName}
              onSelect={handleThemeSelect}
              onEdit={handleEdit}
              onDelete={handleDeleteTheme}
              onDuplicate={handleDuplicate}
            />
          )}
        </div>

        {/* Theme Builder Modal */}
        {showBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-6xl w-full my-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    {editingTheme ? 'Edit Theme' : duplicatingTheme ? 'Duplicate Theme' : 'Create New Theme'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowBuilder(false)
                      setEditingTheme(null)
                      setDuplicatingTheme(null)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <ThemeBuilder
                  initialTheme={editingTheme || undefined}
                  onSave={handleSaveTheme}
                  onCancel={() => {
                    setShowBuilder(false)
                    setEditingTheme(null)
                    setDuplicatingTheme(null)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <ThemeUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSave={handleSaveTheme}
          />
        )}
      </div>
    </AdminLayout>
  )
}
