'use client'

import { useState, useEffect } from 'react'
import { AuditLogTimeline } from '@/components/admin/AuditLogTimeline'
import type { MemberAuditLog } from '@/types/database'

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

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Member Audit Logs</h1>
            <p className="mt-1 text-sm text-gray-600">
              View complete history of member record changes
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Changes</p>
            <p className="text-2xl font-bold text-gray-900">{totalChanges}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Changes This Month</p>
            <p className="text-2xl font-bold text-blue-600">{thisMonth}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Member Creations</p>
            <p className="text-2xl font-bold text-green-600">{createdCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">ID Changes</p>
            <p className="text-2xl font-bold text-purple-600">{idChangesCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Member name, ID, staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              />
            </div>

            {/* Action Type Filter */}
            <div>
              <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                id="actionType"
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              >
                <option value="All">All Actions</option>
                <option value="CREATED">Created</option>
                <option value="MEMBERSHIP_ID_CHANGED">ID Changed</option>
                <option value="FIELD_UPDATED">Field Updated</option>
                <option value="BULK_UPDATE">Bulk Update</option>
              </select>
            </div>

            {/* Creation Source Filter */}
            <div>
              <label htmlFor="creationSource" className="block text-sm font-medium text-gray-700 mb-1">
                Creation Source
              </label>
              <select
                id="creationSource"
                value={creationSourceFilter}
                onChange={(e) => setCreationSourceFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              >
                <option value="All">All Sources</option>
                <option value="AUTO_IMPORT">Auto Import</option>
                <option value="SELF_REGISTRATION">Self Registration</option>
                <option value="OFFICE_STAFF">Office Staff</option>
                <option value="OFFICE_MANAGER">Office Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              />
            </div>

            {/* To Date */}
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || actionTypeFilter !== 'All' || creationSourceFilter !== 'All' || fromDate || toDate) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setActionTypeFilter('All')
                  setCreationSourceFilter('All')
                  setFromDate('')
                  setToDate('')
                }}
                className="text-sm text-saffron hover:text-[#FF8800] font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600">
            <h2 className="text-xl font-semibold text-white">All Member Changes</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading audit logs...</p>
            </div>
          ) : (
            <div className="p-6">
              <AuditLogTimeline auditLogs={filteredLogs} showMemberName={true} />
            </div>
          )}
        </div>

        {/* Result Count */}
        {!loading && filteredLogs.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {logs.length} audit entries
          </div>
        )}
      </div>
    </>
  )
}
