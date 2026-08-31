'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Priest {
  id: string
  name: string
  bio?: string
  phone?: string
  email?: string
  specialties?: string
  is_active: boolean
  display_order: number
  created_at: string
}

export default function PriestsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [priests, setPriests] = useState<Priest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchPriests()
  }, [filter])

  const fetchPriests = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('purohits')
        .select('*')
        .order('display_order', { ascending: true })

      if (filter === 'active') {
        query = query.eq('is_active', true)
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error } = await query

      if (error) throw error
      setPriests(data || [])
    } catch (error) {
      console.error('Error fetching priests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (priest: Priest) => {
    try {
      const { error } = await supabase
        .from('purohits')
        .update({ is_active: !priest.is_active })
        .eq('id', priest.id)

      if (error) throw error
      fetchPriests()
    } catch (error) {
      console.error('Error toggling priest status:', error)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (priest: Priest) => {
    if (!confirm(`Are you sure you want to delete "${priest.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('purohits')
        .delete()
        .eq('id', priest.id)

      if (error) throw error
      alert('Priest deleted successfully')
      fetchPriests()
    } catch (error: any) {
      console.error('Error deleting priest:', error)
      alert(`Failed to delete: ${error.message}`)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Priests Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage priests available for service bookings
            </p>
          </div>
          <Link
            href="/admin/settings/priests/new"
            className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
          >
            + Add Priest
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-saffron text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({priests.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-saffron text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'inactive'
                  ? 'bg-saffron text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Priests List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading priests...</p>
            </div>
          ) : priests.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No priests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new priest
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/settings/priests/new"
                  className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold inline-block"
                >
                  + Add Priest
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priests.map((priest) => (
                    <tr key={priest.id} className="hover:bg-transparent">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{priest.display_order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{priest.name}</div>
                        {priest.bio && (
                          <div className="text-sm text-gray-500 max-w-md truncate">
                            {priest.bio.substring(0, 80)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {priest.email && (
                          <div className="text-sm text-gray-900">{priest.email}</div>
                        )}
                        {priest.phone && (
                          <div className="text-sm text-gray-500">{priest.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {priest.specialties || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            priest.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {priest.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/settings/priests/${priest.id}/edit`)}
                            className="text-saffron hover:text-saffron-hover"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(priest)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {priest.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(priest)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
