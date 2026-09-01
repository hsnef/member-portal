'use client'

/**
 * Activity timeline — presentation only.
 *
 * app/member/activity/page.tsx owns the Supabase query, the filtering,
 * the month grouping and the stats.
 *
 * Archetype: ledger/timeline, sharing the tone vocabulary with
 * design-kit/pages/Payments.tsx.
 */

import React from 'react'
import {
  CalendarDaysIcon,
  ClipboardListIcon,
  FlameIcon,
  HandCoinsIcon,
  HeartHandshakeIcon,
  IdCardIcon,
  LandmarkIcon,
  ListIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Toolbar, ToolbarFilter } from '@/components/ui/Toolbar'
import { formatCurrency, formatDate } from '@/utils/format'
import type { LedgerEntry, ActivityType } from '@/types/database'
import type { Tone } from '@/utils/tones'

export interface ActivityItem extends LedgerEntry {
  event?: {
    name: string
    event_date: string
  }
}

/** Replaces the emoji set; each activity type owns a hue and a real icon. */
const typeIcon: Record<string, typeof FlameIcon> = {
  Visit: LandmarkIcon,
  Puja: FlameIcon,
  Event: CalendarDaysIcon,
  Donation: HandCoinsIcon,
  Service: ClipboardListIcon,
  Membership: IdCardIcon,
}

const typeTone: Record<string, Tone> = {
  Visit: 'saffron',
  Puja: 'copper',
  Event: 'marigold',
  Donation: 'tulsi',
  Service: 'lotus',
  Membership: 'kumkum',
}

export interface ActivityStats {
  totalActivities: number
  visits: number
  pujas: number
  events: number
  donations: number
}

export interface ActivityViewProps {
  grouped: Record<string, ActivityItem[]>
  loading: boolean
  stats: ActivityStats
  types: ReadonlyArray<ActivityType | 'All'>
  filterType: ActivityType | 'All'
  onFilterTypeChange: (type: ActivityType | 'All') => void
  year: number
  availableYears: number[]
  onYearChange: (year: number) => void
}

export function ActivityView({
  grouped,
  loading,
  stats,
  types,
  filterType,
  onFilterTypeChange,
  year,
  availableYears,
  onYearChange,
}: ActivityViewProps) {
  const months = Object.keys(grouped)

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your account"
        title="Activity"
        description="Your visits, pujas, events and giving at the temple."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Activities"
          value={String(stats.totalActivities)}
          caption={`In ${year}`}
          icon={ListIcon}
          tone="sandal"
        />
        <StatCard
          label="Visits"
          value={String(stats.visits)}
          caption="Checked in at the temple"
          icon={LandmarkIcon}
          tone="saffron"
        />
        <StatCard
          label="Pujas"
          value={String(stats.pujas)}
          caption="Services performed"
          icon={FlameIcon}
          tone="copper"
        />
        <StatCard
          label="Given"
          value={formatCurrency(stats.donations)}
          caption="Donations this year"
          icon={HeartHandshakeIcon}
          tone="tulsi"
        />
      </div>

      <FilterTabs
        label="Filter activity by type"
        options={types}
        value={filterType}
        onChange={onFilterTypeChange}
      />

      {availableYears.length > 1 && (
        <Toolbar
          search=""
          onSearchChange={() => {}}
          searchPlaceholder=""
          summary={`${stats.totalActivities} activit${stats.totalActivities === 1 ? 'y' : 'ies'} in ${year}`}
          filters={
            <ToolbarFilter
              label="Year"
              value={String(year)}
              onChange={(v) => onYearChange(Number(v))}
              options={availableYears.map(String)}
            />
          }
        />
      )}

      {loading ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <span className="sr-only">Loading your activity…</span>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : months.length === 0 ? (
        <EmptyState
          icon={ListIcon}
          title={`No activity in ${year}`}
          description="Your temple visits, bookings, event registrations and donations will appear here as a timeline."
        />
      ) : (
        <div className="space-y-8">
          {months.map((month) => (
            <section key={month} aria-labelledby={`month-${month}`}>
              <h2
                id={`month-${month}`}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3"
              >
                {month}
              </h2>
              <div className="hs-rule mt-2" aria-hidden="true" />

              <ul className="mt-4 space-y-3">
                {grouped[month].map((activity) => {
                  const Icon = typeIcon[String(activity.activity_type)] ?? ListIcon
                  const tone = typeTone[String(activity.activity_type)] ?? 'sandal'
                  return (
                    <Card as="li" key={activity.id} className="flex items-start gap-4">
                      <IconTile icon={Icon} tone={tone} size="md" shape="arch" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">
                          {activity.event?.name ?? activity.activity_type}
                        </p>
                        {activity.description && (
                          <p className="mt-0.5 text-[14px] leading-snug text-ink-2">
                            {activity.description}
                          </p>
                        )}
                        <p className="tnum mt-1 text-[13px] text-ink-3">
                          {formatDate(activity.activity_date)}
                        </p>
                      </div>
                      {activity.amount ? (
                        <span className="tnum shrink-0 font-serif text-[20px] text-ink">
                          {formatCurrency(activity.amount)}
                        </span>
                      ) : null}
                    </Card>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
