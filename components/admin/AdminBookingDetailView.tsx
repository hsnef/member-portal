'use client'

/**
 * Booking detail for the office console — presentation only.
 *
 * app/admin/bookings/[id]/page.tsx owns the fetch, the approve/reject
 * mutations and the notification calls.
 *
 * Exemplar: design-kit/pages/admin/AdminMemberDetail.tsx — RecordHeader +
 * DescriptionList + an action rail (Approve / Decline).
 */

import React from 'react'
import { CheckIcon, FlameIcon, MapPinIcon, XIcon } from 'lucide-react'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { IconTile } from '@/components/ui/IconTile'
import { Modal } from '@/components/ui/Modal'
import { RecordHeader } from '@/components/ui/RecordHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Field, Textarea } from '@/components/ui/Field'
import { formatCurrency, formatDate } from '@/utils/format'
import type { RequestStatus } from '@/types/design-system'

export interface AdminBookingItem {
  id: string
  service_date: string
  service_time: string
  location_type: string
  location_address: string
  notes?: string
  price: number
  services: { name: string; display_name?: string }
  purohits: { name: string }
}

export interface AdminBooking {
  id: string
  member_id?: string
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
  members?: {
    membership_number: string
    first_name: string
    last_name: string
    current_level: string
  }
  service_booking_items: AdminBookingItem[]
}

export interface AdminBookingDetailViewProps {
  booking: AdminBooking
  processing: boolean
  showApproveModal: boolean
  onShowApprove: (open: boolean) => void
  showRejectModal: boolean
  onShowReject: (open: boolean) => void
  approvalNotes: string
  onApprovalNotesChange: (v: string) => void
  rejectionReason: string
  onRejectionReasonChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
}

export function AdminBookingDetailView({
  booking,
  processing,
  showApproveModal,
  onShowApprove,
  showRejectModal,
  onShowReject,
  approvalNotes,
  onApprovalNotesChange,
  rejectionReason,
  onRejectionReasonChange,
  onApprove,
  onReject,
}: AdminBookingDetailViewProps) {
  const reference = booking.id.slice(0, 8).toUpperCase()
  const pending = booking.status === 'Pending Approval'
  const items = booking.service_booking_items ?? []

  return (
    <div className="space-y-7">
      <RecordHeader
        crumbs={[{ label: 'Bookings', to: '/admin/bookings' }, { label: `#${reference}` }]}
        icon={FlameIcon}
        tone="copper"
        eyebrow="Service booking"
        title={booking.requester_name}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={booking.status as RequestStatus} />
            <span className="tnum text-[14px] text-ink-3">
              #{reference} · requested {formatDate(booking.created_at)}
            </span>
          </div>
        }
        actions={
          pending ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={XIcon} onClick={() => onShowReject(true)}>
                Decline
              </Button>
              <Button icon={CheckIcon} onClick={() => onShowApprove(true)}>
                Approve
              </Button>
            </div>
          ) : undefined
        }
      />

      {booking.status === 'Rejected' && booking.rejection_reason && (
        <Alert tone="danger" title="This booking was declined">
          {booking.rejection_reason}
        </Alert>
      )}

      {booking.approval_notes && (
        <Alert tone="info" title="Approval note">
          {booking.approval_notes}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
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

        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="kumkum" className="pl-7">
            <CardHeader title="Requester" />
            <DescriptionList
              items={[
                { label: 'Name', value: booking.requester_name },
                { label: 'Phone', value: booking.requester_phone, numeric: true },
                { label: 'Email', value: booking.requester_email },
                ...(booking.members
                  ? [
                      {
                        label: 'Membership',
                        value: booking.members.membership_number,
                        numeric: true,
                      },
                      { label: 'Level', value: booking.members.current_level },
                    ]
                  : [{ label: 'Membership', value: 'Not a member' }]),
              ]}
            />
            {booking.member_id && (
              <AppLink to={`/admin/members/${booking.member_id}`} className="mt-4 block">
                <Button variant="secondary" fullWidth>
                  Open member record
                </Button>
              </AppLink>
            )}
          </Card>

          {booking.additional_notes && (
            <Card tone="sunk">
              <CardHeader title="Notes from the member" />
              <p className="text-[14.5px] leading-relaxed text-ink-2">
                {booking.additional_notes}
              </p>
            </Card>
          )}

          {booking.reviewed_by_name && booking.reviewed_at && (
            <Card tone="sunk">
              <CardHeader title="Reviewed" />
              <p className="text-[14.5px] text-ink-2">
                by <span className="font-semibold text-ink">{booking.reviewed_by_name}</span>
                <br />
                <span className="tnum">{formatDate(booking.reviewed_at)}</span>
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Approve */}
      <Modal open={showApproveModal} onClose={() => onShowApprove(false)} title="Approve this booking?">
        <p className="text-[15px] leading-relaxed text-ink-2">
          The member will be emailed a payment link for{' '}
          <span className="tnum font-semibold text-ink">
            {formatCurrency(booking.total_amount, true)}
          </span>
          .
        </p>
        <div className="mt-5">
          <Field label="Note for the member" hint="Optional — included in the approval email.">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={approvalNotes}
                onChange={(e) => onApprovalNotesChange(e.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onShowApprove(false)}>
            Cancel
          </Button>
          <Button icon={CheckIcon} loading={processing} onClick={onApprove}>
            Approve and send
          </Button>
        </div>
      </Modal>

      {/* Decline */}
      <Modal open={showRejectModal} onClose={() => onShowReject(false)} title="Decline this booking?">
        <p className="text-[15px] leading-relaxed text-ink-2">
          The member will be told their booking was not approved, and given the reason below.
        </p>
        <div className="mt-5">
          <Field label="Reason" required hint="This is shown to the member, so keep it kind.">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={rejectionReason}
                onChange={(e) => onRejectionReasonChange(e.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onShowReject(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={processing}
            disabled={!rejectionReason.trim()}
            onClick={onReject}
          >
            Decline booking
          </Button>
        </div>
      </Modal>
    </div>
  )
}
