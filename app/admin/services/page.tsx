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
import { ClipboardListIcon, PlusIcon } from 'lucide-react'

interface Service {
  id: string
  name: string
  display_name?: string
  description?: string
  category: string
  price_member_temple?: number
  price_community_temple?: number
  price_member_external?: number
  price_community_external?: number
  is_active: boolean
  is_temple_only: boolean
  display_order: number
}

export default function ServicesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Puja' | 'Other'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchServices()
  }, [filter, categoryFilter])

  const fetchServices = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true })

      if (filter === 'active') {
        query = query.eq('is_active', true)
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)

      if (error) throw error
      fetchServices()
    } catch (error) {
      console.error('Error toggling service status:', error)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

      if (error) throw error
      alert('Service deleted successfully')
      fetchServices()
    } catch (error: any) {
      console.error('Error deleting service:', error)
      alert(`Failed to delete: ${error.message}`)
    }
  }

  const filteredServices = services.filter((service) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      service.name.toLowerCase().includes(search) ||
      service.display_name?.toLowerCase().includes(search) ||
      service.description?.toLowerCase().includes(search)
    )
  })

  const columns: Array<Column<Service>> = [
    {
      key: 'name',
      header: 'Service',
      cell: (s) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{s.display_name || s.name}</p>
          {s.description && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{s.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (s) => <Badge tone="copper">{s.category}</Badge>,
    },
    {
      key: 'price_member_temple',
      header: 'Member / temple',
      align: 'right',
      secondary: true,
      cell: (s) => (
        <span className="tnum text-ink-2">
          {s.price_member_temple != null ? formatCurrency(s.price_member_temple) : '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      cell: (s) => (
        <Badge tone={s.is_active ? 'tulsi' : 'neutral'}>
          {s.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (s) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleToggleActive(s)}>
            {s.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <AppLink to={`/admin/services/${s.id}/edit`}>
            <Button size="sm" variant="secondary">
              Edit
            </Button>
          </AppLink>
        </div>
      ),
    },
  ]

  const mobileCard = (s: Service) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{s.display_name || s.name}</p>
          <p className="mt-0.5 text-[13px] text-ink-3">{s.category}</p>
        </div>
        <Badge tone={s.is_active ? 'tulsi' : 'neutral'}>
          {s.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <p className="tnum text-[13.5px] text-ink-2">
        {s.price_member_temple != null ? formatCurrency(s.price_member_temple) : '—'} member,
        at the temple
      </p>
    </div>
  )

  return (
    <AdminListView<Service>
      eyebrow="Office console"
      title="Service catalog"
      description="The pujas and services members can book, and what each costs."
      noun="service"
      actions={
        <AppLink to="/admin/services/new">
          <Button icon={PlusIcon}>Add service</Button>
        </AppLink>
      }
      rows={services}
      columns={columns}
      rowKey={(s) => s.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by name or description..."
      searchFields={(s) => [s.name, s.display_name, s.description]}
      /* Active/inactive is applied in the QUERY. */
      filters={['all', 'active', 'inactive']}
      filterLabels={{ all: 'All', active: 'Active', inactive: 'Inactive' }}
      filterValue={filter}
      onFilterChange={(v) => setFilter(v as typeof filter)}
      toolbarFilters={
        <ToolbarFilter
          label="Category"
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
          options={['all', 'Puja', 'Other']}
        />
      }
      emptyIcon={ClipboardListIcon}
      emptyTitle="No services yet"
      emptyDescription="Add the pujas and services members can book, with their pricing."
      emptyAction={
        <AppLink to="/admin/services/new">
          <Button icon={PlusIcon}>Add the first service</Button>
        </AppLink>
      }
    />
  )
}
