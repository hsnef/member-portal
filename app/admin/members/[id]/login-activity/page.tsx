'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { formatLoginMethod, formatLocation, formatUserAgent } from '@/lib/login-audit-log/helpers'

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

export default function MemberLoginActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
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
  }, [params.id, loginMethodFilter, successFilter, fromDate, toDate])

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

      const response = await fetch(`/api/members/${params.id}/login-activity?${queryParams.toString()}`)

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
      queryParams.append('memberId', params.id)
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
      a.download = `login-activity-${member?.membership_id || params.id}-${new Date().toISOString().split('T')[0]}.csv`
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

  return (
    <ProtectedRoute requiredRoles={['Admin', 'Office Manager']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <button
                onClick={() => router.push(`/admin/members/${params.id}`)}
                className="text-sm text-[#FF9933] hover:text-[#FF8800] font-medium mb-2 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Member Details
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Login Activity: {member?.name || 'Loading...'}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Logins</p>
              <p className="text-2xl font-bold text-gray-900">{totalLogins}</p>
              <p className="text-xs text-gray-500 mt-1">
                {successfulLogins} success / {failedLogins} failed
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Last Login</p>
              <p className="text-lg font-bold text-blue-600">{lastLogin}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Most Used Method</p>
              <p className="text-lg font-bold text-purple-600">
                {formatLoginMethod(mostUsedMethod)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Login Method Filter */}
              <div>
                <label htmlFor="loginMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Login Method
                </label>
                <select
                  id="loginMethod"
                  value={loginMethodFilter}
                  onChange={(e) => setLoginMethodFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                >
                  <option value="All">All Methods</option>
                  <option value="google">Google OAuth</option>
                  <option value="magic_link">Magic Link</option>
                  <option value="registration">Registration</option>
                  <option value="session_restored">Session Restored</option>
                </select>
              </div>

              {/* Success Filter */}
              <div>
                <label htmlFor="success" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="success"
                  value={successFilter}
                  onChange={(e) => setSuccessFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                >
                  <option value="All">All Status</option>
                  <option value="Success">Successful</option>
                  <option value="Failed">Failed</option>
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(loginMethodFilter !== 'All' || successFilter !== 'All' || fromDate || toDate) && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setLoginMethodFilter('All')
                    setSuccessFilter('All')
                    setFromDate('')
                    setToDate('')
                  }}
                  className="text-sm text-[#FF9933] hover:text-[#FF8800] font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600">
              <h2 className="text-xl font-semibold text-white">Login History</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading login activity...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 px-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No login activity found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {loginMethodFilter !== 'All' || successFilter !== 'All' || fromDate || toDate
                    ? 'Try adjusting your filters'
                    : 'This member has not logged in yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {/* Status Icon */}
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            log.success ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {log.success ? (
                              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>

                          {/* Login Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {log.success ? 'Successful Login' : 'Failed Login'}
                              </span>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {formatLoginMethod(log.login_method)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(log.login_at).toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                              <p>
                                <span className="font-medium">IP Address:</span> {log.ip_address || 'N/A'}
                              </p>
                              <p>
                                <span className="font-medium">Location:</span> {formatLocation(log.geo_country, log.geo_city)}
                              </p>
                              <p>
                                <span className="font-medium">Device:</span> {formatUserAgent(log.user_agent)}
                              </p>
                              {!log.success && log.failure_reason && (
                                <p className="text-red-600">
                                  <span className="font-medium">Reason:</span> {log.failure_reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {expandedRow === log.id && (
                          <div className="mt-4 pl-13 space-y-2 text-sm border-l-2 border-gray-200 pl-4">
                            <div>
                              <span className="font-medium text-gray-700">Full User Agent:</span>
                              <p className="text-gray-600 text-xs mt-1 break-all">{log.user_agent || 'N/A'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        className="ml-4 text-sm text-[#FF9933] hover:text-[#FF8800] font-medium"
                      >
                        {expandedRow === log.id ? 'Less' : 'More'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Result Count */}
          {!loading && logs.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {logs.length} login events
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
