'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useState, useRef, useEffect } from 'react'
import type { Member } from '@/types/database'

export function MembershipSwitcher() {
  const { member, members, setActiveMember } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if only one membership or no memberships
  if (!members || members.length <= 1) {
    return null
  }

  const handleSwitch = (memberId: string) => {
    if (memberId !== member?.id) {
      setActiveMember(memberId)
      setIsOpen(false)
      // Reload page to refresh all data for new membership
      window.location.reload()
    } else {
      setIsOpen(false)
    }
  }

  const getDisplayName = (m: Member) => {
    if (m.member_class === 'Business') {
      return m.business_name || m.membership_id
    }
    return `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.membership_id
  }

  const getMembershipBadge = (m: Member) => {
    return `${m.member_class} - ${m.current_level}`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors"
        title="Switch membership"
      >
        <span className="font-medium text-gray-700">{member?.membership_id}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Switch Membership</p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSwitch(m.id)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                  m.id === member?.id ? 'bg-orange-50' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName(m)}</p>
                  <p className="text-xs text-gray-500">{getMembershipBadge(m)}</p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <p className="text-xs font-mono text-gray-600">{m.membership_id}</p>
                  {m.id === member?.id && (
                    <span className="text-xs text-[#FF9933] font-medium">Active</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
