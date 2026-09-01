'use client'

/**
 * Events catalog — presentation only.
 *
 * app/member/events/page.tsx owns the Supabase query (including the
 * test-account isolation logic), registration and cancellation.
 *
 * Exemplar: design-kit/pages/Events.tsx (catalog / browse archetype)
 */

import React, { useMemo, useState } from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react'
import { AppLink } from '@/components/nav/Nav'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterTabs } from '@/components/ui/FilterTabs'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatLongDate } from '@/utils/format'

export interface MemberEvent {
  id: string
  event_name: string
  event_date: string
  event_time: string
  location: string
  short_description: string | null
  description: string
  category: string
  rsvp_enabled: boolean
  is_payable: boolean
  max_capacity: number
  member_price: number
  non_member_price: number
  registration_deadline: string
  image_url?: string
  contact_email?: string
  contact_phone?: string
  registration_count?: number
  is_registered?: boolean
}

export interface EventsViewProps {
  events: MemberEvent[]
  loading: boolean
  categories: string[]
  category: string
  onCategoryChange: (category: string) => void
  getEventPrice: (event: MemberEvent) => number
  isEventFull: (event: MemberEvent) => boolean
  isRegistrationClosed: (event: MemberEvent) => boolean
  onRegister: (eventId: string) => void
  onUnregister: (eventId: string) => void
  /** Id of the event awaiting cancel confirmation, or null. */
  cancelConfirmId: string | null
  onRequestCancel: (eventId: string | null) => void
  cancelling: boolean
}

export function EventsView({
  events,
  loading,
  categories,
  category,
  onCategoryChange,
  getEventPrice,
  isEventFull,
  isRegistrationClosed,
  onRegister,
  onUnregister,
  cancelConfirmId,
  onRequestCancel,
  cancelling,
}: EventsViewProps) {
  const filtered = useMemo(
    () => events.filter((e) => category === 'All' || e.category === category),
    [events, category]
  )

  const pendingCancel = events.find((e) => e.id === cancelConfirmId) ?? null

  if (loading) {
    return (
      <div className="space-y-7">
        <PageHeader eyebrow="At the temple" title="Events" />
        <div className="grid gap-6 lg:grid-cols-2" role="status" aria-live="polite">
          <span className="sr-only">Loading events…</span>
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="At the temple"
        title="Events"
        description="Festivals, classes and seva. Register for yourself and your family."
      />

      {categories.length > 1 && (
        <FilterTabs
          label="Filter events by category"
          options={categories}
          value={category}
          onChange={onCategoryChange}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDaysIcon}
          title={category === 'All' ? 'No upcoming events' : `No upcoming ${category} events`}
          description={
            category === 'All'
              ? 'When the temple publishes its next festival or class, it will appear here.'
              : 'Try another category — there may be events of a different kind coming up.'
          }
          action={
            category !== 'All' ? (
              <Button variant="secondary" onClick={() => onCategoryChange('All')}>
                Show all events
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-6 lg:grid-cols-2">
          {filtered.map((event) => {
            const price = getEventPrice(event)
            const full = isEventFull(event)
            const closed = isRegistrationClosed(event)
            const spotsLeft =
              event.max_capacity > 0
                ? event.max_capacity - (event.registration_count ?? 0)
                : null
            const blurb = event.short_description?.trim()
              ? event.short_description
              : stripHtml(event.description)

            return (
              <Card as="li" key={event.id} padded={false} className="flex flex-col overflow-hidden">
                {event.image_url && (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={event.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-20 bg-kumkum/70 [mask-image:linear-gradient(to_top,black,transparent)]"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="marigold">{event.category}</Badge>
                    {event.is_registered && (
                      <Badge tone="tulsi" dot>
                        You&apos;re registered
                      </Badge>
                    )}
                    {!event.is_registered && full && <Badge tone="danger">Full</Badge>}
                    {!event.is_registered &&
                      !full &&
                      spotsLeft !== null &&
                      spotsLeft <= 20 && (
                        <Badge tone="danger">{spotsLeft} spots left</Badge>
                      )}
                  </div>

                  <h2 className="mt-3 font-serif text-[26px] leading-tight text-ink">
                    {event.event_name}
                  </h2>

                  <dl className="mt-3 space-y-1.5 text-[14.5px] text-ink-2">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                      <dd className="tnum">{formatLongDate(event.event_date)}</dd>
                    </div>
                    {event.event_time && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                        <dd className="tnum">{event.event_time}</dd>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                        <dd>{event.location}</dd>
                      </div>
                    )}
                    {event.max_capacity > 0 && (
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                        <dd className="tnum">
                          {event.registration_count ?? 0} of {event.max_capacity} registered
                        </dd>
                      </div>
                    )}
                  </dl>

                  {blurb && (
                    <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink-2">
                      {blurb}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <p className="tnum font-serif text-[24px] leading-none text-ink">
                      {event.is_payable && price > 0 ? formatCurrency(price) : 'Free'}
                    </p>

                    <div className="flex gap-2">
                      <AppLink to={`/member/events/${event.id}`}>
                        <Button variant="secondary" size="sm">
                          Details
                        </Button>
                      </AppLink>

                      {event.rsvp_enabled &&
                        (event.is_registered ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRequestCancel(event.id)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            icon={TicketIcon}
                            disabled={full || closed}
                            onClick={() => onRegister(event.id)}
                          >
                            {full ? 'Full' : closed ? 'Closed' : 'Register'}
                          </Button>
                        ))}
                    </div>
                  </div>

                  {!event.is_registered && closed && !full && (
                    <p className="mt-2 text-[13px] text-ink-3">
                      Registration has closed for this event.
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </ul>
      )}

      <Modal
        open={Boolean(pendingCancel)}
        onClose={() => onRequestCancel(null)}
        title="Cancel your registration?"
      >
        <p className="text-[15px] leading-relaxed text-ink-2">
          You are about to cancel your place at{' '}
          <span className="font-semibold text-ink">{pendingCancel?.event_name}</span>. If the event
          was paid, the office will be in touch about a refund.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onRequestCancel(null)}>
            Keep my place
          </Button>
          <Button
            variant="danger"
            loading={cancelling}
            onClick={() => pendingCancel && onUnregister(pendingCancel.id)}
          >
            Cancel registration
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}
