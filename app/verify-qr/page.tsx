'use client'

/**
 * A phone camera opens this address when it reads a membership pass
 * (/verify-qr?token=...). Staff are taken to the desk's check-in page, which
 * checks the pass on the server and shows the member and their standing.
 * Anyone else sees why they cannot use it.
 */

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PageLoading } from '@/components/ui/Skeleton'

function Forward() {
  const router = useRouter()
  const token = useSearchParams().get('token')
  useEffect(() => {
    router.replace(token ? `/admin/scan-qr?token=${encodeURIComponent(token)}` : '/admin/scan-qr')
  }, [router, token])
  return <PageLoading label="Checking the pass…" />
}

export default function VerifyQRPage() {
  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <Suspense fallback={<PageLoading label="Checking the pass…" />}>
        <Forward />
      </Suspense>
    </ProtectedRoute>
  )
}
