'use client'

import { getVersionString, getDeploymentDateString } from '@/lib/constants/version'

export function AppFooter() {
  const version = getVersionString()
  const deploymentDate = getDeploymentDateString()

  return (
    <footer className="mt-auto py-4 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} HSNEF Membership Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Version: {version}</span>
            <span className="hidden sm:inline">•</span>
            <span>Deployed: {deploymentDate}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
