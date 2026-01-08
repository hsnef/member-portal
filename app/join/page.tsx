'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type MemberClass = 'Personal' | 'Business'
type MembershipLevel = 'Community' | 'Annual' | 'Lifetime'

export default function JoinPage() {
  const supabase = createClient()

  // Form state
  const [memberClass, setMemberClass] = useState<MemberClass>('Personal')
  const [requestedLevel, setRequestedLevel] = useState<MembershipLevel>('Annual')

  // Personal fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nakshatra, setNakshatra] = useState('')
  const [familyGotra, setFamilyGotra] = useState('')

  // Spouse fields
  const [includeSpouse, setIncludeSpouse] = useState(false)
  const [secondaryFirstName, setSecondaryFirstName] = useState('')
  const [secondaryLastName, setSecondaryLastName] = useState('')
  const [secondaryDateOfBirth, setSecondaryDateOfBirth] = useState('')
  const [secondaryNakshatra, setSecondaryNakshatra] = useState('')

  // Business fields
  const [businessName, setBusinessName] = useState('')
  const [businessEin, setBusinessEin] = useState('')
  const [businessType, setBusinessType] = useState('')

  // Contact fields
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [primaryPhone, setPrimaryPhone] = useState('')
  const [secondaryEmail, setSecondaryEmail] = useState('')
  const [secondaryPhone, setSecondaryPhone] = useState('')

  // Address fields
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('FL')
  const [zip, setZip] = useState('')

  // Additional fields
  const [howDidYouHear, setHowDidYouHear] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validation
    if (memberClass === 'Personal' && (!firstName || !lastName)) {
      setMessage({ type: 'error', text: 'First and last name are required' })
      return
    }

    if (memberClass === 'Business' && !businessName) {
      setMessage({ type: 'error', text: 'Business name is required' })
      return
    }

    if (!primaryEmail) {
      setMessage({ type: 'error', text: 'Email address is required' })
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.from('pending_member_registrations').insert({
        member_class: memberClass,
        requested_level: requestedLevel,

        // Personal
        first_name: memberClass === 'Personal' ? firstName : null,
        last_name: memberClass === 'Personal' ? lastName : null,
        date_of_birth: dateOfBirth || null,
        nakshatra: nakshatra || null,
        family_gotra: familyGotra || null,

        // Spouse
        secondary_first_name: includeSpouse ? secondaryFirstName : null,
        secondary_last_name: includeSpouse ? secondaryLastName : null,
        secondary_date_of_birth: includeSpouse ? secondaryDateOfBirth : null,
        secondary_nakshatra: includeSpouse ? secondaryNakshatra : null,

        // Business
        business_name: memberClass === 'Business' ? businessName : null,
        business_ein: memberClass === 'Business' ? businessEin : null,
        business_type: memberClass === 'Business' ? businessType : null,

        // Contact
        primary_email: primaryEmail,
        primary_phone: primaryPhone || null,
        secondary_email: secondaryEmail || null,
        secondary_phone: secondaryPhone || null,

        // Address
        address_line_1: addressLine1 || null,
        address_line_2: addressLine2 || null,
        city: city || null,
        state: state || null,
        zip: zip || null,

        // Additional
        how_did_you_hear: howDidYouHear || null,
        notes: notes || null,
      })

      if (error) {
        console.error('Submission error:', error)
        setMessage({ type: 'error', text: error.message })
        return
      }

      setMessage({
        type: 'success',
        text: 'Application submitted successfully! Our team will review your application and contact you within 2-3 business days.',
      })

      // Reset form
      setFirstName('')
      setLastName('')
      setBusinessName('')
      setPrimaryEmail('')
      setPrimaryPhone('')
      setAddressLine1('')
      setCity('')
      setZip('')
      setNotes('')
    } catch (error) {
      console.error('Submit exception:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  const membershipInfo = {
    Community: {
      price: 'Free',
      benefits: ['Access to temple events', 'Community newsletter', 'Event notifications'],
    },
    Annual: {
      price: '$101/year',
      benefits: [
        'All Community benefits',
        'Member-only events',
        'Discounted service rates',
        'Priority booking',
      ],
    },
    Lifetime: {
      price: '$1,008 (one-time)',
      benefits: [
        'All Annual benefits',
        'Lifetime membership card',
        'No annual renewal',
        'Special recognition',
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-[#FF9933] to-[#800000] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Join HSNEF</h1>
                <p className="text-sm text-gray-600">Become a member today</p>
              </div>
            </div>
            <Link
              href="/login"
              className="text-sm text-[#FF9933] hover:text-[#FF8800] font-medium"
            >
              Already a member? Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Membership Levels Info */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(membershipInfo).map(([level, info]) => (
            <div
              key={level}
              className={`bg-white rounded-lg p-6 shadow-md border-2 ${
                requestedLevel === level ? 'border-[#FF9933]' : 'border-transparent'
              }`}
            >
              <h3 className="text-lg font-semibold text-gray-900">{level} Membership</h3>
              <p className="text-2xl font-bold text-[#FF9933] mt-2">{info.price}</p>
              <ul className="mt-4 space-y-2">
                {info.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Membership Application</h2>

          {message && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Membership Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type
                </label>
                <select
                  value={memberClass}
                  onChange={(e) => setMemberClass(e.target.value as MemberClass)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                  disabled={loading}
                >
                  <option value="Personal">Personal / Family</option>
                  <option value="Business">Business / Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Level
                </label>
                <select
                  value={requestedLevel}
                  onChange={(e) => setRequestedLevel(e.target.value as MembershipLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                  disabled={loading}
                >
                  <option value="Community">Community (Free)</option>
                  <option value="Annual">Annual ($101/year)</option>
                  <option value="Lifetime">Lifetime ($1,008 one-time)</option>
                </select>
              </div>
            </div>

            {/* Personal Information */}
            {memberClass === 'Personal' && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nakshatra (Birth Star)
                      </label>
                      <input
                        type="text"
                        value={nakshatra}
                        onChange={(e) => setNakshatra(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                        disabled={loading}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family Gotra
                      </label>
                      <input
                        type="text"
                        value={familyGotra}
                        onChange={(e) => setFamilyGotra(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Spouse Information */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Spouse / Partner Information
                    </h3>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeSpouse}
                        onChange={(e) => setIncludeSpouse(e.target.checked)}
                        className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933] border-gray-300 rounded"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-700">Include spouse details</span>
                    </label>
                  </div>

                  {includeSpouse && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={secondaryFirstName}
                          onChange={(e) => setSecondaryFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={secondaryLastName}
                          onChange={(e) => setSecondaryLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={secondaryDateOfBirth}
                          onChange={(e) => setSecondaryDateOfBirth(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nakshatra
                        </label>
                        <input
                          type="text"
                          value={secondaryNakshatra}
                          onChange={(e) => setSecondaryNakshatra(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Business Information */}
            {memberClass === 'Business' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EIN (Tax ID)
                    </label>
                    <input
                      type="text"
                      value={businessEin}
                      onChange={(e) => setBusinessEin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      disabled={loading}
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <input
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      disabled={loading}
                      placeholder="e.g., Restaurant, Retail, Services"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apartment, Suite, etc. (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      disabled={loading}
                      placeholder="FL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                      disabled={loading}
                      placeholder="32092"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How did you hear about HSNEF?
                  </label>
                  <select
                    value={howDidYouHear}
                    onChange={(e) => setHowDidYouHear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                  >
                    <option value="">Select an option</option>
                    <option value="Friend/Family">Friend or Family</option>
                    <option value="Temple Visit">Temple Visit</option>
                    <option value="Event">Event or Celebration</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes or Questions
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                    disabled={loading}
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF9933] to-[#800000] hover:from-[#FF8800] hover:to-[#700000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF9933] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Submitting Application...</span>
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
              <p className="mt-4 text-center text-xs text-gray-500">
                By submitting this application, you agree to our terms of service and privacy
                policy. A member of our team will review your application and contact you within
                2-3 business days.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Questions?{' '}
            <a
              href="mailto:info@hsnef.org"
              className="text-[#FF9933] hover:text-[#FF8800] font-medium"
            >
              Contact us at info@hsnef.org
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
