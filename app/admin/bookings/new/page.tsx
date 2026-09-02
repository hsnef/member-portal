'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { formatPhoneNumber } from '@/lib/utils/formatters'
import {
  BookingWizardView,
  type WizardService,
  type WizardPurohit,
  type WizardCartItem,
} from '@/components/member/BookingWizardView'
import { MemberPicker } from '@/components/admin/MemberPicker'
import { FormSection } from '@/components/admin/AdminFormView'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Select } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { CheckIcon } from 'lucide-react'

interface Service {
  id: string
  name: string
  display_name?: string
  description?: string
  category: string
  price_member_temple?: number
  price_community_temple?: number
  price_member_external?: number
  price_community_external?: number
  duration_minutes?: number
  preparation_notes?: string
  is_temple_only: boolean
}

interface Purohit {
  id: string
  name: string
  specialties?: string
}

interface Member {
  id: string
  membership_number: string
  first_name: string
  last_name: string
  primary_email?: string
  primary_phone?: string
  current_level: string
}

interface CartItem {
  id: string
  service_id: string
  service_name: string
  service_date: string
  service_time: string
  location_type: 'Temple' | 'External'
  location_address: string
  purohit_id: string
  purohit_name: string
  notes: string
  price: number
}

export default function StaffNewBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, member: staffMember } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<WizardService[]>([])
  const [purohits, setPurohits] = useState<WizardPurohit[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [cart, setCart] = useState<WizardCartItem[]>([])

  // Member selection
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberSearchTerm, setMemberSearchTerm] = useState('')

  // Form state for adding to cart
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [serviceTime, setServiceTime] = useState('')
  const [locationType, setLocationType] = useState<'Temple' | 'External'>('Temple')
  const [locationAddress, setLocationAddress] = useState('')
  const [selectedPurohitId, setSelectedPurohitId] = useState('')
  const [itemNotes, setItemNotes] = useState('')

  // Requester info (editable)
  const [requesterName, setRequesterName] = useState('')
  const [requesterPhone, setRequesterPhone] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Staff options
  const [markAsPaid, setMarkAsPaid] = useState(false)
  const [bookingSource, setBookingSource] = useState<'Walk-in' | 'Phone' | 'Online'>('Walk-in')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedMemberId) {
      const member = members.find(m => m.id === selectedMemberId)
      if (member) {
        setRequesterName(`${member.first_name} ${member.last_name}`)
        setRequesterPhone(member.primary_phone || '')
        setRequesterEmail(member.primary_email || '')
      }
    }
  }, [selectedMemberId, members])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch members
      const { data: membersData } = await supabase
        .from('members')
        .select('id, membership_number, first_name, last_name, primary_email, primary_phone, current_level')
        .order('membership_number', { ascending: true })

      setMembers(membersData || [])

      // Fetch active services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setServices(servicesData || [])

      // Fetch active purohits
      const { data: purohitsData } = await supabase
        .from('purohits')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setPurohits(purohitsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load booking form data')
    } finally {
      setLoading(false)
    }
  }

  const getServicePrice = (service: WizardService, locationType: 'Temple' | 'External'): number => {
    const selectedMember = members.find(m => m.id === selectedMemberId)
    const isMember = selectedMember?.current_level === 'Annual' || selectedMember?.current_level === 'Lifetime'

    if (locationType === 'Temple') {
      return isMember
        ? (service.price_member_temple || 0)
        : (service.price_community_temple || 0)
    } else {
      return isMember
        ? (service.price_member_external || 0)
        : (service.price_community_external || 0)
    }
  }

  const handleAddToCart = () => {
    if (!selectedServiceId) {
      alert('Please select a service')
      return
    }
    if (!serviceDate) {
      alert('Please select a date')
      return
    }
    if (!serviceTime) {
      alert('Please select a time')
      return
    }
    if (locationType === 'External' && !locationAddress.trim()) {
      alert('Please enter the service location address')
      return
    }
    if (!selectedPurohitId) {
      alert('Please select a priest')
      return
    }

    const service = services.find(s => s.id === selectedServiceId)
    const purohit = purohits.find(p => p.id === selectedPurohitId)

    if (!service || !purohit) return

    if (service.is_temple_only && locationType === 'External') {
      alert('This service can only be performed at the temple')
      return
    }

    const price = getServicePrice(service, locationType)

    const newItem: WizardCartItem = {
      id: Math.random().toString(36).substr(2, 9),
      service_id: service.id,
      service_name: service.name,
      service_date: serviceDate,
      service_time: serviceTime,
      location_type: locationType,
      location_address: locationType === 'External' ? locationAddress : 'HSNEF Temple',
      purohit_id: purohit.id,
      purohit_name: purohit.name,
      notes: itemNotes,
      price: price
    }

    setCart([...cart, newItem])

    // Reset form
    setSelectedServiceId('')
    setServiceDate('')
    setServiceTime('')
    setLocationType('Temple')
    setLocationAddress('')
    setSelectedPurohitId('')
    setItemNotes('')
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price, 0)
  }

  const handleSubmitBooking = async () => {
    if (cart.length === 0) {
      alert('Please add at least one service to the booking')
      return
    }

    if (!requesterName.trim() || !requesterPhone.trim() || !requesterEmail.trim()) {
      alert('Please fill in all requester information')
      return
    }

    try {
      setSubmitting(true)

      // Determine initial status
      let initialStatus = 'Pending Approval'
      if (markAsPaid) {
        initialStatus = 'Paid'
      }

      // useAuth already resolves the signed-in staff member. The previous
      // lookup keyed off an undefined value and always failed, so a walk-in
      // booking marked paid recorded a null reviewed_by and no staff name.
      const staffName =
        [staffMember?.first_name, staffMember?.last_name].filter(Boolean).join(' ') || null

      // Create booking
      const bookingData: any = {
        member_id: selectedMemberId || null,
        requester_name: requesterName.trim(),
        requester_phone: requesterPhone.trim(),
        requester_email: requesterEmail.trim(),
        total_amount: getTotalAmount(),
        status: initialStatus,
        additional_notes: additionalNotes.trim() || null,
      }

      // If marking as paid, auto-approve with staff details
      if (markAsPaid) {
        bookingData.reviewed_by = user?.id ?? null
        bookingData.reviewed_by_name = staffName
        bookingData.reviewed_at = new Date().toISOString()
        bookingData.approval_notes = `Walk-in/Phone booking processed by staff. Payment received (${bookingSource}).`
      }

      const { data: createdBooking, error: bookingError } = await supabase
        .from('service_bookings')
        .insert(bookingData)
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create booking items
      const items = cart.map(item => ({
        booking_id: createdBooking.id,
        service_id: item.service_id,
        purohit_id: item.purohit_id,
        service_date: item.service_date,
        service_time: item.service_time,
        location_type: item.location_type,
        location_address: item.location_address,
        notes: item.notes || null,
        price: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('service_booking_items')
        .insert(items)

      if (itemsError) throw itemsError

      const message = markAsPaid
        ? 'Booking created and marked as paid successfully!'
        : 'Booking created successfully! It is pending approval.'

      alert(message)
      router.push('/admin/bookings')
    } catch (error: any) {
      console.error('Error submitting booking:', error)
      alert(`Failed to submit booking: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMembers = members.filter(m =>
    memberSearchTerm === '' ||
    m.membership_number.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    m.first_name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    m.last_name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    m.primary_email?.toLowerCase().includes(memberSearchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading...</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null

  return (
    <BookingWizardView
      eyebrow="Office console"
      title="Book on behalf of a member"
      description="For a walk-in or a booking taken over the phone. You can mark it paid straight away."
      submitLabel={markAsPaid ? 'Create and mark paid' : 'Create booking'}
      submitNote={
        markAsPaid
          ? 'Recorded as paid and auto-approved, with your name against the approval.'
          : 'Created as pending approval, exactly as a member-made booking would be.'
      }
      services={services}
      purohits={purohits}
      cart={cart}
      total={getTotalAmount()}
      submitting={submitting}
      selectedServiceId={selectedServiceId}
      onServiceChange={setSelectedServiceId}
      serviceDate={serviceDate}
      onDateChange={setServiceDate}
      serviceTime={serviceTime}
      onTimeChange={setServiceTime}
      locationType={locationType}
      onLocationTypeChange={setLocationType}
      locationAddress={locationAddress}
      onLocationAddressChange={setLocationAddress}
      selectedPurohitId={selectedPurohitId}
      onPurohitChange={setSelectedPurohitId}
      itemNotes={itemNotes}
      onItemNotesChange={setItemNotes}
      onAddToCart={handleAddToCart}
      onRemoveFromCart={handleRemoveFromCart}
      requesterName={requesterName}
      onRequesterNameChange={setRequesterName}
      requesterPhone={requesterPhone}
      onRequesterPhoneChange={setRequesterPhone}
      requesterEmail={requesterEmail}
      onRequesterEmailChange={setRequesterEmail}
      additionalNotes={additionalNotes}
      onAdditionalNotesChange={setAdditionalNotes}
      onSubmit={handleSubmitBooking}
      leadingSection={
        <MemberPicker
          title="Who is this booking for?"
          description="Search the directory, or continue without a member for a non-member walk-in."
          searchQuery={memberSearchTerm}
          onSearchQueryChange={setMemberSearchTerm}
          /* Members are preloaded and filtered locally, so there is nothing to
             fetch on search -- the list narrows as you type. */
          onSearch={() => {}}
          results={
            memberSearchTerm
              ? filteredMembers.slice(0, 8).map((m) => ({
                  id: m.id,
                  membership_id: m.membership_number,
                  first_name: m.first_name,
                  last_name: m.last_name,
                  primary_email: m.primary_email,
                  current_level: m.current_level,
                }))
              : []
          }
          selected={
            selectedMember
              ? {
                  id: selectedMember.id,
                  membership_id: selectedMember.membership_number,
                  first_name: selectedMember.first_name,
                  last_name: selectedMember.last_name,
                  primary_email: selectedMember.primary_email,
                  current_level: selectedMember.current_level,
                }
              : null
          }
          onSelect={(m) => {
            setSelectedMemberId(m.id)
            const full = members.find((x) => x.id === m.id)
            if (full) {
              setRequesterName(`${full.first_name} ${full.last_name}`.trim())
              setRequesterPhone(full.primary_phone || '')
              setRequesterEmail(full.primary_email || '')
            }
            setMemberSearchTerm('')
          }}
          onClear={() => setSelectedMemberId('')}
          allowNone
          onSelectNone={() => setMemberSearchTerm('')}
        />
      }
      trailingSection={
        <Card>
          <CardHeader
            title="How this booking was taken"
            description="Recorded on the booking so the office knows where it came from."
          />
          <div className="space-y-5">
            <Field label="Source">
              {({ id }) => (
                <Select
                  id={id}
                  value={bookingSource}
                  onChange={(e) =>
                    setBookingSource(e.target.value as 'Walk-in' | 'Phone' | 'Online')
                  }
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Phone">Phone</option>
                  <option value="Online">Online</option>
                </Select>
              )}
            </Field>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={markAsPaid}
                onChange={(e) => setMarkAsPaid(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
              />
              <span>
                <span className="flex items-center gap-1.5 text-[15px] text-ink">
                  <CheckIcon className="h-4 w-4 text-tulsi" aria-hidden="true" />
                  Payment already taken
                </span>
                <span className="block text-[13.5px] text-ink-3">
                  Approves the booking immediately and records it as paid, with your name against
                  the approval. Leave unticked to send it through normal approval.
                </span>
              </span>
            </label>
          </div>
        </Card>
      }
    />
  )
}
