'use client'

import { useState, useEffect } from 'react'
import { getVersionString, getDeploymentDateString } from '@/lib/constants/version'

export function AppFooter() {
  const [mounted, setMounted] = useState(false)
  const version = getVersionString()
  const deploymentDate = getDeploymentDateString()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use a fixed year during SSR to avoid hydration mismatch
  const year = mounted ? new Date().getFullYear() : 2026

  return (
    <footer className="mt-auto py-4 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span suppressHydrationWarning>© {year} HSNEF Membership Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Version: {version}</span>
            <span className="hidden sm:inline">•</span>
            <span suppressHydrationWarning>Deployed: {deploymentDate}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
