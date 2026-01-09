'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function SettingsPage() {
  const router = useRouter()

  const settingsCategories = [
    {
      title: 'Portal Settings',
      description: 'Configure authentication, registration, and portal-wide settings',
      icon: (
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      href: '/admin/portal-settings',
      roles: ['Admin', 'Office Manager'],
    },
    {
      title: 'Test Accounts',
      description: 'Manage test accounts with data isolation and toggle visibility. Test users see only test data, staff can toggle test data visibility',
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      href: '/admin/test-accounts',
      roles: ['Admin', 'Office Manager'],
    },
    {
      title: 'Import History',
      description: 'View and manage CSV import batches, revert imports',
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      href: '/admin/members/import-history',
      roles: ['Admin', 'Office Manager', 'Office Staff'],
    },
    {
      title: 'Member Data Import',
      description: 'Import member data from CSV files',
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/admin/members/import',
      roles: ['Admin', 'Office Manager', 'Office Staff'],
    },
    {
      title: 'Services Management',
      description: 'Configure service catalog and pricing',
      icon: (
        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/admin/services',
      roles: ['Admin', 'Office Manager', 'Office Staff'],
    },
    {
      title: 'Purohits Management',
      description: 'Manage priest profiles and availability',
      icon: (
        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: '/admin/purohits',
      roles: ['Admin', 'Office Manager', 'Office Staff'],
    },
    {
      title: 'Event Management',
      description: 'Configure events and registration settings',
      icon: (
        <svg className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/admin/events',
      roles: ['Admin', 'Office Manager', 'Office Staff'],
    },
    {
      title: 'Member Audit Logs',
      description: 'View complete history of member record changes',
      icon: (
        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/admin/audit-logs',
      roles: ['Admin', 'Office Manager', 'Office Staff'],
    },
  ]

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              System configuration and management tools
            </p>
          </div>

          {/* System Information */}
          <div className="bg-gradient-to-r from-[#FF9933] to-[#800000] rounded-lg shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">HSNEF Member Portal</h2>
            <p className="text-white/90">Hindu Society of North East Florida</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-white/70">Version</p>
                <p className="font-semibold">1.0.0</p>
              </div>
              <div>
                <p className="text-white/70">Environment</p>
                <p className="font-semibold">Production</p>
              </div>
              <div>
                <p className="text-white/70">Database</p>
                <p className="font-semibold">Supabase</p>
              </div>
            </div>
          </div>

          {/* Settings Categories */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settingsCategories.map((category) => (
                <button
                  key={category.href}
                  onClick={() => router.push(category.href)}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-shrink-0">{category.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="mt-4 text-sm text-[#FF9933] font-medium">
                    Configure →
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Voting Module - Elections and polls for members (Phase 2)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Email Templates - Customize automated email notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Reports & Analytics - Advanced reporting and insights</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Role Permissions - Fine-grained access control settings</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/admin/members')}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">View All Members</div>
                <div className="text-sm text-gray-600">Manage member database</div>
              </button>
              <button
                onClick={() => router.push('/admin/payments')}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">Record Payment</div>
                <div className="text-sm text-gray-600">Add new payment record</div>
              </button>
              <button
                onClick={() => router.push('/admin/bookings')}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">View Bookings</div>
                <div className="text-sm text-gray-600">Manage service bookings</div>
              </button>
              <button
                onClick={() => router.push('/admin/events')}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-md text-left transition-colors"
              >
                <div className="font-semibold text-gray-900">Manage Events</div>
                <div className="text-sm text-gray-600">Create and configure events</div>
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
