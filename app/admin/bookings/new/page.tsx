'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'
import { formatPhoneNumber } from '@/lib/utils/formatters'

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
  const { userData } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [purohits, setPurohits] = useState<Purohit[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [cart, setCart] = useState<CartItem[]>([])

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

  const getServicePrice = (service: Service, locationType: 'Temple' | 'External'): number => {
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

    const newItem: CartItem = {
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

      // Get staff info
      const { data: staffMemberData } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('auth_user_id', userData?.user?.id)
        .single()

      const staffName = staffMemberData
        ? `${staffMemberData.first_name} ${staffMemberData.last_name}`
        : null

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
        bookingData.reviewed_by = userData?.user?.id
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
      <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
        <AdminLayout>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading booking form...</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  const selectedService = services.find(s => s.id === selectedServiceId)
  const selectedMember = members.find(m => m.id === selectedMemberId)

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Service Booking</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a booking on behalf of a member
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/bookings')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Bookings
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Member Selection */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Member</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Member
                    </label>
                    <input
                      type="text"
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      placeholder="Search by name, membership #, or email..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    />
                  </div>
                  <div>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      size={8}
                    >
                      <option value="">-- No Member (Community Member) --</option>
                      {filteredMembers.slice(0, 50).map(member => (
                        <option key={member.id} value={member.id}>
                          {member.membership_number} - {member.first_name} {member.last_name}
                          {member.primary_email ? ` (${member.primary_email})` : ''}
                        </option>
                      ))}
                    </select>
                    {filteredMembers.length > 50 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Showing first 50 results. Refine your search to see more.
                      </p>
                    )}
                  </div>
                  {selectedMember && (
                    <div className="bg-blue-50 p-3 rounded-md text-sm">
                      <p><strong>Member Type:</strong> {selectedMember.current_level}</p>
                      <p><strong>Phone:</strong> {selectedMember.primary_phone || 'N/A'}</p>
                      <p><strong>Email:</strong> {selectedMember.primary_email || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Requester Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requester Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={requesterPhone}
                      onChange={(e) => setRequesterPhone(formatPhoneNumber(e.target.value))}
                      placeholder="(555) 123-4567"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={requesterEmail}
                      onChange={(e) => setRequesterEmail(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Add Service to Cart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Service</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Service <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    >
                      <option value="">Choose a service...</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} {service.display_name ? `(${service.display_name})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedService?.description && (
                      <p className="mt-1 text-sm text-gray-500">{selectedService.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={serviceTime}
                        onChange={(e) => setServiceTime(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="Temple"
                          checked={locationType === 'Temple'}
                          onChange={() => setLocationType('Temple')}
                          className="mr-2"
                        />
                        Inside Temple
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="External"
                          checked={locationType === 'External'}
                          onChange={() => setLocationType('External')}
                          disabled={selectedService?.is_temple_only}
                          className="mr-2"
                        />
                        External Location
                      </label>
                    </div>
                    {locationType === 'External' && (
                      <input
                        type="text"
                        value={locationAddress}
                        onChange={(e) => setLocationAddress(e.target.value)}
                        placeholder="Enter complete address"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Priest <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedPurohitId}
                      onChange={(e) => setSelectedPurohitId(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    >
                      <option value="">Choose a priest...</option>
                      {purohits.map(purohit => (
                        <option key={purohit.id} value={purohit.id}>
                          {purohit.name} {purohit.specialties ? `- ${purohit.specialties}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for this service
                    </label>
                    <textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      placeholder="Any special requirements..."
                    />
                  </div>

                  {selectedService && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm font-medium text-blue-900">
                        Price: ${getServicePrice(selectedService, locationType).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
                  >
                    Add to Booking
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Booking Summary
                </h2>

                {cart.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No services added yet
                  </p>
                ) : (
                  <>
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="border-b pb-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.service_name}</p>
                              <p className="text-sm text-gray-600">{item.purohit_name}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.service_date).toLocaleDateString()} at {item.service_time}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.location_type === 'Temple' ? 'At Temple' : item.location_address}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                          <p className="text-right font-semibold text-gray-900">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-[#FF9933]">${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933] text-sm"
                        placeholder="General notes..."
                      />
                    </div>

                    {/* Staff Options */}
                    <div className="mb-4 border-t pt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Staff Options</h3>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Booking Source
                          </label>
                          <select
                            value={bookingSource}
                            onChange={(e) => setBookingSource(e.target.value as any)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933] text-sm"
                          >
                            <option value="Walk-in">Walk-in</option>
                            <option value="Phone">Phone</option>
                            <option value="Online">Online</option>
                          </select>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="markAsPaid"
                            checked={markAsPaid}
                            onChange={(e) => setMarkAsPaid(e.target.checked)}
                            className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933] border-gray-300 rounded"
                          />
                          <label htmlFor="markAsPaid" className="ml-2 text-sm text-gray-700">
                            Mark as Paid (cash/check received)
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitBooking}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                    >
                      {submitting ? 'Creating...' : 'Create Booking'}
                    </button>

                    {!markAsPaid && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Booking will be created as Pending Approval
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
