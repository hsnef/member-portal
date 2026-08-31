'use client'

/**
 * Footer for PUBLIC pages only (login, join, register, terms, unauthorized...).
 *
 * Inside /member and /admin, PortalShell renders its own footer with the same
 * version and deployment strings, so this one hides itself there rather than
 * double-rendering.
 */

import { usePathname } from 'next/navigation'
import { getVersionString, getDeploymentDateString } from '@/lib/constants/version'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

export function AppFooter() {
  const pathname = usePathname() ?? ''

  // PortalShell owns the footer in the authenticated sections.
  if (pathname.startsWith('/member') || pathname.startsWith('/admin')) return null

  return (
    <footer className="mt-auto border-t border-line bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-content">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[13.5px] text-ink-2">
            Copyright &copy; {new Date().getFullYear()}, {TEMPLE_CONFIG.name}, Inc. All Rights
            Reserved.
          </p>
          <p className="text-[12px] text-ink-3">
            A Florida based {TEMPLE_CONFIG.taxExemptStatus}
          </p>
          <p className="tnum text-[12px] text-ink-3">
            Version {getVersionString()} &bull; Deployed {getDeploymentDateString()}
          </p>
        </div>
      </div>
    </footer>
  )
}
