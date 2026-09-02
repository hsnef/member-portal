'use client'

/**
 * Member dashboard — presentation only.
 *
 * All data fetching, the membership-status calculation and the QR token live in
 * app/member/page.tsx. This file takes plain props and renders.
 *
 * Exemplar: design-kit/pages/Home.tsx
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FlameIcon,
  HandCoinsIcon,
  IdCardIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  UsersIcon,
} from 'lucide-react'
import { AppLink as Link } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { Stagger, StaggerItem, easeSmooth } from '@/components/ui/Motion'
import { CornerMandala, Diya, Eyebrow, KolamBand } from '@/components/brand/Motifs'
import { MembershipPass } from '@/components/member/MembershipPass'
import { MembershipSwitcher } from '@/components/member/MembershipSwitcher'
import { ZellePendingPayments } from '@/components/zelle/ZellePendingPayments'
import { formatDate } from '@/utils/format'
import type { Member, FamilyMember } from '@/types/database'
import type { Tone } from '@/utils/tones'

/** Mirrors the shape returned by getMembershipStatus() in page.tsx. */
export interface MembershipStatus {
  status: string
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
  daysUntilExpiry: number | null
}

export interface MemberDashboardProps {
  member: Member
  familyMembers: FamilyMember[]
  qrToken: string
  status: MembershipStatus
  membershipEndDate: string | null
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** The status colour drives the alert tone; keep the mapping in one place. */
const statusTone: Record<MembershipStatus['color'], 'success' | 'warning' | 'danger' | 'info'> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  blue: 'info',
  gray: 'info',
}

export function MemberDashboard({
  member,
  familyMembers,
  qrToken,
  status,
  membershipEndDate,
}: MemberDashboardProps) {
  const displayName =
    member.member_class === 'Personal' ? member.first_name : member.business_name
  const isPersonal = member.member_class === 'Personal'
  const needsAttention = status.color === 'yellow' || status.color === 'red'
  const canRenew =
    member.current_level === 'Annual' || member.current_level === 'Community'
  const renewLabel = member.current_level === 'Community' ? 'Upgrade membership' : 'Renew membership'

  const quickActions: Array<{
    to: string
    icon: typeof FlameIcon
    title: string
    copy: string
    tone: Tone
  }> = [
    {
      to: '/member/bookings/new',
      icon: FlameIcon,
      title: 'Book a service',
      copy: 'Archana, abhishekam, havan or a samskara',
      tone: 'copper',
    },
    {
      to: '/member/donate',
      icon: HandCoinsIcon,
      title: 'Make a donation',
      copy: 'Annadanam, building fund and more',
      tone: 'tulsi',
    },
    {
      to: '/member/events',
      icon: CalendarDaysIcon,
      title: 'Register for an event',
      copy: 'Festivals, classes and seva',
      tone: 'marigold',
    },
    {
      to: '/member/payments',
      icon: ReceiptTextIcon,
      title: 'Payments & receipts',
      copy: 'Year-end tax statements included',
      tone: 'sandal',
    },
  ]

  const secondaryLinks: Array<{
    to: string
    icon: typeof UsersIcon
    title: string
    copy: string
    tone: Tone
    show: boolean
  }> = [
    {
      to: '/member/profile',
      icon: IdCardIcon,
      title: 'Edit profile',
      copy: 'Update your contact details',
      tone: 'kumkum',
      show: true,
    },
    {
      to: '/member/family',
      icon: UsersIcon,
      title: 'Manage family',
      copy: 'Add or edit household members',
      tone: 'lotus',
      show: isPersonal,
    },
    {
      to: '/member/bookings',
      icon: ClipboardListIcon,
      title: 'My bookings',
      copy: 'Scheduled and past services',
      tone: 'copper',
      show: true,
    },
    {
      to: '/member/requests',
      icon: ScrollTextIcon,
      title: 'My requests',
      copy: 'Approvals and invoices',
      tone: 'lotus',
      show: true,
    },
    {
      to: '/member/activity',
      icon: CalendarDaysIcon,
      title: 'Activity',
      copy: 'Visits and services',
      tone: 'sandal',
      show: true,
    },
  ]

  return (
    <div className="space-y-12">
      {/* ---- Sanctum banner ---- */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeSmooth }}
        className="relative overflow-hidden rounded-3xl bg-kumkum text-white shadow-lift"
      >
        <span aria-hidden="true" className="hs-weave absolute inset-0 opacity-60" />
        <CornerMandala className="-right-14 -top-20 h-72 w-72 text-marigold/15" />

        <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Diya className="h-9 w-9" />
              <Eyebrow tone="text-marigold">{greeting()} · Namaste</Eyebrow>
            </div>
            <h1 className="mt-4 font-serif text-[44px] leading-[1.05] sm:text-[52px]">
              Welcome back{displayName ? `, ${displayName}` : ''}
            </h1>
            {member.member_since && (
              <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-white/75">
                With the HSNEF family since{' '}
                <span className="tnum font-semibold text-marigold">
                  {new Date(`${member.member_since}T00:00:00`).getFullYear()}
                </span>
                . Here&apos;s everything waiting for you today.
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/member/bookings/new">
                <Button
                  icon={FlameIcon}
                  className="!border-marigold !bg-marigold !text-kumkum hover:!brightness-105"
                >
                  Book a service
                </Button>
              </Link>
              <Link to="/member/pass">
                <Button
                  variant="secondary"
                  icon={IdCardIcon}
                  className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
                >
                  View my pass
                </Button>
              </Link>
              {/* Multi-membership switcher — only renders when the user holds more than one. */}
              <MembershipSwitcher />
            </div>
          </div>

          {/* Membership chip */}
          <Link
            to="/member/pass"
            className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm transition-colors hover:border-marigold/50 hover:bg-white/[0.12]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/55">
                Membership
              </p>
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11.5px] font-bold uppercase tracking-[0.08em]',
                  needsAttention ? 'bg-marigold text-kumkum' : 'bg-tulsi text-white',
                ].join(' ')}
              >
                {needsAttention ? 'Action needed' : 'Active'}
              </span>
            </div>
            <p className="mt-4 font-serif text-[32px] leading-none">{member.current_level}</p>
            <p className="tnum mt-2 text-[15px] font-semibold text-marigold">
              {member.membership_id}
            </p>
            <div className="my-5 h-px bg-white/15" />
            <p className="text-[14.5px] leading-snug text-white/70">
              {member.current_level === 'Lifetime'
                ? 'No expiry — lifetime member'
                : membershipEndDate
                  ? `Valid until ${formatDate(membershipEndDate)}`
                  : status.status}
            </p>
            {status.daysUntilExpiry !== null && status.daysUntilExpiry > 0 && (
              <p className="tnum mt-0.5 text-[14.5px] font-semibold text-white">
                {status.daysUntilExpiry} days remaining
              </p>
            )}
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-marigold">
              Open membership pass
              <ChevronRightIcon
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>

        <KolamBand className="relative px-7 pb-4 text-marigold/30" />
      </motion.section>

      {/* ---- Needs attention ---- */}
      {needsAttention && (
        <section aria-labelledby="attention-heading">
          <SectionTitle id="attention-heading" eyebrow="Action required">
            Needs your attention
          </SectionTitle>
          <div className="mt-5">
            <Alert
              tone={statusTone[status.color]}
              title={status.status}
              action={
                canRenew ? (
                  <Link to="/member/renew">
                    <Button size="sm">{renewLabel}</Button>
                  </Link>
                ) : undefined
              }
            >
              Renew early to keep member pricing on festival-season bookings.
            </Alert>
          </div>
        </section>
      )}

      {/* ---- Pending Zelle payments (renders nothing when there are none) ---- */}
      <ZellePendingPayments memberId={member.id} compact />

      {/* ---- Membership pass ---- */}
      <section aria-labelledby="pass-heading">
        <SectionTitle id="pass-heading" eyebrow="Show this at the desk">
          Your membership pass
        </SectionTitle>
        <div className="mt-5">
          <MembershipPass member={member} familyMembers={familyMembers} qrToken={qrToken} />
        </div>
      </section>

      {/* ---- Quick actions ---- */}
      <section aria-labelledby="actions-heading">
        <SectionTitle id="actions-heading" eyebrow="Shortcuts">
          What would you like to do?
        </SectionTitle>
        <Stagger as="ul" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <StaggerItem as="li" key={action.to}>
              <Link to={action.to} className="group block h-full">
                <Card interactive spine={action.tone} className="h-full pl-7">
                  <IconTile icon={action.icon} tone={action.tone} size="lg" shape="arch" />
                  <h3 className="mt-4 font-serif text-[22px] leading-tight text-ink">
                    {action.title}
                  </h3>
                  <p className="mt-1.5 text-[14.5px] leading-snug text-ink-2">{action.copy}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-saffron">
                    Start
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

      {/* ---- Manage ---- */}
      <section aria-labelledby="manage-heading">
        <SectionTitle id="manage-heading" eyebrow="Your account">
          Manage your membership
        </SectionTitle>
        <Stagger as="ul" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secondaryLinks
            .filter((l) => l.show)
            .map((link) => (
              <StaggerItem as="li" key={link.to}>
                <Link to={link.to} className="group block h-full">
                  <Card interactive className="flex h-full items-start gap-4">
                    <IconTile icon={link.icon} tone={link.tone} size="md" shape="arch" />
                    <div className="min-w-0">
                      <h3 className="text-[16px] font-semibold leading-tight text-ink">
                        {link.title}
                      </h3>
                      <p className="mt-1 text-[14px] leading-snug text-ink-2">{link.copy}</p>
                    </div>
                    <ChevronRightIcon
                      className="ml-auto mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Card>
                </Link>
              </StaggerItem>
            ))}
        </Stagger>
      </section>
    </div>
  )
}

function SectionTitle({
  id,
  eyebrow,
  children,
}: {
  id: string
  eyebrow: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-2 font-serif text-[28px] leading-tight text-ink">
        {children}
      </h2>
    </div>
  )
}
