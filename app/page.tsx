'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user, roles, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Route based on roles
        const hasStaffRole = roles.some(role =>
          ['Admin', 'Office Manager', 'Office Staff'].includes(role)
        )
        if (hasStaffRole) {
          router.push('/admin')
        } else {
          // Regular members go to member portal
          router.push('/member')
        }
      } else {
        router.push('/login')
      }
    }
  }, [user, roles, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
