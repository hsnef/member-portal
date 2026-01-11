/**
 * Theme Provider Component
 * 
 * Wraps the application and applies the active theme globally.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { getActiveThemeName, getTheme, applyTheme } from '../utils/themeManager'
import type { Theme } from '../types'

interface ThemeContextValue {
  activeTheme: Theme | null
  loading: boolean
  refreshTheme: () => Promise<void>
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  activeTheme: null,
  loading: true,
  refreshTheme: async () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTheme = async () => {
    try {
      setLoading(true)
      const themeName = await getActiveThemeName()
      const theme = await getTheme(themeName)
      
      if (theme) {
        setActiveTheme(theme)
        await applyTheme(themeName)
      } else {
        // Fallback to default theme
        const defaultTheme = await getTheme('default')
        if (defaultTheme) {
          setActiveTheme(defaultTheme)
          await applyTheme('default')
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error)
      // Fallback to default theme
      try {
        const defaultTheme = await getTheme('default')
        if (defaultTheme) {
          setActiveTheme(defaultTheme)
          await applyTheme('default')
        }
      } catch (fallbackError) {
        console.error('Error loading default theme:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTheme()
  }, [])

  const refreshTheme = async () => {
    await loadTheme()
  }

  return (
    <ThemeContext.Provider value={{ activeTheme, loading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
