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
    // For Annual members, show Dec 31 of the current year
    // TODO: This should be based on the actual membership record end date
    const currentYear = new Date().getFullYear()
    return `Dec 31, ${currentYear}`
  }

  const displayName = member.member_class === 'Personal'
    ? `${member.first_name} ${member.last_name}`
    : member.business_name

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Boarding Pass Style Card */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-gray-200">
        {/* Header Bar with Membership Level */}
        <div className={`${getMembershipColor()} px-6 py-3 text-white`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-medium opacity-90">HSNEF MEMBERSHIP</p>
              <p className="text-2xl font-bold">{member.current_level.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90">Type</p>
              <p className="text-sm font-semibold">{member.member_class}</p>
            </div>
          </div>
        </div>

        {/* Main Pass Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Member Info */}
            <div className="md:col-span-2 space-y-4">
              {/* Member Name */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Name</p>
                <p className="text-2xl font-bold text-gray-900">{displayName}</p>
              </div>

              {/* MembershipID and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Membership ID</p>
                  <p className="text-xl font-mono font-bold text-[#FF9933]">{member.membership_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valid Until</p>
                  <p className="text-lg font-semibold text-gray-900">{getExpirationDate()}</p>
                </div>
              </div>

              {/* Family Members (for Personal only) */}
              {member.member_class === 'Personal' && familyMembers.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Family Members</p>
                  <div className="space-y-1">
                    {familyMembers.slice(0, 4).map((family) => (
                      <div key={family.id} className="flex items-center text-sm text-gray-700">
                        <span className="w-2 h-2 bg-[#FF9933] rounded-full mr-2"></span>
                        {family.first_name} {family.last_name}
                        {family.relationship && (
                          <span className="ml-2 text-xs text-gray-500">({family.relationship})</span>
                        )}
                      </div>
                    ))}
                    {familyMembers.length > 4 && (
                      <p className="text-xs text-gray-500 italic">
                        +{familyMembers.length - 4} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary Contact (for Personal) */}
              {member.member_class === 'Personal' && member.secondary_first_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spouse/Partner</p>
                  <p className="text-sm font-medium text-gray-700">
                    {member.secondary_first_name} {member.secondary_last_name}
                  </p>
                </div>
              )}

              {/* Member Since */}
              {member.member_since && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(member.member_since).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center border-l-2 border-dashed border-gray-300 md:pl-6">
              {qrCodeDataURL ? (
                <>
                  <img
                    src={qrCodeDataURL}
                    alt="Membership QR Code"
                    className="w-48 h-48 border-4 border-gray-200 rounded-lg"
                  />
                  <p className="mt-3 text-xs text-center text-gray-500 max-w-[200px]">
                    Show this QR code at the temple for quick check-in
                  </p>
                </>
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>🕉️ Hindu Society of North East Florida</span>
              {member.is_founding_member && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-semibold">
                  FOUNDING MEMBER
                </span>
              )}
            </div>
            <span className="font-mono">{member.membership_id}</span>
          </div>
        </div>
      </div>

      {/* Download/Print Options */}
      <div className="mt-4 flex justify-center space-x-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          🖨️ Print Pass
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
          className="px-4 py-2 text-sm font-medium text-white bg-[#FF9933] hover:bg-[#E68A2E] rounded-md"
        >
          💾 Download QR Code
        </button>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .membership-pass-container,
          .membership-pass-container * {
            visibility: visible;
          }
          .membership-pass-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
