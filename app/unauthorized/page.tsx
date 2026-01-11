'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

export default function UnauthorizedPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Content */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don&apos;t have permission to access this page. Your account may not have the required role.
            </p>
            {user && (
              <p className="text-sm text-gray-500">
                Signed in as: <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {user ? (
              <>
                <Link
                  href="/member"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-[#FF9933] to-[#800000] text-white rounded-md hover:from-[#FF8800] hover:to-[#700000] transition-all"
                >
                  Go to Member Portal
                </Link>
                <button
                  onClick={async () => {
                    await signOut()
                    window.location.href = '/login'
                  }}
                  className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block w-full px-4 py-2 bg-gradient-to-r from-[#FF9933] to-[#800000] text-white rounded-md hover:from-[#FF8800] hover:to-[#700000] transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Help */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need access?{' '}
              <a
                href="mailto:info@hsnef.org"
                className="text-[#FF9933] hover:text-[#FF8800] font-medium"
              >
                Contact an administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
