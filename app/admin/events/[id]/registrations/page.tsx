'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Registration {
  id: string
  member_id: string
  membership_id: string
  registration_date: string
  registration_status: string
  attended: boolean
  payment_status?: string
  member_name?: string
  member_email?: string
  member_phone?: string
}

interface Event {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
  max_capacity: number
  member_price: number
  non_member_price: number
}

export default function EventRegistrationsPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (eventId) {
      fetchEventAndRegistrations()
    }
  }, [eventId])

  const fetchEventAndRegistrations = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Fetch registrations with member details
      const { data: regsData, error: regsError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          members:member_id (
            first_name,
            last_name,
            business_name,
            member_class,
            primary_email,
            primary_phone
          )
        `)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false })

      if (regsError) throw regsError

      // Transform data
      const transformedRegs = (regsData || []).map((reg: any) => ({
        ...reg,
        member_name: reg.members?.member_class === 'Personal'
          ? `${reg.members.first_name} ${reg.members.last_name}`
          : reg.members?.business_name || 'Unknown',
        member_email: reg.members?.primary_email,
        member_phone: reg.members?.primary_phone,
      }))

      setRegistrations(transformedRegs)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (registrationId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ attended })
        .eq('id', registrationId)

      if (error) throw error

      // Update local state
      setRegistrations(registrations.map(reg =>
        reg.id === registrationId ? { ...reg, attended } : reg
      ))
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Failed to update attendance')
    }
  }

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      alert('Registration cancelled successfully')
      fetchEventAndRegistrations()
    } catch (error) {
      console.error('Error cancelling registration:', error)
      alert('Failed to cancel registration')
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    return (
      searchQuery === '' ||
      reg.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.membership_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.member_email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const attendedCount = registrations.filter(r => r.attended).length
  const confirmedCount = registrations.filter(r => r.registration_status === 'Confirmed').length

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/events')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Events
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {event?.event_name || 'Event'} - Registrations
            </h1>
            {event && (
              <p className="mt-1 text-sm text-gray-600">
                {new Date(event.event_date).toLocaleDateString()} at {event.event_time} • {event.location}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Registrations</p>
            <p className="text-2xl font-bold text-gray-900">
              {registrations.length}
              {event && event.max_capacity > 0 && ` / ${event.max_capacity}`}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Attended</p>
            <p className="text-2xl font-bold text-blue-600">{attendedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Attendance Rate</p>
            <p className="text-2xl font-bold text-saffron">
              {registrations.length > 0 ? Math.round((attendedCount / registrations.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            placeholder="Search by name, membership ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
          />
        </div>

        {/* Registrations Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading registrations...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No registrations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reg.member_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reg.membership_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reg.member_email}</div>
                        <div className="text-sm text-gray-500">{reg.member_phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reg.registration_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          reg.registration_status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                          reg.registration_status === 'Waitlist' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reg.registration_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reg.attended}
                            onChange={(e) => handleMarkAttendance(reg.id, e.target.checked)}
                            className="w-5 h-5 text-saffron rounded focus:ring-saffron-ring"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {reg.attended ? 'Present' : 'Mark Present'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Export Options</h3>
          <div className="flex gap-3">
            <button
              onClick={() => alert('Export to CSV coming soon')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-transparent text-sm"
            >
              📥 Export to CSV
            </button>
            <button
              onClick={() => alert('Print attendance list coming soon')}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-transparent text-sm"
            >
              🖨️ Print Attendance List
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
