'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredRoles?: UserRole[]
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, roles, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // Check if authentication is required
    if (requireAuth && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // Check if specific role is required
    if (requiredRole && !roles.includes(requiredRole)) {
      router.push('/unauthorized')
      return
    }

    // Check if any of the required roles match
    if (requiredRoles && !requiredRoles.some((role) => roles.includes(role))) {
      router.push('/unauthorized')
      return
    }
  }, [user, roles, loading, requireAuth, requiredRole, requiredRoles, router, pathname])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authorized
  if (requireAuth && !user) {
    return null
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    return null
  }

  if (requiredRoles && !requiredRoles.some((role) => roles.includes(role))) {
    return null
  }

  // Render children if authorized
  return <>{children}</>
}
