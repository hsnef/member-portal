'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createClient } from '@/lib/supabase/client'
import { verifyQRToken } from '@/lib/qr-token'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import type { Member, FamilyMember } from '@/types/database'

function ScanQRContent() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  const [scanning, setScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [verifying, setVerifying] = useState(false)
  const [member, setMember] = useState<Member | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [error, setError] = useState<string | null>(null)

  const [manualInput, setManualInput] = useState('')
  const [manualSearchType, setManualSearchType] = useState<'id' | 'name' | 'email' | 'phone'>('id')

  const supabase = createClient()

  // Start camera scanning
  const startScanning = async () => {
    try {
      setCameraError(null)
      setError(null)

      if (!videoRef.current) return

      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      const videoInputDevices = await codeReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        setCameraError('No camera found. Please use manual lookup.')
        return
      }

      // Prefer back camera on mobile
      const selectedDevice = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0]

      setScanning(true)

      codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        async (result, err) => {
          if (result) {
            const text = result.getText()
            // Extract token from URL (format: .../verify-qr?token=xxx)
            const tokenMatch = text.match(/token=([^&]+)/)
            if (tokenMatch) {
              await verifyMember(tokenMatch[1])
              stopScanning()
            }
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('Scan error:', err)
          }
        }
      )
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Unable to access camera. Please check permissions or use manual lookup.')
      setScanning(false)
    }
  }

  // Stop camera scanning
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    setScanning(false)
  }

  // Verify member from QR token
  const verifyMember = async (token: string) => {
    setVerifying(true)
    setError(null)
    setMember(null)

    try {
      // Verify the JWT token
      const payload = verifyQRToken(token)

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', payload.memberId)
        .single()

      if (memberError) throw memberError
      setMember(memberData)

      // Fetch family members if Personal
      if (memberData.member_class === 'Personal') {
        const { data: familyData } = await supabase
          .from('family_members')
          .select('*')
          .eq('member_id', memberData.id)
          .order('created_at', { ascending: false })

        setFamilyMembers(familyData || [])
      }
    } catch (err) {
      console.error('Error verifying QR:', err)
      setError(err instanceof Error ? err.message : 'Failed to verify member')
    } finally {
      setVerifying(false)
    }
  }

  // Manual lookup
  const handleManualSearch = async () => {
    if (!manualInput.trim()) return

    setVerifying(true)
    setError(null)
    setMember(null)

    try {
      let query = supabase.from('members').select('*')

      switch (manualSearchType) {
        case 'id':
          query = query.eq('membership_id', manualInput.trim())
          break
        case 'email':
          query = query.eq('primary_email', manualInput.trim())
          break
        case 'phone':
          query = query.eq('primary_phone', manualInput.trim())
          break
        case 'name':
          // Search in both first_name/last_name and business_name
          query = query.or(`first_name.ilike.%${manualInput.trim()}%,last_name.ilike.%${manualInput.trim()}%,business_name.ilike.%${manualInput.trim()}%`)
          break
      }

      const { data: memberData, error: memberError } = await query.single()

      if (memberError) {
        if (memberError.code === 'PGRST116') {
          throw new Error('No member found with that information')
        }
        throw memberError
      }

      setMember(memberData)

      // Fetch family members if Personal
      if (memberData.member_class === 'Personal') {
        const { data: familyData } = await supabase
          .from('family_members')
          .select('*')
          .eq('member_id', memberData.id)
          .order('created_at', { ascending: false })

        setFamilyMembers(familyData || [])
      }
    } catch (err) {
      console.error('Error searching member:', err)
      setError(err instanceof Error ? err.message : 'Failed to find member')
    } finally {
      setVerifying(false)
    }
  }

  // Reset to scan again
  const resetScan = () => {
    setMember(null)
    setFamilyMembers([])
    setError(null)
    setManualInput('')
    if (scanMode === 'camera') {
      startScanning()
    }
  }

  // Record check-in
  const recordCheckIn = async () => {
    if (!member) return

    try {
      const { error } = await supabase
        .from('activity_log')
        .insert({
          member_id: member.id,
          activity_type: 'Temple Visit',
          activity_date: new Date().toISOString(),
          notes: 'QR code check-in'
        })

      if (error) throw error

      alert('Check-in recorded successfully!')
      resetScan()
    } catch (err) {
      console.error('Check-in error:', err)
      alert('Failed to record check-in')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  // Auto-start camera on mount if camera mode
  useEffect(() => {
    if (scanMode === 'camera') {
      startScanning()
    }
    return () => {
      stopScanning()
    }
  }, [scanMode])

  const getMembershipColor = () => {
    if (!member) return 'bg-gray-500'
    switch (member.current_level) {
      case 'Lifetime': return 'bg-amber-500'
      case 'Annual': return 'bg-blue-500'
      case 'Community': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const displayName = member?.member_class === 'Personal'
    ? `${member.first_name} ${member.last_name}`
    : member?.business_name

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scan Membership QR Code</h1>
              <p className="mt-1 text-sm text-gray-600">
                Verify members and record check-ins
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scan Mode Toggle */}
        {!member && (
          <div className="mb-6 flex justify-center space-x-4">
            <button
              onClick={() => setScanMode('camera')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                scanMode === 'camera'
                  ? 'bg-[#FF9933] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              📷 Camera Scan
            </button>
            <button
              onClick={() => setScanMode('manual')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                scanMode === 'manual'
                  ? 'bg-[#FF9933] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🔍 Manual Lookup
            </button>
          </div>
        )}

        {/* Camera Scanning Mode */}
        {scanMode === 'camera' && !member && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Point Camera at QR Code</h2>
              <p className="text-sm text-gray-600">
                Position the QR code within the camera frame
              </p>
            </div>

            {cameraError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-800 font-medium mb-4">{cameraError}</p>
                <button
                  onClick={() => setScanMode('manual')}
                  className="px-6 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#E68A2E]"
                >
                  Switch to Manual Lookup
                </button>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg border-4 border-gray-300"
                  style={{ maxHeight: '400px' }}
                />
                {scanning && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-[#FF9933] rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF9933]"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF9933]"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF9933]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF9933]"></div>
                  </div>
                )}
              </div>
            )}

            {verifying && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Verifying member...</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Lookup Mode */}
        {scanMode === 'manual' && !member && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Manual Member Lookup</h2>

            <div className="space-y-4">
              {/* Search Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search By
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'id', label: 'Membership ID' },
                    { value: 'name', label: 'Name' },
                    { value: 'email', label: 'Email' },
                    { value: 'phone', label: 'Phone' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setManualSearchType(type.value as any)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        manualSearchType === type.value
                          ? 'bg-[#FF9933] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {manualSearchType === 'id' && 'Enter Membership ID'}
                  {manualSearchType === 'name' && 'Enter Name'}
                  {manualSearchType === 'email' && 'Enter Email Address'}
                  {manualSearchType === 'phone' && 'Enter Phone Number'}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    placeholder={
                      manualSearchType === 'id' ? '10000001' :
                      manualSearchType === 'name' ? 'John Doe' :
                      manualSearchType === 'email' ? 'member@example.com' :
                      '555-1234'
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#FF9933] focus:border-transparent"
                  />
                  <button
                    onClick={handleManualSearch}
                    disabled={!manualInput.trim() || verifying}
                    className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    {verifying ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {verifying && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Searching for member...</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && !member && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-5xl mb-3">❌</div>
              <h3 className="text-lg font-bold text-red-800 mb-2">Verification Failed</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={resetScan}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Member Verified Display */}
        {member && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Success Header */}
            <div className={`${getMembershipColor()} px-6 py-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl mb-2">✅</div>
                  <h2 className="text-2xl font-bold">Member Verified</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">Membership Type</p>
                  <p className="text-3xl font-bold">{member.current_level.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Member Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Member Name</p>
                  <p className="text-2xl font-bold text-gray-900">{displayName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Membership ID</p>
                  <p className="text-2xl font-mono font-bold text-[#FF9933]">{member.membership_id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Type</p>
                  <p className="text-lg font-semibold text-gray-900">{member.member_class}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Status</p>
                  <p className="text-lg font-semibold text-green-600">
                    {member.current_level === 'Lifetime' ? 'Active (No Expiry)' : 'Active'}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-900">{member.primary_email}</p>
                  </div>
                  {member.primary_phone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="text-gray-900">{member.primary_phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Family Members */}
              {member.member_class === 'Personal' && familyMembers.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Members</h3>
                  <div className="space-y-2">
                    {familyMembers.map((family) => (
                      <div key={family.id} className="flex items-center py-2 border-b border-gray-100 last:border-0">
                        <div className="w-3 h-3 bg-[#FF9933] rounded-full mr-3"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {family.first_name} {family.last_name}
                          </p>
                          {family.relationship && (
                            <p className="text-sm text-gray-500">{family.relationship}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Founding Member Badge */}
              {member.is_founding_member && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg">
                    <span className="text-2xl mr-2">⭐</span>
                    <span className="font-bold">FOUNDING MEMBER</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={recordCheckIn}
                  className="px-4 py-3 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  ✓ Record Check-In
                </button>
                <button
                  onClick={() => router.push(`/admin/members/${member.id}`)}
                  className="px-4 py-3 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  👤 View Full Profile
                </button>
                <button
                  onClick={() => alert('Payment recording coming soon')}
                  className="px-4 py-3 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  💳 Record Payment
                </button>
                <button
                  onClick={() => alert('Service booking coming soon')}
                  className="px-4 py-3 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
                >
                  📅 Book Service
                </button>
              </div>
            </div>

            {/* Scan Next Button */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 text-center">
              <button
                onClick={resetScan}
                className="px-8 py-3 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-semibold rounded-lg text-lg"
              >
                Scan Next Member →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ScanQRPage() {
  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <ScanQRContent />
    </ProtectedRoute>
  )
}
