'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminListView } from '@/components/admin/AdminListView'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { UsersIcon, UserPlusIcon, UploadIcon } from 'lucide-react'
import type { Column } from '@/components/ui/DataTable'
import type { Member, MembershipLevel } from '@/types/database'
import { useTestData } from '@/lib/context/TestDataContext'
import { getTestMemberIds } from '@/lib/utils/testDataFiltering'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<MembershipLevel | 'All'>('All')
  const { showTestData } = useTestData()

  const supabase = createClient()

  const fetchMembers = async () => {
    try {
      setLoading(true)

      // Get test member IDs for filtering
      const testMemberIds = await getTestMemberIds()

      let query = supabase.from('members').select('*').order('created_at', { ascending: false })

      // Filter out test members unless showTestData toggle is ON
      if (!showTestData && testMemberIds.length > 0) {
        query = query.not('id', 'in', `(${testMemberIds.join(',')})`)
      }

      // Apply level filter
      if (levelFilter !== 'All') {
        query = query.eq('current_level', levelFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching members:', error)
      } else {
        // Mark test members for badge display
        const membersWithTestFlag = (data || []).map((member) => ({
          ...member,
          is_test_member: testMemberIds.includes(member.id),
        }))
        setMembers(membersWithTestFlag)
      }
    } catch (error) {
      console.error('Error in fetchMembers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, showTestData])

  // Filter members by search term
  const filteredMembers = members.filter((member) => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()
    return (
      member.membership_id.toLowerCase().includes(search) ||
      member.first_name?.toLowerCase().includes(search) ||
      member.last_name?.toLowerCase().includes(search) ||
      member.business_name?.toLowerCase().includes(search) ||
      member.primary_email?.toLowerCase().includes(search) ||
      member.primary_phone?.toLowerCase().includes(search)
    )
  })

  const levelTone: Record<string, 'saffron' | 'kumkum' | 'tulsi' | 'neutral'> = {
    Lifetime: 'kumkum',
    Annual: 'saffron',
    Community: 'tulsi',
  }

  const columns: Array<Column<Member>> = [
    {
      key: 'name',
      header: 'Member',
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {m.member_class === 'Personal'
              ? [m.first_name, m.last_name].filter(Boolean).join(' ') || '—'
              : m.business_name || '—'}
          </p>
          {m.member_profile_name && (
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{m.member_profile_name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'membership_id',
      header: 'Membership',
      sortable: true,
      cell: (m) => <span className="tnum text-ink-2">{m.membership_id}</span>,
    },
    {
      key: 'current_level',
      header: 'Level',
      cell: (m) => (
        <Badge tone={levelTone[m.current_level] ?? 'neutral'}>{m.current_level}</Badge>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      secondary: true,
      cell: (m) => (
        <div className="min-w-0">
          <p className="truncate text-ink-2">{m.primary_email}</p>
          {m.primary_phone && (
            <p className="tnum mt-0.5 truncate text-[13px] text-ink-3">{m.primary_phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (m) => (
        <AppLink to={`/admin/members/${m.id}`}>
          <Button size="sm" variant="secondary">
            View
          </Button>
        </AppLink>
      ),
    },
  ]

  const mobileCard = (m: Member) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">
            {m.member_class === 'Personal'
              ? [m.first_name, m.last_name].filter(Boolean).join(' ') || '—'
              : m.business_name || '—'}
          </p>
          <p className="tnum mt-0.5 text-[13px] text-ink-3">{m.membership_id}</p>
        </div>
        <Badge tone={levelTone[m.current_level] ?? 'neutral'}>{m.current_level}</Badge>
      </div>
      {m.primary_email && (
        <p className="truncate text-[13.5px] text-ink-2">{m.primary_email}</p>
      )}
    </div>
  )

  return (
    <AdminListView<Member>
      eyebrow="Office console"
      title="Members"
      description="The membership directory. Search by name, membership number, email or phone."
      noun="member"
      actions={
        <div className="flex flex-wrap gap-2">
          <AppLink to="/admin/members/import">
            <Button variant="secondary" icon={UploadIcon}>
              Import
            </Button>
          </AppLink>
          <AppLink to="/admin/members/new">
            <Button icon={UserPlusIcon}>Add member</Button>
          </AppLink>
        </div>
      }
      rows={members}
      columns={columns}
      rowKey={(m) => m.id}
      mobileCard={mobileCard}
      loading={loading}
      searchPlaceholder="Search by name, number, email or phone…"
      searchFields={(m) => [
        m.membership_id,
        m.first_name,
        m.last_name,
        m.business_name,
        m.primary_email,
        m.primary_phone,
      ]}
      /* The level filter is applied in the QUERY, so no filterFn here. */
      filters={['All', 'Lifetime', 'Annual', 'Community']}
      filterValue={levelFilter}
      onFilterChange={(v) => setLevelFilter(v as MembershipLevel | 'All')}
      emptyIcon={UsersIcon}
      emptyTitle="No members yet"
      emptyDescription="Add a member directly, or import an existing list from a spreadsheet."
      emptyAction={
        <AppLink to="/admin/members/new">
          <Button icon={UserPlusIcon}>Add the first member</Button>
        </AppLink>
      }
    />
  )
}
