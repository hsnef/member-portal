'use client'

/**
 * Booking detail — presentation only.
 *
 * app/member/bookings/[id]/page.tsx owns the fetch.
 *
 * Exemplar: design-kit/pages/admin/AdminMemberDetail.tsx — RecordHeader +
 * DescriptionList + StatusBadge, with a single column and an action rail
 * (the exemplar's tabs are dropped; a booking does not need them).
 */

import React from 'react'
import { CreditCardIcon, FlameIcon, MapPinIcon } from 'lucide-react'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { IconTile } from '@/components/ui/IconTile'
import { RecordHeader } from '@/components/ui/RecordHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate } from '@/utils/format'
import type { RequestStatus } from '@/types/design-system'

export interface BookingItem {
  id: string
  service_id: string
  purohit_id: string
  service_date: string
  service_time: string
  location_type: string
  location_address: string
  notes?: string
  price: number
  services: { name: string; display_name?: string }
  purohits: { name: string }
}

export interface BookingDetail {
  id: string
  requester_name: string
  requester_phone: string
  requester_email: string
  total_amount: number
  status: string
  additional_notes?: string
  created_at: string
  reviewed_by_name?: string
  reviewed_at?: string
  approval_notes?: string
  rejection_reason?: string
  service_booking_items: BookingItem[]
}

export interface BookingDetailViewProps {
  booking: BookingDetail
  onPay: (bookingId: string) => void
}

export function BookingDetailView({ booking, onPay }: BookingDetailViewProps) {
  const reference = booking.id.slice(0, 8).toUpperCase()
  const payable = booking.status === 'Approved'
  const declined = booking.status === 'Rejected' || booking.status === 'Cancelled'
  const items = booking.service_booking_items ?? []

  return (
    <div className="space-y-7">
      <RecordHeader
        crumbs={[
          { label: 'My bookings', to: '/member/bookings' },
          { label: `#${reference}` },
        ]}
        icon={FlameIcon}
        tone="copper"
        eyebrow="Service booking"
        title={`Booking #${reference}`}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status as RequestStatus} />
            <span className="tnum text-[14px] text-ink-3">
              Requested {formatDate(booking.created_at)}
            </span>
          </div>
        }
        actions={
          payable ? (
            <Button icon={CreditCardIcon} onClick={() => onPay(booking.id)}>
              Pay {formatCurrency(booking.total_amount)}
            </Button>
          ) : undefined
        }
      />

      {declined && booking.rejection_reason && (
        <Alert tone="danger" title="This booking was not approved">
          {booking.rejection_reason}
        </Alert>
      )}

      {payable && (
        <Alert
          tone="warning"
          title="Approved — payment needed to confirm"
          action={
            <Button size="sm" onClick={() => onPay(booking.id)}>
              Pay now
            </Button>
          }
        >
          The temple office has approved this booking. It is confirmed once payment clears.
        </Alert>
      )}

      {booking.approval_notes && (
        <Alert tone="info" title="A note from the office">
          {booking.approval_notes}
        </Alert>
      )}

      <Card>
        <CardHeader title="Services booked" />
        {items.length === 0 ? (
          <p className="text-[15px] text-ink-2">No service lines on this booking.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <IconTile icon={FlameIcon} tone="copper" size="md" shape="arch" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {item.services?.display_name || item.services?.name}
                  </p>
                  <p className="tnum mt-0.5 text-[14px] text-ink-2">
                    {formatDate(item.service_date)}
                    {item.service_time ? ` · ${item.service_time}` : ''}
                  </p>
                  <p className="mt-1 flex items-start gap-1.5 text-[13.5px] text-ink-3">
                    <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {item.location_type}
                      {item.location_address ? ` — ${item.location_address}` : ''}
                    </span>
                  </p>
                  {item.purohits?.name && (
                    <p className="mt-1 text-[13.5px] text-ink-3">
                      Purohit: {item.purohits.name}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-1 text-[13.5px] leading-snug text-ink-2">{item.notes}</p>
                  )}
                </div>
                <span className="tnum shrink-0 font-serif text-[20px] text-ink">
                  {formatCurrency(item.price)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
          <p className="font-serif text-[21px] text-ink">Total</p>
          <p className="tnum font-serif text-[30px] leading-none text-ink">
            {formatCurrency(booking.total_amount, true)}
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Booking details" />
        <DescriptionList
          columns={2}
          items={[
            { label: 'Reference', value: reference, numeric: true },
            { label: 'Status', value: booking.status },
            { label: 'Requested by', value: booking.requester_name },
            { label: 'Phone', value: booking.requester_phone, numeric: true },
            { label: 'Email', value: booking.requester_email },
            { label: 'Requested on', value: formatDate(booking.created_at), numeric: true },
            ...(booking.reviewed_by_name
              ? [{ label: 'Reviewed by', value: booking.reviewed_by_name }]
              : []),
            ...(booking.reviewed_at
              ? [{ label: 'Reviewed on', value: formatDate(booking.reviewed_at), numeric: true }]
              : []),
          ]}
        />

        {booking.additional_notes && (
          <div className="mt-5 rounded-2xl border border-line bg-surface-sunk p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
              Your notes
            </p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
              {booking.additional_notes}
            </p>
          </div>
        )}
      </Card>

      <AppLink to="/member/bookings">
        <Button variant="ghost">Back to my bookings</Button>
      </AppLink>
    </div>
  )
}
