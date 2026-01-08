'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface ImportBatch {
  id: string
  batch_number: string
  file_name: string
  imported_by_name: string
  total_records: number
  successful_records: number
  failed_records: number
  status: string
  created_at: string
  reverted_at?: string
  reverted_by_name?: string
  notes?: string
}

export default function ImportHistoryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [reverting, setReverting] = useState<string | null>(null)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBatches(data || [])
    } catch (error) {
      console.error('Error fetching import batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async (batch: ImportBatch) => {
    if (!confirm(
      `Are you sure you want to revert import "${batch.batch_number}"?\n\n` +
      `This will permanently delete ${batch.successful_records} members imported in this batch.\n\n` +
      `This action CANNOT be undone!`
    )) {
      return
    }

    try {
      setReverting(batch.id)

      // Get current user info
      const { data: userData } = await supabase.auth.getUser()
      const { data: memberData } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('auth_user_id', userData?.user?.id)
        .single()

      const reverterName = memberData
        ? `${memberData.first_name} ${memberData.last_name}`.trim()
        : userData?.user?.email || 'Unknown'

      // Step 1: Delete all members in this batch
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('import_batch_id', batch.id)

      if (deleteError) throw deleteError

      // Step 2: Update batch status to Reverted
      const { error: updateError } = await supabase
        .from('import_batches')
        .update({
          status: 'Reverted',
          reverted_at: new Date().toISOString(),
          reverted_by: userData?.user?.id,
          reverted_by_name: reverterName,
        })
        .eq('id', batch.id)

      if (updateError) throw updateError

      alert(`Successfully reverted import "${batch.batch_number}".\n${batch.successful_records} members have been deleted.`)
      fetchBatches()
    } catch (error: any) {
      console.error('Error reverting import:', error)
      alert(`Failed to revert import: ${error.message}`)
    } finally {
      setReverting(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Reverted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import History</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage bulk member imports
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/members/import')}
              className="px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
            >
              New Import
            </button>
          </div>

          {/* Import Batches List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading import history...</p>
              </div>
            ) : batches.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No imports yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by importing your first CSV file
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/admin/members/import')}
                    className="px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
                  >
                    Import CSV
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imported By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Records
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
                    {batches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                          {batch.batch_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.file_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.imported_by_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="text-green-600">✓ {batch.successful_records} success</div>
                            {batch.failed_records > 0 && (
                              <div className="text-red-600">✗ {batch.failed_records} failed</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                            {batch.status}
                          </span>
                          {batch.status === 'Reverted' && batch.reverted_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              by {batch.reverted_by_name}
                              <br />
                              on {new Date(batch.reverted_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {batch.status === 'Completed' && (
                            <button
                              onClick={() => handleRevert(batch)}
                              disabled={reverting === batch.id}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              {reverting === batch.id ? 'Reverting...' : 'Revert'}
                            </button>
                          )}
                          {batch.status === 'Reverted' && (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Important Information</h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Reverting an import will <strong>permanently delete</strong> all members imported in that batch</li>
              <li>• This action cannot be undone - make sure to verify before reverting</li>
              <li>• Only members from the specific import batch will be deleted</li>
              <li>• Manually added members are never affected by import reverts</li>
            </ul>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
