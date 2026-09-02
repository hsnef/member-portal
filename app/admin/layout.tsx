'use client'

/**
 * Office console layout.
 *
 * The section gate is the DEFAULT for /admin: any staff role. It is deliberately
 * the loosest gate in the section, because tightening it here would silently
 * change access for every page underneath.
 *
 * Pages needing more than staff KEEP their own <ProtectedRoute>, which runs
 * inside this one and further narrows access. Those are:
 *   /admin/login-activity              ['Admin','Office Manager']
 *   /admin/members/[id]/login-activity ['Admin','Office Manager']
 *   /admin/test-accounts               ['Admin','Office Manager']
 *   /admin/zelle/settings              ['Office Manager','Admin']
 *   /admin/settings/staff-roles        ['Admin']
 *   /admin/portal-settings             ['Office Manager','Admin']
 *   /admin/settings/appearance          Admin (inline check in the page)
 *
 * Do not remove a page's own guard on the assumption this layout covers it.
 */

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PortalShell } from '@/components/layout/PortalShell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <PortalShell section="admin">{children}</PortalShell>
    </ProtectedRoute>
  )
}
