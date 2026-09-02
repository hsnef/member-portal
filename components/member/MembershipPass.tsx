'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Member, FamilyMember } from '@/types/database'

interface MembershipPassProps {
  member: Member
  familyMembers?: FamilyMember[]
  qrToken: string
}

export function MembershipPass({ member, familyMembers = [], qrToken }: MembershipPassProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal')
  const [showAddToHome, setShowAddToHome] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // Auto-detect mobile, iOS, and standalone mode
  useEffect(() => {
    const isMobile = window.innerWidth < 640
    if (isMobile) {
      setViewMode('vertical')
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detect if running as standalone app
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
  }, [])

  useEffect(() => {
    // Generate QR code as data URL
    const generateQR = async () => {
      try {
        // The QR code will encode the verification URL with the signed token
        const verifyUrl = `${window.location.origin}/verify-qr?token=${qrToken}`
        const dataURL = await QRCode.toDataURL(verifyUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeDataURL(dataURL)
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    }

    generateQR()
  }, [qrToken])

  // Determine membership color
  const getMembershipColor = () => {
    switch (member.current_level) {
      case 'Lifetime':
        return 'bg-gradient-to-r from-amber-500 to-orange-500'
      case 'Annual':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500'
      case 'Community':
        return 'bg-gradient-to-r from-green-500 to-emerald-500'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  // Calculate expiration
  const getExpirationDate = () => {
    if (member.current_level === 'Lifetime') {
      return 'No Expiry'
    }
    const currentYear = new Date().getFullYear()
    return `Dec 31, ${currentYear}`
  }

  const displayName = member.member_class === 'Personal'
    ? `${member.first_name} ${member.last_name}`
    : member.business_name

  // Get family members to display (spouse + up to 3 others)
  const getFamilyDisplay = () => {
    const names: string[] = []

    // Add spouse/partner first if exists
    if (member.secondary_first_name) {
      names.push(`${member.secondary_first_name} ${member.secondary_last_name || ''}`.trim())
    }

    // Add up to 3 family members
    const additionalMembers = familyMembers.slice(0, 3)
    additionalMembers.forEach(fm => {
      names.push(`${fm.first_name} ${fm.last_name || ''}`.trim())
    })

    const remaining = familyMembers.length - 3
    return { names, remaining: remaining > 0 ? remaining : 0 }
  }

  const familyDisplay = getFamilyDisplay()

  // Vertical (phone-friendly) view
  if (viewMode === 'vertical') {
    return (
      <div className="w-full max-w-sm mx-auto">
        {/* View Toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setViewMode('horizontal')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Card View
          </button>
        </div>

        {/* Vertical Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className={`${getMembershipColor()} px-4 py-3 text-white text-center`}>
            <p className="text-[10px] font-medium opacity-90">HSNEF MEMBERSHIP</p>
            <p className="text-xl font-bold">{member.current_level.toUpperCase()}</p>
          </div>

          {/* QR Code - Prominent */}
          <div className="flex flex-col items-center py-4 bg-gray-50">
            {qrCodeDataURL ? (
              <img
                src={qrCodeDataURL}
                alt="Membership QR Code"
                className="w-40 h-40 border-2 border-gray-200 rounded-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-saffron border-r-transparent"></div>
              </div>
            )}
            <p className="mt-2 text-[10px] text-gray-500">Scan for check-in</p>
          </div>

          {/* Member Info */}
          <div className="p-4 space-y-3">
            {/* Name */}
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{displayName}</p>
              <p className="text-base font-mono font-bold text-saffron">{member.membership_id}</p>
            </div>

            {/* Family Members */}
            {member.member_class === 'Personal' && familyDisplay.names.length > 0 && (
              <div className="text-center border-t pt-3">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Family</p>
                <p className="text-xs text-gray-700">
                  {familyDisplay.names.join(' • ')}
                  {familyDisplay.remaining > 0 && (
                    <span className="text-gray-400"> +{familyDisplay.remaining}</span>
                  )}
                </p>
              </div>
            )}

            {/* Valid Until */}
            <div className="flex justify-between text-xs border-t pt-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Valid Until</p>
                <p className="font-semibold text-gray-900">{getExpirationDate()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase">Type</p>
                <p className="font-semibold text-gray-900">{member.member_class}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t text-center">
            <p className="text-[10px] text-gray-600">Hindu Society of North East Florida</p>
            {member.is_founding_member && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-semibold">
                FOUNDING MEMBER
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {!isStandalone && (
            <button
              onClick={() => setShowAddToHome(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Home
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Print
          </button>
          <button
            onClick={() => {
              if (qrCodeDataURL) {
                const link = document.createElement('a')
                link.download = `hsnef-membership-${member.membership_id}.png`
                link.href = qrCodeDataURL
                link.click()
              }
            }}
            className="px-3 py-1.5 text-xs font-medium text-white bg-saffron hover:bg-saffron-hover rounded"
          >
            Download QR
          </button>
        </div>

        {/* Add to Home Screen Modal */}
        {showAddToHome && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 animate-slide-up">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
                <button
                  onClick={() => setShowAddToHome(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <p>Tap the <strong>Share</strong> button <span className="inline-block w-5 h-5 align-middle">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                        <path d="M12 2l3.5 3.5-1.4 1.4L12 4.8 9.9 6.9 8.5 5.5 12 2zm0 6c-1.1 0-2 .9-2 2v8h4v-8c0-1.1-.9-2-2-2z"/>
                        <path d="M4 10h4v12H4zM16 10h4v12h-4z"/>
                      </svg>
                    </span> at the bottom of Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <p>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <p>Tap <strong>&quot;Add&quot;</strong> in the top right</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <p>Tap the <strong>menu</strong> button (three dots) in your browser</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <p>Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <p>Confirm by tapping <strong>&quot;Add&quot;</strong></p>
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Your membership pass will be available instantly from your home screen
                </p>
              </div>

              <button
                onClick={() => setShowAddToHome(false)}
                className="mt-4 w-full py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-saffron-hover"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body * { visibility: hidden; }
            .membership-pass-container, .membership-pass-container * { visibility: visible; }
            .membership-pass-container { position: absolute; left: 0; top: 0; width: 100%; }
          }
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Horizontal (card) view - default for desktop
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* View Toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setViewMode('vertical')}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Phone View
        </button>
      </div>

      {/* Horizontal Card */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {/* Header Bar */}
        <div className={`${getMembershipColor()} px-4 py-2 text-white`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] font-medium opacity-90">HSNEF MEMBERSHIP</p>
              <p className="text-lg font-bold">{member.current_level.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-90">Type</p>
              <p className="text-xs font-semibold">{member.member_class}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left: Member Info */}
            <div className="md:col-span-2 space-y-2">
              {/* Member Name */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Member Name</p>
                <p className="text-lg font-bold text-gray-900">{displayName}</p>
              </div>

              {/* ID and Valid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Membership ID</p>
                  <p className="text-base font-mono font-bold text-saffron">{member.membership_id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Valid Until</p>
                  <p className="text-sm font-semibold text-gray-900">{getExpirationDate()}</p>
                </div>
              </div>

              {/* Family Members - Combined display */}
              {member.member_class === 'Personal' && familyDisplay.names.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Family Members</p>
                  <p className="text-xs text-gray-700">
                    {familyDisplay.names.join(' • ')}
                    {familyDisplay.remaining > 0 && (
                      <span className="text-gray-400"> +{familyDisplay.remaining} more</span>
                    )}
                  </p>
                </div>
              )}

              {/* Member Since */}
              {member.member_since && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Member Since</p>
                  <p className="text-xs font-medium text-gray-700">
                    {new Date(member.member_since).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center border-l border-dashed border-gray-300 md:pl-4">
              {qrCodeDataURL ? (
                <>
                  <img
                    src={qrCodeDataURL}
                    alt="Membership QR Code"
                    className="w-28 h-28 border-2 border-gray-200 rounded-lg"
                  />
                  <p className="mt-1 text-[10px] text-center text-gray-500">
                    Scan for check-in
                  </p>
                </>
              ) : (
                <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-saffron border-r-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-[10px] text-gray-600">
            <div className="flex items-center gap-3">
              <span>Hindu Society of North East Florida</span>
              {member.is_founding_member && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-semibold">
                  FOUNDING
                </span>
              )}
            </div>
            <span className="font-mono">{member.membership_id}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {!isStandalone && (
          <button
            onClick={() => setShowAddToHome(true)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Home
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          Print
        </button>
        <button
          onClick={() => {
            if (qrCodeDataURL) {
              const link = document.createElement('a')
              link.download = `hsnef-membership-${member.membership_id}.png`
              link.href = qrCodeDataURL
              link.click()
            }
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-saffron hover:bg-saffron-hover rounded"
        >
          Download QR
        </button>
      </div>

      {/* Add to Home Screen Modal */}
      {showAddToHome && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowAddToHome(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p>Tap the <strong>Share</strong> button at the bottom of Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p>Tap <strong>&quot;Add&quot;</strong> in the top right</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <p>Tap the <strong>menu</strong> button (three dots) in your browser</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p>Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <p>Confirm by tapping <strong>&quot;Add&quot;</strong></p>
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Your membership pass will be available instantly from your home screen
              </p>
            </div>

            <button
              onClick={() => setShowAddToHome(false)}
              className="mt-4 w-full py-2.5 bg-saffron text-white rounded-lg font-medium hover:bg-saffron-hover"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * { visibility: hidden; }
          .membership-pass-container, .membership-pass-container * { visibility: visible; }
          .membership-pass-container { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
