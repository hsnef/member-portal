'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { HistoryIcon, UploadIcon, Undo2Icon } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'

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

  const columns: Array<Column<ImportBatch>> = [
    {
      key: 'batch_number',
      header: 'Batch',
      cell: (b) => (
        <div className="min-w-0">
          <p className="tnum truncate font-semibold text-ink">{b.batch_number}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">{b.file_name}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Imported',
      sortable: true,
      cell: (b) => (
        <div className="min-w-0">
          <p className="tnum text-ink-2">{formatDate(b.created_at)}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">{b.imported_by_name}</p>
        </div>
      ),
    },
    {
      key: 'records',
      header: 'Records',
      align: 'right',
      cell: (b) => (
        <div className="min-w-0">
          <p className="tnum text-ink">
            {b.successful_records} of {b.total_records}
          </p>
          {b.failed_records > 0 && (
            <p className="tnum mt-0.5 text-[13px] text-danger">{b.failed_records} failed</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) =>
        b.reverted_at ? (
          <Badge tone="neutral">Reverted</Badge>
        ) : (
          <Badge tone={b.failed_records > 0 ? 'marigold' : 'tulsi'}>{b.status}</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) =>
        b.reverted_at ? (
          <span className="text-[13px] text-ink-3">
            by {b.reverted_by_name ?? 'the office'}
          </span>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            icon={Undo2Icon}
            loading={reverting === b.id}
            onClick={() => handleRevert(b)}
          >
            Revert
          </Button>
        ),
    },
  ]

  const mobileCard = (b: ImportBatch) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="tnum truncate font-semibold text-ink">{b.batch_number}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-3">{b.file_name}</p>
        </div>
        {b.reverted_at ? (
          <Badge tone="neutral">Reverted</Badge>
        ) : (
          <Badge tone={b.failed_records > 0 ? 'marigold' : 'tulsi'}>{b.status}</Badge>
        )}
      </div>
      <p className="tnum text-[13.5px] text-ink-2">
        {b.successful_records} of {b.total_records} imported
        {b.failed_records > 0 ? `, ${b.failed_records} failed` : ''}
      </p>
    </div>
  )

  return (
    <AdminListView<ImportBatch>
      eyebrow="Members"
      title="Import history"
      description="Every member import, and whether it can still be reverted."
      noun="import"
      actions={
        <AppLink to="/admin/members/import">
          <Button icon={UploadIcon}>New import</Button>
        </AppLink>
      }
      rows={batches}
      columns={columns}
      rowKey={(b) => b.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by batch number or file name..."
      searchFields={(b) => [b.batch_number, b.file_name, b.imported_by_name]}
      emptyIcon={HistoryIcon}
      emptyTitle="No imports yet"
      emptyDescription="Import a member list from a spreadsheet and each batch will be recorded here."
      emptyAction={
        <AppLink to="/admin/members/import">
          <Button icon={UploadIcon}>Import members</Button>
        </AppLink>
      }
    />
  )
}
