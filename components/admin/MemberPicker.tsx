'use client'

/**
 * Member lookup used by the office console forms that act on behalf of a
 * member: /admin/payments/new, /admin/requests/new and the admin booking
 * wizard.
 *
 * Presentation only. The page owns the search query and its Supabase call.
 */

import React from 'react'
import { SearchIcon, UserIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'

export interface PickableMember {
  id: string
  membership_id: string
  first_name?: string | null
  last_name?: string | null
  business_name?: string | null
  member_class?: string | null
  primary_email?: string | null
  current_level?: string | null
}

export function memberDisplayName(m: PickableMember | null): string {
  if (!m) return ''
  return m.member_class === 'Business'
    ? m.business_name || m.membership_id
    : [m.first_name, m.last_name].filter(Boolean).join(' ') || m.membership_id
}

export interface MemberPickerProps {
  searchQuery: string
  onSearchQueryChange: (v: string) => void
  onSearch: () => void
  searching?: boolean
  results: PickableMember[]
  selected: PickableMember | null
  onSelect: (m: PickableMember) => void
  onClear: () => void
  /** Shown when no member is required, e.g. a walk-in with no membership. */
  allowNone?: boolean
  onSelectNone?: () => void
  title?: string
  description?: string
}

export function MemberPicker({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searching = false,
  results,
  selected,
  onSelect,
  onClear,
  allowNone = false,
  onSelectNone,
  title = 'Who is this for?',
  description = 'Search by name, membership number or email.',
}: MemberPickerProps) {
  if (selected) {
    return (
      <Card spine="kumkum" className="pl-7">
        <CardHeader title={title} />
        <div className="flex items-start gap-4">
          <IconTile icon={UserIcon} tone="kumkum" size="md" shape="arch" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{memberDisplayName(selected)}</p>
            <p className="tnum mt-0.5 truncate text-[13.5px] text-ink-3">
              {selected.membership_id}
              {selected.current_level ? ` · ${selected.current_level}` : ''}
            </p>
            {selected.primary_email && (
              <p className="mt-0.5 truncate text-[13.5px] text-ink-3">
                {selected.primary_email}
              </p>
            )}
          </div>
          <Button type="button" size="sm" variant="ghost" icon={XIcon} onClick={onClear}>
            Change
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title={title} description={description} />

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Search members" className="min-w-[240px] flex-1">
          {({ id }) => (
            <Input
              id={id}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // This picker lives inside a form; Enter must search, not submit.
                  e.preventDefault()
                  onSearch()
                }
              }}
              placeholder="Name, membership number or email"
            />
          )}
        </Field>
        <Button
          type="button"
          icon={SearchIcon}
          loading={searching}
          onClick={onSearch}
          className="mb-[2px]"
        >
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <ul className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {results.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-sunk"
              >
                <IconTile icon={UserIcon} tone="kumkum" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">
                    {memberDisplayName(m)}
                  </span>
                  <span className="tnum block truncate text-[13px] text-ink-3">
                    {m.membership_id}
                    {m.primary_email ? ` · ${m.primary_email}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {results.length === 0 && searchQuery && !searching && (
        <div className="mt-5">
          <EmptyState
            icon={SearchIcon}
            title="No members matched"
            description="Try part of a surname, the membership number, or an email address."
          />
        </div>
      )}

      {allowNone && onSelectNone && (
        <div className="mt-5 border-t border-line pt-4">
          <Button type="button" variant="ghost" onClick={onSelectNone}>
            Continue without a member
          </Button>
          <p className="mt-1 text-[13px] text-ink-3">
            For a walk-in or someone who is not yet a member.
          </p>
        </div>
      )}
    </Card>
  )
}
