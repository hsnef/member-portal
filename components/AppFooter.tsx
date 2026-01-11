'use client'

import { getVersionString, getDeploymentDateString } from '@/lib/constants/version'

export function AppFooter() {
  const version = getVersionString()
  const deploymentDate = getDeploymentDateString()

  return (
    <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Main copyright */}
          <p className="text-sm text-gray-600">
            Copyright &copy; 2026, Hindu Society of Northeast Florida, Inc. All Rights Reserved.
          </p>

          {/* Nonprofit status */}
          <p className="text-xs text-gray-500">
            A Florida based 501(c)(3) Nonprofit Organization
          </p>

          {/* Version info */}
          <p className="text-xs text-gray-400">
            Version {version} &bull; Deployed {deploymentDate}
          </p>
        </div>
      </div>
    </footer>
  )
}
