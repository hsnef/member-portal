'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { formatLoginMethod, formatLocation, formatUserAgent } from '@/lib/login-audit-log/utils'

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

  return (
    <ProtectedRoute requiredRoles={['Admin', 'Office Manager']}>
      <>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Login Activity</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor user login activity and security events
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || filteredLogs.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Logins</p>
              <p className="text-2xl font-bold text-gray-900">{totalLogins}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">{successRate}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {successfulLogins} success / {failedLogins} failed
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-blue-600">{uniqueUserCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Most Common Method</p>
              <p className="text-lg font-bold text-purple-600">
                {formatLoginMethod(mostCommonMethod)}
              </p>
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
                  placeholder="Name, ID, email, IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
                />
              </div>

              {/* Login Method Filter */}
              <div>
                <label htmlFor="loginMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Login Method
                </label>
                <select
                  id="loginMethod"
                  value={loginMethodFilter}
                  onChange={(e) => setLoginMethodFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-saffron-ring focus:border-saffron"
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
            {(searchTerm || loginMethodFilter !== 'All' || successFilter !== 'All' || fromDate || toDate) && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setLoginMethodFilter('All')
                    setSuccessFilter('All')
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

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading login activity...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No login activity found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || loginMethodFilter !== 'All' || successFilter !== 'All' || fromDate || toDate
                    ? 'Try adjusting your filters'
                    : 'No login activity recorded yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log) => (
                      <>
                        <tr key={log.id} className="hover:bg-transparent">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.login_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.member ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.member.first_name} {log.member.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{log.member.membership_id}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unknown</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {formatLoginMethod(log.login_method)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.ip_address || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatLocation(log.geo_country, log.geo_city)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                log.success
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {log.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                              className="text-saffron hover:text-[#FF8800] font-medium"
                            >
                              {expandedRow === log.id ? 'Hide Details' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === log.id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-transparent">
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Email:</span>{' '}
                                  <span className="text-gray-900">{log.member?.primary_email || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Device/Browser:</span>{' '}
                                  <span className="text-gray-900">{formatUserAgent(log.user_agent)}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Full User Agent:</span>{' '}
                                  <span className="text-gray-600 text-xs">{log.user_agent || 'N/A'}</span>
                                </div>
                                {!log.success && log.failure_reason && (
                                  <div>
                                    <span className="font-medium text-red-700">Failure Reason:</span>{' '}
                                    <span className="text-red-600">{log.failure_reason}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Result Count */}
          {!loading && filteredLogs.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} login events
            </div>
          )}
        </div>
      </>
    </ProtectedRoute>
  )
}
