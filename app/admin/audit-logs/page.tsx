'use client'

import { useState, useEffect } from 'react'
import { AuditLogTimeline } from '@/components/admin/AuditLogTimeline'
import type { MemberAuditLog } from '@/types/database'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ToolbarFilter } from '@/components/ui/Toolbar'
import { FileClockIcon, DownloadIcon } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'

interface AuditLogWithMember extends MemberAuditLog {
  memberName?: string
  membershipId?: string
}

export default function GlobalAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogWithMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionTypeFilter, setActionTypeFilter] = useState('All')
  const [creationSourceFilter, setCreationSourceFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [actionTypeFilter, creationSourceFilter, fromDate, toDate])

  async function fetchLogs() {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (actionTypeFilter !== 'All') params.append('actionType', actionTypeFilter)
      if (creationSourceFilter !== 'All') params.append('creationSource', creationSourceFilter)
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate).toISOString())
      params.append('limit', '100')

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const result = await response.json()

      // Fetch member details for each log
      const logsWithMembers = await Promise.all(
        (result.data || []).map(async (log: MemberAuditLog) => {
          try {
            const memberResponse = await fetch(`/api/members/${log.member_id}`)
            if (memberResponse.ok) {
              const memberData = await memberResponse.json()
              return {
                ...log,
                memberName: `${memberData.first_name} ${memberData.last_name}`,
                membershipId: memberData.membership_id,
              }
            }
          } catch (error) {
            console.warn('Failed to fetch member details:', error)
          }
          return { ...log, memberName: 'Unknown', membershipId: 'N/A' }
        })
      )

      setLogs(logsWithMembers)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)

      const params = new URLSearchParams()
      if (actionTypeFilter !== 'All') params.append('actionType', actionTypeFilter)
      if (creationSourceFilter !== 'All') params.append('creationSource', creationSourceFilter)
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate).toISOString())

      // Note: This would need a separate global export endpoint
      alert('Global audit log export coming soon. For now, please export individual member logs.')
    } catch (error) {
      console.error('Error exporting logs:', error)
    } finally {
      setExporting(false)
    }
  }

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    const memberName = log.memberName?.toLowerCase() || ''
    const membershipId = log.membershipId?.toLowerCase() || ''
    const changedByName = log.changed_by_name?.toLowerCase() || ''

    return (
      memberName.includes(search) ||
      membershipId.includes(search) ||
      changedByName.includes(search)
    )
  })

  // Calculate stats
  const totalChanges = filteredLogs.length
  const thisMonth = filteredLogs.filter(log => {
    const logDate = new Date(log.changed_at)
    const now = new Date()
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
  }).length

  const createdCount = filteredLogs.filter(log => log.action_type === 'CREATED').length
  const idChangesCount = filteredLogs.filter(log => log.action_type === 'MEMBERSHIP_ID_CHANGED').length

  // Most active staff
  const staffActivity = filteredLogs.reduce((acc, log) => {
    if (log.changed_by_name) {
      acc[log.changed_by_name] = (acc[log.changed_by_name] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  const mostActiveStaff = Object.entries(staffActivity).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  const actionTone: Record<string, 'tulsi' | 'saffron' | 'danger' | 'neutral'> = {
    CREATE: 'tulsi',
    UPDATE: 'saffron',
    DELETE: 'danger',
  }

  const columns: Array<Column<AuditLogWithMember>> = [
    {
      key: 'member',
      header: 'Member',
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{l.memberName ?? '\u2014'}</p>
          <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{l.membershipId ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'Action',
      cell: (l) => (
        <Badge tone={actionTone[String(l.action_type)] ?? 'neutral'}>{l.action_type}</Badge>
      ),
    },
    {
      key: 'fields',
      header: 'Changed',
      secondary: true,
      cell: (l) => (
        <span className="truncate text-ink-2">
          {l.field_names?.length ? l.field_names.join(', ') : '\u2014'}
        </span>
      ),
    },
    {
      key: 'changed_by_name',
      header: 'By',
      cell: (l) => (
        <div className="min-w-0">
          <p className="truncate text-ink-2">{l.changed_by_name ?? 'System'}</p>
          {l.changed_by_role && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{l.changed_by_role}</p>
          )}
        </div>
      ),
    },
    {
      key: 'changed_at',
      header: 'When',
      align: 'right',
      sortable: true,
      cell: (l) => <span className="tnum text-ink-2">{formatDate(l.changed_at)}</span>,
    },
  ]

  const mobileCard = (l: AuditLogWithMember) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{l.memberName ?? '\u2014'}</p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{formatDate(l.changed_at)}</p>
        </div>
        <Badge tone={actionTone[String(l.action_type)] ?? 'neutral'}>{l.action_type}</Badge>
      </div>
      <p className="truncate text-[13.5px] text-ink-2">
        {l.field_names?.length ? l.field_names.join(', ') : 'No field detail'} by{' '}
        {l.changed_by_name ?? 'System'}
      </p>
    </div>
  )

  return (
    <AdminListView<AuditLogWithMember>
      eyebrow="Office console"
      title="Audit trail"
      description="Every change made to a member record, and who made it."
      noun="entry"
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
      searchPlaceholder="Search by member, membership number or who changed it..."
      searchFields={(l) => [l.memberName, l.membershipId, l.changed_by_name]}
      /* Action type and creation source are applied in the QUERY. */
      filters={['All', 'CREATE', 'UPDATE', 'DELETE']}
      filterValue={actionTypeFilter}
      onFilterChange={setActionTypeFilter}
      toolbarFilters={
        <ToolbarFilter
          label="Source"
          value={creationSourceFilter}
          onChange={setCreationSourceFilter}
          options={['All', 'admin', 'import', 'self_registration']}
        />
      }
      emptyIcon={FileClockIcon}
      emptyTitle="No audit entries"
      emptyDescription="Changes made to member records will be recorded here automatically."
    />
  )
}
