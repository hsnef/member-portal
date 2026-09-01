'use client'

/**
 * Office console dashboard — presentation only.
 *
 * app/admin/page.tsx owns the Supabase aggregate queries.
 *
 * Exemplar: design-kit/pages/admin/AdminDashboard.tsx
 */

import React from 'react'
import {
  ArrowRightIcon,
  CalendarPlusIcon,
  CreditCardIcon,
  HeartHandshakeIcon,
  QrCodeIcon,
  ScrollTextIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { AppLink as Link } from '@/components/nav/Nav'
import { Card, CardHeader } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stagger, StaggerItem } from '@/components/ui/Motion'
import { formatCurrency } from '@/utils/format'
import type { Tone } from '@/utils/tones'

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  lifetimeMembers: number
  annualMembers: number
  communityMembers: number
  totalPayments: number
  totalRevenue: number
  upcomingEvents: number
  pendingRequests: number
}

const quickActions: Array<{
  to: string
  icon: typeof QrCodeIcon
  title: string
  copy: string
  tone: Tone
}> = [
  {
    to: '/admin/scan-qr',
    icon: QrCodeIcon,
    title: 'Scan QR code',
    copy: 'Check a member in at the desk',
    tone: 'saffron',
  },
  {
    to: '/admin/members/new',
    icon: UserPlusIcon,
    title: 'Add a member',
    copy: 'Create a new membership record',
    tone: 'kumkum',
  },
  {
    to: '/admin/events/new',
    icon: CalendarPlusIcon,
    title: 'Create an event',
    copy: 'Publish a festival, class or seva',
    tone: 'marigold',
  },
  {
    to: '/admin/payments',
    icon: CreditCardIcon,
    title: 'Record a payment',
    copy: 'Reconcile cash, check and Zelle',
    tone: 'tulsi',
  },
]

export interface AdminDashboardViewProps {
  stats: DashboardStats | null
  loading: boolean
  greetingName?: string | null
}

export function AdminDashboardView({ stats, loading, greetingName }: AdminDashboardViewProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-7" role="status" aria-live="polite">
        <span className="sr-only">Loading the dashboard…</span>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Office console"
        title={greetingName ? `Namaste, ${greetingName}` : 'Today at the temple'}
        description="Membership, giving and what needs the office's attention."
      />

      {/* ---- Membership ---- */}
      <section aria-labelledby="membership-heading">
        <h2
          id="membership-heading"
          className="font-serif text-[24px] leading-tight text-ink"
        >
          Membership
        </h2>
        <Stagger className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <StatCard
              label="Total members"
              value={String(stats.totalMembers)}
              caption="All records"
              icon={UsersIcon}
              tone="kumkum"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Active"
              value={String(stats.activeMembers)}
              caption="Current memberships"
              icon={UsersIcon}
              tone="tulsi"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Lifetime"
              value={String(stats.lifetimeMembers)}
              caption="No renewal needed"
              icon={HeartHandshakeIcon}
              tone="marigold"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Annual"
              value={String(stats.annualMembers)}
              caption={`${stats.communityMembers} community`}
              icon={UsersIcon}
              tone="copper"
            />
          </StaggerItem>
        </Stagger>
      </section>

      {/* ---- Finance & attention ---- */}
      <section aria-labelledby="finance-heading">
        <h2 id="finance-heading" className="font-serif text-[24px] leading-tight text-ink">
          Giving and requests
        </h2>
        <Stagger className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <StatCard
              label="Total received"
              value={formatCurrency(stats.totalRevenue)}
              caption={`${stats.totalPayments} payments`}
              icon={CreditCardIcon}
              tone="tulsi"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Payments"
              value={String(stats.totalPayments)}
              caption="Recorded to date"
              icon={CreditCardIcon}
              tone="sandal"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Pending requests"
              value={String(stats.pendingRequests)}
              caption={stats.pendingRequests > 0 ? 'Awaiting the office' : 'Nothing waiting'}
              icon={ScrollTextIcon}
              tone={stats.pendingRequests > 0 ? 'marigold' : 'sandal'}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Upcoming events"
              value={String(stats.upcomingEvents)}
              caption="Published and ahead"
              icon={CalendarPlusIcon}
              tone="lotus"
            />
          </StaggerItem>
        </Stagger>

        {stats.pendingRequests > 0 && (
          <Card tone="sunk" spine="marigold" className="mt-4 pl-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[15px] text-ink-2">
                <span className="tnum font-semibold text-ink">{stats.pendingRequests}</span>{' '}
                request{stats.pendingRequests === 1 ? '' : 's'} waiting on the office.
              </p>
              <Link
                to="/admin/requests"
                className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-saffron hover:text-saffron-hover"
              >
                Review them
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* ---- Quick actions ---- */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="font-serif text-[24px] leading-tight text-ink">
          Quick actions
        </h2>
        <Stagger as="ul" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <StaggerItem as="li" key={action.to}>
              <Link to={action.to} className="group block h-full">
                <Card interactive spine={action.tone} className="h-full pl-7">
                  <IconTile icon={action.icon} tone={action.tone} size="lg" shape="arch" />
                  <h3 className="mt-4 font-serif text-[21px] leading-tight text-ink">
                    {action.title}
                  </h3>
                  <p className="mt-1.5 text-[14.5px] leading-snug text-ink-2">{action.copy}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-saffron">
                    Open
                    <ArrowRightIcon
                      className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
    </div>
  )
}
