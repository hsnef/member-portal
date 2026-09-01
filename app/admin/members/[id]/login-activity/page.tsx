'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { formatLoginMethod, formatLocation, formatUserAgent } from '@/lib/login-audit-log/utils'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
}

interface Member {
  id: string
  membership_id: string
  name: string
}

export default function MemberLoginActivityPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginMethodFilter, setLoginMethodFilter] = useState('All')
  const [successFilter, setSuccessFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [memberId, loginMethodFilter, successFilter, fromDate, toDate])

  async function fetchLogs() {
    try {
      setLoading(true)

      // Build query params
      const queryParams = new URLSearchParams()
      if (loginMethodFilter !== 'All') queryParams.append('loginMethod', loginMethodFilter)
      if (successFilter === 'Success') queryParams.append('success', 'true')
      if (successFilter === 'Failed') queryParams.append('success', 'false')
      if (fromDate) queryParams.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) queryParams.append('toDate', new Date(toDate).toISOString())
      queryParams.append('limit', '100')

      const response = await fetch(`/api/members/${memberId}/login-activity?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch login activity')
      }

      const result = await response.json()
      setLogs(result.data || [])
      setMember(result.member || null)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)

      const queryParams = new URLSearchParams()
      queryParams.append('memberId', memberId)
      if (loginMethodFilter !== 'All') queryParams.append('loginMethod', loginMethodFilter)
      if (successFilter === 'Success') queryParams.append('success', 'true')
      if (successFilter === 'Failed') queryParams.append('success', 'false')
      if (fromDate) queryParams.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) queryParams.append('toDate', new Date(toDate).toISOString())

      const response = await fetch(`/api/admin/login-activity/export?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export login activity')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `login-activity-${member?.membership_id || memberId}-${new Date().toISOString().split('T')[0]}.csv`
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

  // Calculate stats
  const totalLogins = logs.length
  const successfulLogins = logs.filter(log => log.success).length
  const failedLogins = logs.filter(log => !log.success).length
  const lastLogin = logs.length > 0 ? new Date(logs[0].login_at).toLocaleString() : 'Never'

  // Most used login method
  const methodCounts = logs.reduce((acc, log) => {
    acc[log.login_method] = (acc[log.login_method] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const mostUsedMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  const columns: Array<Column<LoginLog>> = [
    {
      key: 'login_at',
      header: 'When',
      sortable: true,
      cell: (l) => (
        <span className="tnum text-ink-2">{new Date(l.login_at).toLocaleString()}</span>
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
        <p className="tnum min-w-0 truncate text-[14px] text-ink">
          {new Date(l.login_at).toLocaleString()}
        </p>
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
        eyebrow={member?.membership_id ?? 'Member'}
        title="Sign-in history"
        description="Every sign-in attempt for this member, successful or not."
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
        searchPlaceholder="Search by IP address or method..."
        searchFields={(l) => [l.ip_address, l.login_method, l.geo_city, l.geo_country]}
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
        emptyDescription="Sign-in attempts for this member will be recorded here automatically."
      >
        {member && (
          <Card tone="sunk" spine="kumkum" className="pl-7">
            <p className="font-serif text-[22px] leading-tight text-ink">
{member.name || member.membership_id}
            </p>
            <p className="tnum mt-1 text-[14px] text-ink-2">{member.membership_id}</p>
          </Card>
        )}
      </AdminListView>
    </ProtectedRoute>
  )
}
