'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { ActivityView } from '@/components/member/ActivityView'
import { createClient } from '@/lib/supabase/client'
import type { ActivityType } from '@/types/database'
import type { ActivityItem } from '@/components/member/ActivityView'

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

  const activityTypes: Array<ActivityType | 'All'> = [
    'All',
    ...(Array.from(new Set(activities.map((a) => a.activity_type))) as ActivityType[]).sort(),
  ]

  return (
    <ActivityView
      grouped={groupedActivities}
      loading={loading}
      stats={stats}
      types={activityTypes}
      filterType={filterType}
      onFilterTypeChange={setFilterType}
      year={filterYear}
      availableYears={availableYears}
      onYearChange={setFilterYear}
    />
  )
}
