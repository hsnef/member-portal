/**
 * useThemes Hook
 * 
 * Hook to manage themes list.
 */

import { useState, useEffect } from 'react'
import { getAllThemes, getTheme } from '../utils/themeManager'
import type { Theme } from '../types'

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      setLoading(true)
      setError(null)
      const allThemes = await getAllThemes()
      setThemes(allThemes)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load themes'))
    } finally {
      setLoading(false)
    }
  }

  const refreshTheme = async (themeName: string) => {
    try {
      const theme = await getTheme(themeName)
      if (theme) {
        setThemes((prev) => {
          const index = prev.findIndex((t) => t.name === themeName)
          if (index >= 0) {
            const updated = [...prev]
            updated[index] = theme
            return updated
          }
          return [...prev, theme]
        })
      }
    } catch (err) {
      console.error('Error refreshing theme:', err)
    }
  }

  return {
    themes,
    loading,
    error,
    refreshThemes: loadThemes,
    refreshTheme,
  }
}
