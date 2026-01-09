'use client'

/**
 * Test Data Context
 *
 * Manages the "Show Test Data" toggle state for Admin/Manager/Staff users
 * - Default: false (production data only)
 * - When enabled: Shows test data with 🧪 badges
 * - Persists to localStorage
 * - Only accessible to staff roles
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface TestDataContextType {
  showTestData: boolean
  toggleTestData: () => void
  canToggleTestData: boolean // Only staff can toggle
}

const TestDataContext = createContext<TestDataContextType | undefined>(undefined)

const STORAGE_KEY = 'hsnef_show_test_data'

export function TestDataProvider({ children }: { children: ReactNode }) {
  const { hasAnyRole } = useAuth()
  const [showTestData, setShowTestData] = useState(false)
  const [canToggleTestData, setCanToggleTestData] = useState(false)

  // Check if user has staff permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const isStaff = hasAnyRole(['Admin', 'Office Manager', 'Office Staff'])
      setCanToggleTestData(isStaff)

      // Load saved preference from localStorage (staff only)
      if (isStaff) {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === 'true') {
          setShowTestData(true)
        }
      } else {
        // Non-staff users never see test data
        setShowTestData(false)
      }
    }

    checkPermissions()
  }, [hasAnyRole])

  const toggleTestData = () => {
    if (!canToggleTestData) return // Only staff can toggle

    const newValue = !showTestData
    setShowTestData(newValue)
    localStorage.setItem(STORAGE_KEY, String(newValue))
  }

  return (
    <TestDataContext.Provider value={{ showTestData, toggleTestData, canToggleTestData }}>
      {children}
    </TestDataContext.Provider>
  )
}

export function useTestData() {
  const context = useContext(TestDataContext)
  if (context === undefined) {
    throw new Error('useTestData must be used within a TestDataProvider')
  }
  return context
}
