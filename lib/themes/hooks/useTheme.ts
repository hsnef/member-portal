/**
 * useTheme Hook
 * 
 * Hook to access theme context.
 */

import { useContext } from 'react'
import { ThemeContext } from '../components/ThemeProvider'

export function useTheme() {
  return useContext(ThemeContext)
}
