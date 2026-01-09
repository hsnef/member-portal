'use client'

/**
 * Test Data Toggle Component
 *
 * Allows Admin/Manager/Staff to toggle visibility of test data
 * - Appears in admin navigation bar
 * - Shows current state
 * - Persists preference
 * - Only visible to staff roles
 */

import { useTestData } from '@/lib/context/TestDataContext'

export function TestDataToggle() {
  const { showTestData, toggleTestData, canToggleTestData } = useTestData()

  // Only show to staff
  if (!canToggleTestData) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      <span className="text-sm font-medium text-gray-700">Test Data:</span>
      <button
        onClick={toggleTestData}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          showTestData ? 'bg-purple-600' : 'bg-gray-200'
        }`}
        aria-label="Toggle test data visibility"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            showTestData ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-xs font-semibold ${showTestData ? 'text-purple-600' : 'text-gray-500'}`}>
        {showTestData ? (
          <>
            <span className="mr-1">🧪</span>
            SHOWING
          </>
        ) : (
          'HIDDEN'
        )}
      </span>
    </div>
  )
}
