'use client'

/**
 * Member portal layout.
 *
 * Every /member route is authenticated-only with no role restriction, which is
 * exactly what each page's own <ProtectedRoute> already enforced. Hoisting the
 * guard here means one gate for the section instead of 21 copies.
 */

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PortalShell } from '@/components/layout/PortalShell'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PortalShell section="member">{children}</PortalShell>
    </ProtectedRoute>
  )
}
