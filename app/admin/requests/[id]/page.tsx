'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { downloadInvoice } from '@/lib/pdf/invoice'
import { AppLink } from '@/components/nav/Nav'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { EmptyState } from '@/components/ui/EmptyState'
import { RecordHeader } from '@/components/ui/RecordHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ScrollTextIcon, DownloadIcon, SendIcon, CheckIcon, XIcon, FileQuestionIcon } from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/format'
import type { RequestStatus } from '@/types/design-system'

interface Request {
  id: string
  member_id: string
  membership_id: string
  request_type: string
  service_description: string
  requested_date: string
  amount: number
  status: 'Draft' | 'Sent' | 'Paid' | 'Completed' | 'Cancelled'
  payment_id?: string
  notes?: string
  created_at: string
}

interface Member {
  first_name: string
  last_name: string
  business_name: string
  member_class: string
  primary_email: string
  primary_phone?: string
  address_line_1?: string
  city?: string
  state?: string
  zip?: string
}

export default function ViewRequestPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const supabase = createClient()

  const [request, setRequest] = useState<Request | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  const fetchRequest = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (requestError) throw requestError
      setRequest(requestData)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', requestData.member_id)
        .single()

      if (memberError) throw memberError
      setMember(memberData)
    } catch (error) {
      console.error('Error fetching request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!request) return

    // Ask if they want to send notification for relevant status changes
    const notifyStatuses = ['Sent', 'Paid', 'Completed', 'Cancelled']
    let sendNotification = false

    if (notifyStatuses.includes(newStatus)) {
      sendNotification = confirm(`Change status to ${newStatus}?\n\nClick OK to also send email notification to member.\nClick Cancel to update status without notification.`)
      if (!sendNotification && !confirm(`Update status to ${newStatus} WITHOUT sending email?`)) {
        return
      }
    } else {
      if (!confirm(`Change status to ${newStatus}?`)) return
    }

    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('id', request.id)

      if (error) throw error

      // Send notification if requested
      if (sendNotification) {
        try {
          const emailResponse = await fetch('/api/requests/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: request.id,
              status: newStatus,
            }),
          })

          if (emailResponse.ok) {
            alert('Status updated and notification sent!')
          } else {
            alert('Status updated but failed to send notification.')
          }
        } catch (emailError) {
          console.error('Error sending notification:', emailError)
          alert('Status updated but failed to send notification.')
        }
      } else {
        alert('Status updated successfully!')
      }

      fetchRequest()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleDownloadInvoice = () => {
    if (!request || !member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name

    downloadInvoice({
      invoiceNumber: `INV-${request.id.slice(0, 8).toUpperCase()}`,
      requestId: request.id,
      memberName,
      membershipId: request.membership_id,
      memberEmail: member.primary_email,
      memberAddress: member.address_line_1
        ? `${member.address_line_1}, ${member.city}, ${member.state} ${member.zip}`
        : undefined,
      requestType: request.request_type,
      serviceDescription: request.service_description,
      requestedDate: request.requested_date,
      amount: request.amount,
      status: request.status,
      notes: request.notes,
      createdDate: request.created_at,
      dueDate: request.requested_date,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Sent': return 'bg-blue-100 text-blue-800'
      case 'Paid': return 'bg-green-100 text-green-800'
      case 'Completed': return 'bg-purple-100 text-purple-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading this request...</span>
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!request) {
    return (
      <EmptyState
        icon={FileQuestionIcon}
        title="Request not found"
        description="This request may have been removed."
        action={
          <AppLink to="/admin/requests">
            <Button>Back to requests</Button>
          </AppLink>
        }
      />
    )
  }

  const reference = `INV-${request.id.slice(0, 8).toUpperCase()}`
  const memberName =
    member?.member_class === 'Business'
      ? member?.business_name
      : [member?.first_name, member?.last_name].filter(Boolean).join(' ')

  return (
    <div className="space-y-7">
      <RecordHeader
        crumbs={[{ label: 'Requests', to: '/admin/requests' }, { label: reference }]}
        icon={ScrollTextIcon}
        tone="lotus"
        eyebrow="Service request"
        title={request.request_type}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={request.status as RequestStatus} />
            <span className="tnum text-[14px] text-ink-3">
              {reference} \\u00b7 raised {formatDate(request.created_at)}
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={DownloadIcon} onClick={handleDownloadInvoice}>
              Invoice
            </Button>
            {request.status === 'Draft' && (
              <Button icon={SendIcon} onClick={() => handleUpdateStatus('Sent')}>
                Send to member
              </Button>
            )}
            {request.status === 'Sent' && (
              <Button icon={CheckIcon} onClick={() => handleUpdateStatus('Paid')}>
                Mark paid
              </Button>
            )}
            {request.status === 'Paid' && (
              <Button icon={CheckIcon} onClick={() => handleUpdateStatus('Completed')}>
                Mark completed
              </Button>
            )}
          </div>
        }
      />

      {request.status === 'Cancelled' && (
        <Alert tone="danger" title="This request was cancelled">
          It is kept for the record. Raise a new request if the service is still wanted.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Card>
          <CardHeader title="What was requested" />
          <DescriptionList
            columns={2}
            items={[
              { label: 'Type', value: request.request_type },
              {
                label: 'Requested for',
                value: request.requested_date ? formatDate(request.requested_date) : '\\u2014',
                numeric: true,
              },
              { label: 'Reference', value: reference, numeric: true },
              { label: 'Status', value: request.status },
            ]}
          />

          {request.service_description && (
            <div className="mt-5 rounded-2xl border border-line bg-surface-sunk p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                Description
              </p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
                {request.service_description}
              </p>
            </div>
          )}

          {request.notes && (
            <div className="mt-4 rounded-2xl border border-line bg-surface-sunk p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                Office notes
              </p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{request.notes}</p>
            </div>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
            <p className="font-serif text-[21px] text-ink">Amount</p>
            <p className="tnum font-serif text-[30px] leading-none text-ink">
              {formatCurrency(request.amount, true)}
            </p>
          </div>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-24">
          <Card spine="kumkum" className="pl-7">
            <CardHeader title="Member" />
            <DescriptionList
              items={[
                { label: 'Name', value: memberName || '\\u2014' },
                { label: 'Membership', value: request.membership_id, numeric: true },
                { label: 'Email', value: member?.primary_email ?? '\\u2014' },
                ...(member?.primary_phone
                  ? [{ label: 'Phone', value: member.primary_phone, numeric: true }]
                  : []),
              ]}
            />
            {request.member_id && (
              <AppLink to={`/admin/members/${request.member_id}`} className="mt-4 block">
                <Button variant="secondary" fullWidth>
                  Open member record
                </Button>
              </AppLink>
            )}
          </Card>

          {request.status !== 'Cancelled' && request.status !== 'Completed' && (
            <Card tone="sunk">
              <CardHeader title="Cancel this request" />
              <p className="text-[14px] leading-relaxed text-ink-2">
                The member will no longer see it as outstanding.
              </p>
              <Button
                variant="secondary"
                icon={XIcon}
                fullWidth
                className="mt-4"
                onClick={() => handleUpdateStatus('Cancelled')}
              >
                Cancel request
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
