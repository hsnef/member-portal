'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ToolbarFilter } from '@/components/ui/Toolbar'
import { AppLink } from '@/components/nav/Nav'
import { formatCurrency } from '@/utils/format'
import type { Column } from '@/components/ui/DataTable'
import { UserCogIcon, PlusIcon } from 'lucide-react'

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

  const columns: Array<Column<Priest>> = [
    {
      key: 'name',
      header: 'Priest',
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{p.name}</p>
          {p.specialties && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{p.specialties}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      secondary: true,
      cell: (p) => (
        <div className="min-w-0">
          {p.email && <p className="truncate text-ink-2">{p.email}</p>}
          {p.phone && <p className="tnum mt-0.5 text-[13px] text-ink-3">{p.phone}</p>}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      cell: (p) => (
        <Badge tone={p.is_active ? 'tulsi' : 'neutral'}>
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleToggleActive(p)}>
            {p.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <AppLink to={`/admin/settings/priests/${p.id}/edit`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </AppLink>
        </div>
      ),
    },
  ]

  const mobileCard = (p: Priest) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{p.name}</p>
          {p.specialties && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{p.specialties}</p>
          )}
        </div>
        <Badge tone={p.is_active ? 'tulsi' : 'neutral'}>
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      {p.email && <p className="truncate text-[13.5px] text-ink-2">{p.email}</p>}
    </div>
  )

  return (
    <AdminListView<Priest>
      eyebrow="Settings"
      title="Priests"
      description="The purohits available to perform services, and their specialities."
      noun="priest"
      actions={
        <AppLink to="/admin/settings/priests/new">
          <Button icon={PlusIcon}>Add priest</Button>
        </AppLink>
      }
      rows={priests}
      columns={columns}
      rowKey={(p) => p.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by name or speciality..."
      searchFields={(p) => [p.name, p.specialties, p.email]}
      /* Active/inactive is applied in the QUERY. */
      filters={['all', 'active', 'inactive']}
      filterLabels={{ all: 'All', active: 'Active', inactive: 'Inactive' }}
      filterValue={filter}
      onFilterChange={(v) => setFilter(v as typeof filter)}
      emptyIcon={UserCogIcon}
      emptyTitle="No priests yet"
      emptyDescription="Add the purohits who perform services so they can be assigned to bookings."
      emptyAction={
        <AppLink to="/admin/settings/priests/new">
          <Button icon={PlusIcon}>Add the first priest</Button>
        </AppLink>
      }
    />
  )
}
