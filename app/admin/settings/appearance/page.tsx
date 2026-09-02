/**
 * Appearance Settings Page
 * 
 * Admin page for theme selection and management (Super Admin only).
 */

'use client'

import { useState, useEffect } from 'react'
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
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { PaletteIcon, PlusIcon, UploadIcon } from 'lucide-react'

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
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading themes...</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Appearance"
        description="The portal's theme: colours, fonts, spacing and corner radius."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={UploadIcon} onClick={() => setShowUploadModal(true)}>
              Upload a theme
            </Button>
            <Button icon={PlusIcon} onClick={handleCreateNew}>
              New theme
            </Button>
          </div>
        }
      />

      {message && (
        <Alert
          tone={message.type === 'success' ? 'success' : 'danger'}
          title={message.type === 'success' ? 'Saved' : "That didn't work"}
        >
          {message.text}
        </Alert>
      )}

      {/* The design system reads its colours through the active theme -- see
          DEC-001 in docs/PROJECT-HUB.md. Editing the built-in HSNEF theme
          changes the portal's own palette, so say so plainly. */}
      <Alert tone="info" title="Themes drive the portal's design system">
        The active theme supplies the colours and fonts the whole portal uses. To try something
        new, duplicate a theme and edit the copy rather than changing the one that is live.
      </Alert>

      <Card>
        <CardHeader
          title="Themes"
          description="Select one to make it active for every member and staff member."
        />
        <ThemeList
          themes={themes}
          activeThemeName={activeThemeName}
          onSelect={handleThemeSelect}
          onEdit={handleEdit}
          onDelete={handleDeleteTheme}
          onDuplicate={handleDuplicate}
        />
      </Card>

      {/* The builder and upload modal internals are left exactly as they were;
          only their surrounding chrome is restyled. */}
      <Modal
        open={showBuilder}
        onClose={() => {
          setShowBuilder(false)
          setEditingTheme(null)
          setDuplicatingTheme(null)
        }}
        variant="panel"
        width="lg"
        title={editingTheme ? 'Edit theme' : 'New theme'}
      >
        <ThemeBuilder
          initialTheme={editingTheme || undefined}
          onSave={handleSaveTheme}
          onCancel={() => {
            setShowBuilder(false)
            setEditingTheme(null)
            setDuplicatingTheme(null)
          }}
        />
      </Modal>

      {showUploadModal && (
        <ThemeUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSave={handleSaveTheme}
        />
      )}
    </div>
  )
}
