'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AuditLogTimeline } from '@/components/admin/AuditLogTimeline'
import type { MemberAuditLog } from '@/types/database'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ToolbarFilter } from '@/components/ui/Toolbar'
import { FileClockIcon, DownloadIcon } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'

interface Member {
  id: string
  membership_id: string
  name: string
}

export default function MemberAuditLogPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const [logs, setLogs] = useState<MemberAuditLog[]>([])
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionTypeFilter, setActionTypeFilter] = useState('All')
  const [creationSourceFilter, setCreationSourceFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [memberId, actionTypeFilter, creationSourceFilter, fromDate, toDate])

  async function fetchLogs() {
    try {
      setLoading(true)

      // Build query params
      const queryParams = new URLSearchParams()
      if (actionTypeFilter !== 'All') queryParams.append('actionType', actionTypeFilter)
      if (fromDate) queryParams.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) queryParams.append('toDate', new Date(toDate).toISOString())
      queryParams.append('limit', '100')

      // Fetch member info
      const memberResponse = await fetch(`/api/members/${memberId}`)
      if (memberResponse.ok) {
        const memberData = await memberResponse.json()
        setMember({
          id: memberData.id,
          membership_id: memberData.membership_id,
          name: `${memberData.first_name} ${memberData.last_name}`,
        })
      }

      // Fetch audit logs
      const response = await fetch(`/api/members/${memberId}/audit-log?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }

      const result = await response.json()
      setLogs(result.data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)

      const queryParams = new URLSearchParams()
      if (actionTypeFilter !== 'All') queryParams.append('actionType', actionTypeFilter)
      if (fromDate) queryParams.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) queryParams.append('toDate', new Date(toDate).toISOString())

      const response = await fetch(`/api/members/${memberId}/audit-log/export?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to export audit logs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${member?.membership_id || memberId}-${member?.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      alert('Failed to export audit logs')
    } finally {
      setExporting(false)
    }
  }

  // Filter logs by creation source (client-side filter for CREATED actions only)
  const filteredLogs = logs.filter((log) => {
    if (creationSourceFilter === 'All') return true
    if (log.action_type === 'CREATED') {
      return log.creation_source === creationSourceFilter
    }
    return true
  })

  // Calculate stats
  const totalChanges = filteredLogs.length
  const createdCount = filteredLogs.filter(log => log.action_type === 'CREATED').length
  const idChangesCount = filteredLogs.filter(log => log.action_type === 'MEMBERSHIP_ID_CHANGED').length
  const fieldUpdatesCount = filteredLogs.filter(log => log.action_type === 'FIELD_UPDATED').length

  const actionTone: Record<string, 'tulsi' | 'saffron' | 'danger' | 'neutral'> = {
    CREATE: 'tulsi',
    UPDATE: 'saffron',
    DELETE: 'danger',
  }

  const columns: Array<Column<MemberAuditLog>> = [
    {
      key: 'action_type',
      header: 'Action',
      cell: (l) => (
        <Badge tone={actionTone[String(l.action_type)] ?? 'neutral'}>{l.action_type}</Badge>
      ),
    },
    {
      key: 'fields',
      header: 'Fields changed',
      cell: (l) => (
        <span className="truncate text-ink-2">
          {l.field_names?.length ? l.field_names.join(', ') : '\—'}
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
      key: 'change_reason',
      header: 'Reason',
      secondary: true,
      cell: (l) => <span className="truncate text-ink-3">{l.change_reason ?? '\—'}</span>,
    },
    {
      key: 'changed_at',
      header: 'When',
      align: 'right',
      sortable: true,
      cell: (l) => <span className="tnum text-ink-2">{formatDate(l.changed_at)}</span>,
    },
  ]

  const mobileCard = (l: MemberAuditLog) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {l.field_names?.length ? l.field_names.join(', ') : 'Record change'}
          </p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{formatDate(l.changed_at)}</p>
        </div>
        <Badge tone={actionTone[String(l.action_type)] ?? 'neutral'}>{l.action_type}</Badge>
      </div>
      <p className="truncate text-[13.5px] text-ink-2">by {l.changed_by_name ?? 'System'}</p>
    </div>
  )

  return (
    <AdminListView<MemberAuditLog>
      eyebrow={member?.name ?? 'Member'}
      title="Change history"
      description="Every change made to this member's record, and who made it."
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
      searchPlaceholder="Search by field, person or reason..."
      searchFields={(l) => [
        l.field_names?.join(', '),
        l.changed_by_name,
        l.change_reason,
      ]}
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
      emptyTitle="No changes recorded"
      emptyDescription="Edits to this member's record will be logged here automatically."
    >
      {member && (
        <Card tone="sunk" spine="kumkum" className="pl-7">
          <p className="font-serif text-[22px] leading-tight text-ink">{member.name}</p>
          <p className="tnum mt-1 text-[14px] text-ink-2">{member.membership_id}</p>
        </Card>
      )}
    </AdminListView>
  )
}
