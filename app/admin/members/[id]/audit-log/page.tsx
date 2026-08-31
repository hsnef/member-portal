'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AuditLogTimeline } from '@/components/admin/AuditLogTimeline'
import type { MemberAuditLog } from '@/types/database'

interface Member {
  id: string
  membership_id: string
  name: string
}

export default function MemberAuditLogPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = memberId as string
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

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={() => router.push(`/admin/members/${memberId}`)}
              className="text-sm text-saffron hover:text-[#FF8800] font-medium mb-2 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Member Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Audit Log: {member?.name || 'Loading...'}
            </h1>
            {member && (
              <p className="mt-1 text-sm text-gray-600">
                Member ID: {member.membership_id}
              </p>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || logs.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Changes</p>
            <p className="text-2xl font-bold text-gray-900">{totalChanges}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Member Created</p>
            <p className="text-2xl font-bold text-green-600">{createdCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">ID Changes</p>
            <p className="text-2xl font-bold text-purple-600">{idChangesCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Field Updates</p>
            <p className="text-2xl font-bold text-blue-600">{fieldUpdatesCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Creation Source Filter (only for CREATED) */}
            <div>
              <label htmlFor="creationSource" className="block text-sm font-medium text-gray-700 mb-1">
                Creation Source
              </label>
              <select
                id="creationSource"
                value={creationSourceFilter}
                onChange={(e) => setCreationSourceFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                disabled={actionTypeFilter !== 'All' && actionTypeFilter !== 'CREATED'}
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
          {(actionTypeFilter !== 'All' || creationSourceFilter !== 'All' || fromDate || toDate) && (
            <div className="mt-3">
              <button
                onClick={() => {
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
            <h2 className="text-xl font-semibold text-white">Change History</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading audit log...</p>
            </div>
          ) : (
            <div className="p-6">
              <AuditLogTimeline auditLogs={filteredLogs} showMemberName={false} />
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
