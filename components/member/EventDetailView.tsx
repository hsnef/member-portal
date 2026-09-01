'use client'

/**
 * Event detail — presentation only.
 *
 * app/member/events/[id]/page.tsx owns the fetch, registration and
 * cancellation.
 *
 * Exemplar: design-kit/pages/Events.tsx for the vocabulary,
 * AdminMemberDetail.tsx for the record header + action rail.
 */

import React from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { RecordHeader } from '@/components/ui/RecordHeader'
import { formatCurrency, formatLongDate } from '@/utils/format'

export interface EventDetail {
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
  registration_deadline: string | null
  status: string
  image_url: string | null
  contact_email: string | null
  contact_phone: string | null
  registration_count?: number
  is_registered?: boolean
}

export interface EventDetailViewProps {
  event: EventDetail
  price: number
  full: boolean
  registrationClosed: boolean
  registering: boolean
  onRegister: () => void
  cancelConfirm: boolean
  onRequestCancel: (open: boolean) => void
  onUnregister: () => void
  cancelling: boolean
}

export function EventDetailView({
  event,
  price,
  full,
  registrationClosed,
  registering,
  onRegister,
  cancelConfirm,
  onRequestCancel,
  onUnregister,
  cancelling,
}: EventDetailViewProps) {
  const spotsLeft =
    event.max_capacity > 0 ? event.max_capacity - (event.registration_count ?? 0) : null

  return (
    <div className="space-y-7">
      <RecordHeader
        crumbs={[{ label: 'Events', to: '/member/events' }, { label: event.event_name }]}
        icon={CalendarDaysIcon}
        tone="marigold"
        eyebrow={event.category}
        title={event.event_name}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {event.is_registered && (
              <Badge tone="tulsi" dot>
                You&apos;re registered
              </Badge>
            )}
            {!event.is_registered && full && <Badge tone="danger">Full</Badge>}
            {!event.is_registered && !full && spotsLeft !== null && spotsLeft <= 20 && (
              <Badge tone="danger">{spotsLeft} spots left</Badge>
            )}
            <span className="tnum text-[14px] text-ink-3">
              {formatLongDate(event.event_date)}
            </span>
          </div>
        }
        actions={
          event.rsvp_enabled ? (
            event.is_registered ? (
              <Button variant="secondary" onClick={() => onRequestCancel(true)}>
                Cancel registration
              </Button>
            ) : (
              <Button
                icon={TicketIcon}
                loading={registering}
                disabled={full || registrationClosed}
                onClick={onRegister}
              >
                {full
                  ? 'Full'
                  : registrationClosed
                    ? 'Registration closed'
                    : event.is_payable && price > 0
                      ? `Register · ${formatCurrency(price)}`
                      : 'Register'}
              </Button>
            )
          ) : undefined
        }
      />

      {event.rsvp_enabled && registrationClosed && !event.is_registered && (
        <Alert tone="warning" title="Registration has closed">
          {event.registration_deadline
            ? `Registration closed on ${formatLongDate(event.registration_deadline)}.`
            : 'This event has already taken place.'}{' '}
          Contact the temple office if you still hope to attend.
        </Alert>
      )}

      {event.rsvp_enabled && full && !event.is_registered && !registrationClosed && (
        <Alert tone="warning" title="This event is full">
          All {event.max_capacity} places have been taken. The office may keep a waiting list.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          {event.image_url && (
            <Card padded={false} className="overflow-hidden">
              <img src={event.image_url} alt="" className="h-64 w-full object-cover" />
            </Card>
          )}

          <Card>
            <CardHeader title="About this event" />
            {event.description ? (
              <div
                className="prose-hsnef space-y-3 text-[15.5px] leading-relaxed text-ink-2 [&_a]:text-saffron [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-ink"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            ) : (
              <p className="text-[15px] text-ink-2">
                {event.short_description || 'No description has been added yet.'}
              </p>
            )}
          </Card>
        </div>

        {/* Details rail */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="marigold" className="pl-7">
            <CardHeader title="Details" />
            <dl className="space-y-3 text-[14.5px]">
              <Row icon={CalendarDaysIcon} label="Date">
                <span className="tnum">{formatLongDate(event.event_date)}</span>
              </Row>
              {event.event_time && (
                <Row icon={ClockIcon} label="Time">
                  <span className="tnum">{event.event_time}</span>
                </Row>
              )}
              {event.location && (
                <Row icon={MapPinIcon} label="Location">
                  {event.location}
                </Row>
              )}
              {event.max_capacity > 0 && (
                <Row icon={UsersIcon} label="Capacity">
                  <span className="tnum">
                    {event.registration_count ?? 0} of {event.max_capacity} registered
                  </span>
                </Row>
              )}
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <p className="font-serif text-[19px] text-ink">
                {event.is_payable && price > 0 ? 'Your price' : 'Entry'}
              </p>
              <p className="tnum font-serif text-[28px] leading-none text-ink">
                {event.is_payable && price > 0 ? formatCurrency(price) : 'Free'}
              </p>
            </div>
          </Card>

          {(event.contact_email || event.contact_phone) && (
            <Card tone="sunk">
              <CardHeader title="Questions?" />
              <div className="space-y-2 text-[14.5px]">
                {event.contact_email && (
                  <p className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                    <a
                      href={`mailto:${event.contact_email}`}
                      className="truncate font-semibold text-saffron hover:text-saffron-hover"
                    >
                      {event.contact_email}
                    </a>
                  </p>
                )}
                {event.contact_phone && (
                  <p className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                    <a
                      href={`tel:${event.contact_phone.replace(/[^0-9+]/g, '')}`}
                      className="tnum font-semibold text-saffron hover:text-saffron-hover"
                    >
                      {event.contact_phone}
                    </a>
                  </p>
                )}
              </div>
            </Card>
          )}

          <AppLink to="/member/events" className="block">
            <Button variant="ghost" fullWidth>
              Back to events
            </Button>
          </AppLink>
        </div>
      </div>

      <Modal
        open={cancelConfirm}
        onClose={() => onRequestCancel(false)}
        title="Cancel your registration?"
      >
        <p className="text-[15px] leading-relaxed text-ink-2">
          You are about to cancel your place at{' '}
          <span className="font-semibold text-ink">{event.event_name}</span>. If you paid, the
          office will be in touch about a refund.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onRequestCancel(false)}>
            Keep my place
          </Button>
          <Button variant="danger" loading={cancelling} onClick={onUnregister}>
            Cancel registration
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDaysIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{label}</dt>
        <dd className="mt-0.5 text-ink">{children}</dd>
      </div>
    </div>
  )
}
