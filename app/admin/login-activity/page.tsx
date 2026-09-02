'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { formatLoginMethod, formatLocation, formatUserAgent } from '@/lib/login-audit-log/utils'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ToolbarFilter } from '@/components/ui/Toolbar'
import { ShieldCheckIcon, DownloadIcon } from 'lucide-react'
import type { Column } from '@/components/ui/DataTable'

interface LoginLog {
  id: string
  auth_user_id: string | null
  member_id: string | null
  login_method: string
  ip_address: string | null
  user_agent: string | null
  geo_country: string | null
  geo_city: string | null
  success: boolean
  failure_reason: string | null
  login_at: string
  member?: {
    first_name: string
    last_name: string
    membership_id: string
    primary_email: string
  }
}

export default function LoginActivityPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [loginMethodFilter, setLoginMethodFilter] = useState('All')
  const [successFilter, setSuccessFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [loginMethodFilter, successFilter, fromDate, toDate])

  async function fetchLogs() {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (loginMethodFilter !== 'All') params.append('loginMethod', loginMethodFilter)
      if (successFilter === 'Success') params.append('success', 'true')
      if (successFilter === 'Failed') params.append('success', 'false')
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate).toISOString())
      params.append('limit', '100')

      const response = await fetch(`/api/admin/login-activity?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch login activity')
      }

      const result = await response.json()
      setLogs(result.data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)

      // Build query params
      const params = new URLSearchParams()
      if (loginMethodFilter !== 'All') params.append('loginMethod', loginMethodFilter)
      if (successFilter === 'Success') params.append('success', 'true')
      if (successFilter === 'Failed') params.append('success', 'false')
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate).toISOString())

      const response = await fetch(`/api/admin/login-activity/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export login activity')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `login-activity-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting logs:', error)
      alert('Failed to export login activity')
    } finally {
      setExporting(false)
    }
  }

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    const memberName = log.member
      ? `${log.member.first_name} ${log.member.last_name}`.toLowerCase()
      : ''
    const membershipId = log.member?.membership_id.toLowerCase() || ''
    const email = log.member?.primary_email.toLowerCase() || ''
    const ipAddress = log.ip_address?.toLowerCase() || ''

    return (
      memberName.includes(search) ||
      membershipId.includes(search) ||
      email.includes(search) ||
      ipAddress.includes(search)
    )
  })

  // Calculate stats
  const totalLogins = filteredLogs.length
  const successfulLogins = filteredLogs.filter(log => log.success).length
  const failedLogins = filteredLogs.filter(log => !log.success).length
  const successRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(1) : '0'

  // Get unique users
  const uniqueUsers = new Set(filteredLogs.filter(log => log.member_id).map(log => log.member_id))
  const uniqueUserCount = uniqueUsers.size

  // Most common login method
  const methodCounts = filteredLogs.reduce((acc, log) => {
    acc[log.login_method] = (acc[log.login_method] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const mostCommonMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  const columns: Array<Column<LoginLog>> = [
    {
      key: 'member',
      header: 'Who',
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {l.member
              ? [l.member.first_name, l.member.last_name].filter(Boolean).join(' ')
              : 'Unknown'}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">
            {l.member?.primary_email ?? l.member?.membership_id ?? ''}
          </p>
        </div>
      ),
    },
    {
      key: 'login_at',
      header: 'When',
      sortable: true,
      cell: (l) => (
        <span className="tnum text-ink-2">
          {new Date(l.login_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'login_method',
      header: 'Method',
      cell: (l) => <Badge tone="neutral">{l.login_method}</Badge>,
    },
    {
      key: 'where',
      header: 'From',
      secondary: true,
      cell: (l) => (
        <div className="min-w-0">
          <p className="tnum truncate text-ink-2">{l.ip_address ?? '\—'}</p>
          {(l.geo_city || l.geo_country) && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">
              {[l.geo_city, l.geo_country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'success',
      header: 'Result',
      align: 'right',
      cell: (l) =>
        l.success ? (
          <Badge tone="tulsi">Signed in</Badge>
        ) : (
          <Badge tone="danger">{l.failure_reason || 'Failed'}</Badge>
        ),
    },
  ]

  const mobileCard = (l: LoginLog) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {l.member
              ? [l.member.first_name, l.member.last_name].filter(Boolean).join(' ')
              : 'Unknown'}
          </p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">
            {new Date(l.login_at).toLocaleString()}
          </p>
        </div>
        {l.success ? (
          <Badge tone="tulsi">Signed in</Badge>
        ) : (
          <Badge tone="danger">Failed</Badge>
        )}
      </div>
      <p className="tnum truncate text-[13.5px] text-ink-2">
        {l.login_method} \· {l.ip_address ?? 'no IP'}
        {l.geo_city ? ` \· ${l.geo_city}` : ''}
      </p>
    </div>
  )

  return (
    <ProtectedRoute requiredRoles={['Admin', 'Office Manager']}>
      <AdminListView<LoginLog>
        eyebrow="Office console"
        title="Sign-in activity"
        description="Every sign-in attempt across the portal, successful or not."
        noun="sign-in"
        actions={
          <Button
            variant="secondary"
            icon={DownloadIcon}
            loading={exporting}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        }
        rows={logs}
        columns={columns}
        rowKey={(l) => l.id}
        mobileCard={mobileCard}
        loading={loading}
        searchPlaceholder="Search by name, email, membership number or IP..."
        searchFields={(l) => [
          l.member ? `${l.member.first_name} ${l.member.last_name}` : null,
          l.member?.membership_id,
          l.member?.primary_email,
          l.ip_address,
        ]}
        /* Method and success are applied in the QUERY. */
        filters={['All', 'true', 'false']}
        filterLabels={{ All: 'All', true: 'Successful', false: 'Failed' }}
        filterValue={successFilter}
        onFilterChange={setSuccessFilter}
        toolbarFilters={
          <ToolbarFilter
            label="Method"
            value={loginMethodFilter}
            onChange={setLoginMethodFilter}
            options={['All', 'google', 'magic_link', 'password']}
          />
        }
        emptyIcon={ShieldCheckIcon}
        emptyTitle="No sign-in activity"
        emptyDescription="Sign-in attempts are recorded here automatically, successful or not."
      />
    </ProtectedRoute>
  )
}
