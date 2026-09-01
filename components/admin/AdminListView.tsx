'use client'

/**
 * The office console's list archetype.
 *
 * 17 admin routes are the same shape: a header with a primary action, an
 * optional status filter, a search box, a data table with a mobile card
 * fallback, and an empty state. Rather than reimplement that 17 times, they
 * all render this and supply their own columns.
 *
 * Presentation only. Every page keeps its own queries and mutations.
 *
 * Exemplar: design-kit/pages/admin/AdminMembers.tsx
 */

import React, { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SearchXIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toolbar } from '@/components/ui/Toolbar'

export interface AdminListViewProps<T> {
  eyebrow?: string
  title: string
  description?: string
  /** Primary action(s) for the page header — usually a "New …" button. */
  actions?: React.ReactNode

  rows: T[]
  columns: Array<Column<T>>
  rowKey: (row: T) => string
  mobileCard: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  loading?: boolean

  /** Fields to match the search box against. */
  searchFields?: (row: T) => Array<string | null | undefined>
  searchPlaceholder?: string

  /**
   * Status tabs. Supply `filters` + `filterValue` + `onFilterChange` for a
   * SERVER-side filter, and additionally `filterFn` for a client-side one.
   */
  filters?: readonly string[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterLabels?: Record<string, string>
  filterFn?: (row: T, filter: string) => boolean

  /** Extra controls rendered inside the toolbar (year pickers, etc). */
  toolbarFilters?: React.ReactNode

  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  emptyAction?: React.ReactNode

  /** Singular noun for the summary line, e.g. "member". */
  noun?: string
  /** Rendered above the table — stat cards, alerts and the like. */
  children?: React.ReactNode
}

export function AdminListView<T>({
  eyebrow,
  title,
  description,
  actions,
  rows,
  columns,
  rowKey,
  mobileCard,
  onRowClick,
  loading,
  searchFields,
  searchPlaceholder = 'Search…',
  filters,
  filterValue,
  onFilterChange,
  filterLabels,
  filterFn,
  toolbarFilters,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  noun = 'record',
  children,
}: AdminListViewProps<T>) {
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    let out = rows
    // Only filter locally when the page asked for it; otherwise the filter is
    // already applied in the query and re-filtering here would double up.
    if (filterFn && filterValue) {
      out = out.filter((r) => filterFn(r, filterValue))
    }
    const q = search.trim().toLowerCase()
    if (q && searchFields) {
      out = out.filter((r) =>
        searchFields(r).some((f) => (f ?? '').toString().toLowerCase().includes(q))
      )
    }
    return out
  }, [rows, search, searchFields, filterFn, filterValue])

  const filtersActive = Boolean(search) || Boolean(filterValue && filterValue !== filters?.[0])

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />

      {children}

      {filters && filterValue !== undefined && onFilterChange && (
        <FilterTabs
          label={`Filter ${title.toLowerCase()} by status`}
          options={filters}
          value={filterValue}
          onChange={onFilterChange}
          renderLabel={filterLabels ? (f) => filterLabels[f] ?? f : undefined}
        />
      )}

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        summary={`${visible.length} ${noun}${visible.length === 1 ? '' : 's'}`}
        filters={toolbarFilters}
      />

      <DataTable
        caption={title}
        columns={columns}
        rows={visible}
        rowKey={rowKey}
        mobileCard={mobileCard}
        onRowClick={onRowClick}
        loading={loading}
        empty={
          filtersActive ? (
            <EmptyState
              icon={SearchXIcon}
              title="Nothing matches those filters"
              description="Try a different status, or clear the search."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('')
                    if (filters && onFilterChange) onFilterChange(filters[0])
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          )
        }
      />
    </div>
  )
}
