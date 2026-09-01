'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  BookingWizardView,
  type WizardService,
  type WizardPurohit,
  type WizardCartItem,
} from '@/components/member/BookingWizardView'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPhoneNumber } from '@/lib/utils/formatters'

export default function NewBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { member: authMember } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<WizardService[]>([])
  const [purohits, setPurohits] = useState<WizardPurohit[]>([])
  const [member, setMember] = useState<any>(null)
  const [cart, setCart] = useState<WizardCartItem[]>([])

  // Form state for adding to cart
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [serviceTime, setServiceTime] = useState('')
  const [locationType, setLocationType] = useState<'Temple' | 'External'>('Temple')
  const [locationAddress, setLocationAddress] = useState('')
  const [selectedPurohitId, setSelectedPurohitId] = useState('')
  const [itemNotes, setItemNotes] = useState('')

  // Requester info
  const [requesterName, setRequesterName] = useState('')
  const [requesterPhone, setRequesterPhone] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // useAuth already resolves the member; the previous lookup keyed off an
      // undefined value and always failed, so bookings were saved with
      // member_id: null and the contact fields were never prefilled.
      const memberData = authMember

      if (memberData) {
        setMember(memberData)
        setRequesterName(`${memberData.first_name} ${memberData.last_name}`)
        setRequesterPhone(memberData.primary_phone || '')
        setRequesterEmail(memberData.primary_email || '')
      }

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
    const isMember = member?.current_level === 'Annual' || member?.current_level === 'Lifetime'

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

    // Check if service is temple-only but external location selected
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
      alert('Please add at least one service to your booking')
      return
    }

    if (!requesterName.trim() || !requesterPhone.trim() || !requesterEmail.trim()) {
      alert('Please fill in all requester information')
      return
    }

    try {
      setSubmitting(true)

      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('service_bookings')
        .insert({
          member_id: member?.id || null,
          requester_name: requesterName.trim(),
          requester_phone: requesterPhone.trim(),
          requester_email: requesterEmail.trim(),
          total_amount: getTotalAmount(),
          status: 'Pending Approval',
          additional_notes: additionalNotes.trim() || null,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create booking items
      const items = cart.map(item => ({
        booking_id: bookingData.id,
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

      // Send confirmation email
      try {
        await fetch('/api/bookings/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingData.id,
            status: 'submitted',
          }),
        })
      } catch (emailError) {
        console.warn('Failed to send confirmation email:', emailError)
      }

      alert('Booking submitted successfully! A confirmation email has been sent. You will receive another notification once it is reviewed.')
      router.push('/member/bookings')
    } catch (error: any) {
      console.error('Error submitting booking:', error)
      alert(`Failed to submit booking: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <span className="sr-only">Loading services…</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <BookingWizardView
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
    />
  )
}
