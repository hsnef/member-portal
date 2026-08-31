'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import type { UserRole } from '@/types/database'
import TermsAcceptanceModal from '@/components/TermsAcceptanceModal'
import { TestDataToggle } from '@/components/admin/TestDataToggle'

// Icon Components
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const QrCodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
)

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CurrencyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TempleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ChevronIcon = ({ className, expanded }: { className?: string; expanded: boolean }) => (
  <svg
    className={`${className} transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

// Menu structure with groups
interface MenuItem {
  name: string
  href: string
  allowedRoles: UserRole[]
}

interface MenuGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: UserRole[]
  items: MenuItem[]
  basePath: string // Used to determine if group should be expanded
}

interface TopLevelItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: UserRole[]
}

const topLevelItems: TopLevelItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: DashboardIcon,
    allowedRoles: ['Member', 'Office Staff', 'Office Manager', 'Admin'],
  },
  {
    name: 'Scan QR Code',
    href: '/admin/scan-qr',
    icon: QrCodeIcon,
    allowedRoles: ['Office Staff', 'Office Manager', 'Admin'],
  },
]

const menuGroups: MenuGroup[] = [
  {
    name: 'Members',
    icon: UsersIcon,
    allowedRoles: ['Office Staff', 'Office Manager', 'Admin'],
    basePath: '/admin/members',
    items: [
      { name: 'Directory', href: '/admin/members', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Applications', href: '/admin/pending-registrations', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
    ],
  },
  {
    name: 'Finance',
    icon: CurrencyIcon,
    allowedRoles: ['Office Staff', 'Office Manager', 'Admin'],
    basePath: '/admin/payments',
    items: [
      { name: 'Payments', href: '/admin/payments', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Receipts', href: '/admin/receipts', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Zelle', href: '/admin/zelle', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
    ],
  },
  {
    name: 'Temple Services',
    icon: TempleIcon,
    allowedRoles: ['Office Staff', 'Office Manager', 'Admin'],
    basePath: '/admin/events',
    items: [
      { name: 'Events', href: '/admin/events', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Bookings', href: '/admin/bookings', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Service Catalog', href: '/admin/services', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Requests', href: '/admin/requests', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
    ],
  },
  {
    name: 'Settings',
    icon: CogIcon,
    allowedRoles: ['Office Staff', 'Office Manager', 'Admin'],
    basePath: '/admin/settings',
    items: [
      { name: 'Portal Settings', href: '/admin/settings', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
      { name: 'Staff Roles', href: '/admin/settings/staff-roles', allowedRoles: ['Admin'] },
      { name: 'Activity Logs', href: '/admin/login-activity', allowedRoles: ['Office Manager', 'Admin'] },
      { name: 'Audit Trail', href: '/admin/audit-logs', allowedRoles: ['Office Staff', 'Office Manager', 'Admin'] },
    ],
  },
]

// Helper to check if a path is active within a group
const isPathInGroup = (pathname: string, group: MenuGroup): boolean => {
  return group.items.some(item =>
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const pathname = usePathname()
  const { user, member, roles, signOut } = useAuth()

  // Auto-expand group that contains current path
  useEffect(() => {
    menuGroups.forEach(group => {
      if (isPathInGroup(pathname, group) && !expandedGroups.includes(group.name)) {
        setExpandedGroups(prev => [...prev, group.name])
      }
    })
  }, [pathname])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  // Filter based on roles
  const visibleTopItems = topLevelItems.filter(item =>
    item.allowedRoles.some(role => roles.includes(role))
  )

  const visibleGroups = menuGroups
    .filter(group => group.allowedRoles.some(role => roles.includes(role)))
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.allowedRoles.some(role => roles.includes(role)))
    }))
    .filter(group => group.items.length > 0)

  // Render navigation content (shared between mobile and desktop)
  const renderNavContent = (onItemClick?: () => void) => (
    <>
      {/* Top level items */}
      {visibleTopItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`))
        const isExactDashboard = item.href === '/admin' && pathname === '/admin'
        const shouldHighlight = isExactDashboard || (item.href !== '/admin' && isActive)

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
              shouldHighlight
                ? 'bg-orange-50 text-saffron'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
            {item.name}
          </Link>
        )
      })}

      {/* Divider */}
      <div className="my-3 border-t border-gray-200" />

      {/* Grouped items */}
      {visibleGroups.map((group) => {
        const isExpanded = expandedGroups.includes(group.name)
        const isGroupActive = isPathInGroup(pathname, group)

        return (
          <div key={group.name} className="space-y-0.5">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.name)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                isGroupActive
                  ? 'bg-orange-50/50 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <group.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isGroupActive ? 'text-saffron' : ''}`} />
                {group.name}
              </div>
              <ChevronIcon className="w-4 h-4 text-gray-400" expanded={isExpanded} />
            </button>

            {/* Group items */}
            {isExpanded && (
              <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-saffron font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <>
      <TermsAcceptanceModal />

      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
              <div className="flex items-center justify-between h-14 px-4 bg-kumkum">
                <span className="text-lg font-bold text-white">HSNEF Admin</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
                {renderNavContent(() => setSidebarOpen(false))}
              </nav>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
          <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
            <div className="flex items-center h-14 px-4 bg-kumkum">
              <span className="text-lg font-bold text-white">HSNEF Admin</span>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {renderNavContent()}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-60">
          {/* Top navbar */}
          <div className="sticky top-0 z-10 flex h-14 bg-white border-b border-gray-200 shadow-sm">
            <button
              type="button"
              className="px-4 text-gray-500 focus:outline-none lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center justify-between flex-1 px-4">
              <div className="flex-1" />

              <div className="flex items-center gap-3">
                <TestDataToggle />

                <Link
                  href="/member"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:text-saffron hover:bg-orange-50 rounded-md transition-colors"
                  title="View Member Portal"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Member View
                </Link>

                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">
                    {member?.member_profile_name || member?.first_name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member?.membership_id || roles.join(', ') || 'Member'}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    await signOut()
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="py-4 flex-1">
            <div className="px-4 mx-auto max-w-7xl sm:px-6">{children}</div>
          </main>
        </div>
      </div>
    </>
  )
}
