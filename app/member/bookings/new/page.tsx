'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthContext'

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

interface CartItem {
  id: string // temporary ID for cart management
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

export default function NewBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userData } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [purohits, setPurohits] = useState<Purohit[]>([])
  const [member, setMember] = useState<any>(null)
  const [cart, setCart] = useState<CartItem[]>([])

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

      // Fetch member info
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userData?.user?.id)
        .single()

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

  const getServicePrice = (service: Service, locationType: 'Temple' | 'External'): number => {
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

      alert('Booking submitted successfully! You will receive a notification once it is reviewed.')
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
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading booking form...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const selectedService = services.find(s => s.id === selectedServiceId)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/member')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Book Services</h1>
            <p className="mt-1 text-sm text-gray-600">
              Add services to your booking and submit for approval
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Add Services */}
            <div className="lg:col-span-2 space-y-6">
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
                      onChange={(e) => setRequesterPhone(e.target.value)}
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
                  {/* Service Selection */}
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
                    {selectedService?.preparation_notes && (
                      <p className="mt-1 text-sm text-blue-600">
                        <strong>Preparation:</strong> {selectedService.preparation_notes}
                      </p>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
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

                  {/* Location */}
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
                        {selectedService?.is_temple_only && (
                          <span className="ml-1 text-xs text-gray-500">(Not available)</span>
                        )}
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

                  {/* Purohit Selection */}
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

                  {/* Notes for this service */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for this service (optional)
                    </label>
                    <textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      placeholder="Any special requirements or requests..."
                    />
                  </div>

                  {/* Price Preview */}
                  {selectedService && (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm font-medium text-blue-900">
                        Price: ${getServicePrice(selectedService, locationType).toFixed(2)}
                      </p>
                      {selectedService.duration_minutes && (
                        <p className="text-xs text-blue-700 mt-1">
                          Duration: {selectedService.duration_minutes} minutes
                        </p>
                      )}
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
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-1">Note: {item.notes}</p>
                              )}
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

                    {/* Additional Notes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes (optional)
                      </label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933] text-sm"
                        placeholder="Any general notes for this booking..."
                      />
                    </div>

                    <button
                      onClick={handleSubmitBooking}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                    >
                      {submitting ? 'Submitting...' : 'Submit Booking for Approval'}
                    </button>

                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Your booking will be reviewed by our staff before payment is required.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
