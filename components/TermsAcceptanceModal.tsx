'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getActiveTerms,
  hasAcceptedCurrentTerms,
  recordTermsAcceptance,
  recordTermsBypass,
  type TermsContent,
} from '@/lib/utils/termsService'
import ReactMarkdown from 'react-markdown'

interface TermsAcceptanceModalProps {
  onAccepted?: () => void
}

const MAX_RETRY_ATTEMPTS = 3

export default function TermsAcceptanceModal({ onAccepted }: TermsAcceptanceModalProps) {
  const supabase = createClient()

  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [terms, setTerms] = useState<TermsContent | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showEscapeHatch, setShowEscapeHatch] = useState(false)
  const [bypassing, setBypassing] = useState(false)

  useEffect(() => {
    checkTermsAcceptance()
  }, [])

  async function checkTermsAcceptance() {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log('No user found, skipping terms check')
        setLoading(false)
        return
      }

      // Get member record to find member_id
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (memberError) {
        console.error('Error fetching member:', memberError)
      }

      if (memberData) {
        setMemberId(memberData.id)
      }

      // Check if user has accepted current terms
      const hasAccepted = await hasAcceptedCurrentTerms(user.id, memberData?.id)

      if (!hasAccepted) {
        // Load active terms
        const activeTerms = await getActiveTerms()
        if (activeTerms) {
          setTerms(activeTerms)
          setShowModal(true)
        }
      }
    } catch (error) {
      console.error('Error checking terms acceptance:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!termsAccepted || !terms) {
      setError('Please check the box to accept the terms')
      return
    }

    try {
      setAccepting(true)
      setError(null)

      const success = await recordTermsAcceptance({
        termsVersion: terms.version,
        termsContentId: terms.id,
        memberId: memberId || undefined,
        acceptanceMethod: 'first_login',
      })

      if (success) {
        setShowModal(false)
        if (onAccepted) {
          onAccepted()
        }
      } else {
        // Increment retry counter
        const newRetryCount = retryCount + 1
        setRetryCount(newRetryCount)

        // Show escape hatch after MAX_RETRY_ATTEMPTS
        if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
          setShowEscapeHatch(true)
          setError(
            `We're experiencing technical difficulties. After ${MAX_RETRY_ATTEMPTS} failed attempts, you can continue anyway or contact support.`
          )
        } else {
          setError(
            `Failed to record acceptance. Please try again. (Attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS})`
          )
        }
      }
    } catch (error) {
      console.error('Error accepting terms:', error)
      const newRetryCount = retryCount + 1
      setRetryCount(newRetryCount)

      if (newRetryCount >= MAX_RETRY_ATTEMPTS) {
        setShowEscapeHatch(true)
        setError(
          `We're experiencing technical difficulties. After ${MAX_RETRY_ATTEMPTS} failed attempts, you can continue anyway or contact support.`
        )
      } else {
        setError(
          `An error occurred. Please try again. (Attempt ${newRetryCount}/${MAX_RETRY_ATTEMPTS})`
        )
      }
    } finally {
      setAccepting(false)
    }
  }

  async function handleBypass() {
    if (!terms) return

    try {
      setBypassing(true)
      setError(null)

      // Record the bypass incident for admin review
      const success = await recordTermsBypass({
        termsVersion: terms.version,
        termsContentId: terms.id,
        memberId: memberId || undefined,
        errorMessage: error || 'Unknown error after multiple attempts',
        retryCount: retryCount,
      })

      if (success) {
        console.warn(
          `User bypassed terms acceptance after ${retryCount} failed attempts. Will be re-prompted on next login.`
        )
      }

      // Allow user to continue (bypass will be logged and re-prompted later)
      setShowModal(false)
      if (onAccepted) {
        onAccepted()
      }
    } catch (error) {
      console.error('Error recording bypass:', error)
      // Even if bypass recording fails, let user through
      // (avoids double-blocking scenario)
      setShowModal(false)
      if (onAccepted) {
        onAccepted()
      }
    } finally {
      setBypassing(false)
    }
  }

  // Don't render anything if not showing modal
  if (!showModal || !terms) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - cannot click to dismiss */}
      <div className="fixed inset-0 bg-black/50" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl">
          {/* Header */}
          <div className="bg-kumkum text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">{terms.title}</h2>
            <p className="mt-1 text-white/90 text-sm">
              Please review and accept to continue
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed text-sm">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-700 text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-orange-600">
                      {children}
                    </code>
                  ),
                }}
              >
                {terms.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer with Checkbox and Accept Button */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
                {showEscapeHatch && (
                  <p className="text-xs text-red-600 mt-2">
                    Need help? Contact us at{' '}
                    <a
                      href="mailto:info@hsnef.org"
                      className="underline font-medium hover:text-red-700"
                    >
                      info@hsnef.org
                    </a>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-start mb-4">
              <div className="flex items-center h-5">
                <input
                  id="terms-modal-checkbox"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={accepting || bypassing}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="terms-modal-checkbox" className="text-sm font-medium text-gray-900">
                  I have read and agree to the HSNEF Membership Portal Terms of Use.
                  <span className="text-red-600 ml-1">*</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Version {terms.version} | Effective: {new Date(terms.effective_date).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                {showEscapeHatch && (
                  <button
                    onClick={handleBypass}
                    disabled={bypassing || accepting}
                    className="px-4 py-3 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm"
                  >
                    {bypassing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Bypassing...
                      </span>
                    ) : (
                      'Continue Anyway'
                    )}
                  </button>
                )}
                <button
                  onClick={handleAccept}
                  disabled={!termsAccepted || accepting || bypassing}
                  className="px-6 py-3 bg-kumkum text-white rounded-md font-semibold hover:from-[#FF8800] hover:to-[#700000] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {accepting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Accepting...
                    </span>
                  ) : (
                    'Accept and Continue'
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-600 text-center">
              {showEscapeHatch
                ? 'You will be reminded to accept the terms on your next login'
                : 'You must accept the terms to access the member portal'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
