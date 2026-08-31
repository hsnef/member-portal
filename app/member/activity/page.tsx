'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { LedgerEntry, ActivityType } from '@/types/database'

interface ActivityItem extends LedgerEntry {
  event?: {
    name: string
    event_date: string
  }
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'Visit': return '🛕'
    case 'Puja': return '🙏'
    case 'Event': return '🎫'
    case 'Donation': return '💝'
    case 'Service': return '⚙️'
    case 'Membership': return '📋'
    default: return '📌'
  }
}

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'Visit': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'Puja': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'Event': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'Donation': return 'text-green-600 bg-green-50 border-green-200'
    case 'Service': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
    case 'Membership': return 'text-teal-600 bg-teal-50 border-teal-200'
    default: return 'text-gray-600 bg-transparent border-gray-200'
  }
}

export default function MemberActivityPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<ActivityType | 'All'>('All')
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    if (!member) return
    fetchActivities()
  }, [member])

  const fetchActivities = async () => {
    if (!member) return

    try {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select(`
          *,
          event:events(name, event_date)
        `)
        .eq('member_id', member.id)
        .order('activity_date', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const activityYear = new Date(activity.activity_date).getFullYear()
    const matchesYear = activityYear === filterYear
    const matchesType = filterType === 'All' || activity.activity_type === filterType
    return matchesYear && matchesType
  })

  // Group activities by month
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const monthYear = new Date(activity.activity_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(activity)
    return groups
  }, {} as Record<string, ActivityItem[]>)

  // Get available years
  const availableYears = Array.from(
    new Set(activities.map((a) => new Date(a.activity_date).getFullYear()))
  ).sort((a, b) => b - a)

  // If no years available, add current year
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear())
  }

  // Calculate stats
  const stats = {
    totalActivities: filteredActivities.length,
    visits: filteredActivities.filter((a) => a.activity_type === 'Visit').length,
    pujas: filteredActivities.filter((a) => a.activity_type === 'Puja').length,
    events: filteredActivities.filter((a) => a.activity_type === 'Event').length,
    donations: filteredActivities
      .filter((a) => a.activity_type === 'Donation')
      .reduce((sum, a) => sum + (a.amount || 0), 0),
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center bg-transparent">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading activity...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-transparent">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/member')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your temple visits, services, and engagement history
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalActivities}</p>
              <p className="text-xs text-gray-600">Total Activities</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.visits}</p>
              <p className="text-xs text-gray-600">Temple Visits</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.pujas}</p>
              <p className="text-xs text-gray-600">Pujas</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.events}</p>
              <p className="text-xs text-gray-600">Events</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-2xl font-bold text-green-600">${stats.donations.toFixed(0)}</p>
              <p className="text-xs text-gray-600">Donations</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent text-sm"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ActivityType | 'All')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent text-sm"
                >
                  <option value="All">All Activities</option>
                  <option value="Visit">Temple Visits</option>
                  <option value="Puja">Pujas</option>
                  <option value="Event">Events</option>
                  <option value="Donation">Donations</option>
                  <option value="Service">Services</option>
                  <option value="Membership">Membership</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Found</h3>
              <p className="text-gray-600 mb-6">
                {filterType !== 'All'
                  ? `No ${filterType.toLowerCase()} activities found for ${filterYear}.`
                  : `No activities recorded for ${filterYear}.`}
              </p>
              <p className="text-sm text-gray-500">
                Your temple visits, event registrations, and service bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedActivities).map(([monthYear, monthActivities]) => (
                <div key={monthYear}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-gradient-to-b from-orange-50 to-transparent py-2">
                    {monthYear}
                  </h2>
                  <div className="space-y-3">
                    {monthActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-white shadow rounded-lg p-4 flex items-start gap-4"
                      >
                        <div className="text-3xl">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getActivityColor(activity.activity_type)}`}>
                              {activity.activity_type}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(activity.activity_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {activity.description}
                          </p>
                          {activity.event && (
                            <p className="text-sm text-gray-600 mt-1">
                              Event: {activity.event.name}
                            </p>
                          )}
                          {activity.amount && activity.amount > 0 && (
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              ${activity.amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">About Activity History</h3>
            <p className="text-sm text-blue-700">
              This page shows your engagement with the temple including visits (checked in via QR code),
              puja bookings, event registrations, donations, and other services. Activity is automatically
              recorded when you check in at the temple or complete transactions through the portal.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
