'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { downloadInvoice } from '@/lib/pdf/invoice'
import { RequestsView, type MemberRequest } from '@/components/member/RequestsView'

export default function MemberRequestsPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [requests, setRequests] = useState<MemberRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!member) return
    fetchRequests()
  }, [member])

  const fetchRequests = async () => {
    if (!member) return

    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayRequest = (requestId: string) => {
    router.push(`/member/requests/${requestId}/payment`)
  }

  const handleDownloadInvoice = (request: MemberRequest) => {
    if (!member) return

    const memberName = member.member_class === 'Personal'
      ? `${member.first_name} ${member.last_name}`
      : member.business_name || ''

    downloadInvoice({
      invoiceNumber: `INV-${request.id.slice(0, 8).toUpperCase()}`,
      requestId: request.id,
      memberName,
      membershipId: member.membership_id,
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
      dueDate: request.due_date,
    })
  }

  return (
    <RequestsView
      requests={requests}
      loading={loading}
      onPay={handlePayRequest}
      onDownloadInvoice={handleDownloadInvoice}
    />
  )
}
