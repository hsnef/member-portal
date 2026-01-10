'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { isTraditionalLoginEnabled } from '@/lib/utils/portalSettings'
import {
  getActiveTerms,
  recordTermsAcceptance,
  type TermsContent,
} from '@/lib/utils/termsService'
import TermsCheckbox from '@/components/TermsCheckbox'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [traditionalLoginEnabled, setTraditionalLoginEnabled] = useState<boolean | null>(null)
  const [activeTerms, setActiveTerms] = useState<TermsContent | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if traditional login is enabled and load terms
  useEffect(() => {
    async function checkSetting() {
      const enabled = await isTraditionalLoginEnabled()
      setTraditionalLoginEnabled(enabled)
      if (!enabled) {
        setTimeout(() => {
          router.push('/login?message=traditional_disabled')
        }, 3000)
      }
    }
    async function loadTerms() {
      const terms = await getActiveTerms()
      setActiveTerms(terms)
    }
    checkSetting()
    loadTerms()
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validation
    if (!email || !password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (!termsAccepted) {
      setMessage({ type: 'error', text: 'You must accept the Terms of Use to continue' })
      return
    }

    try {
      setLoading(true)

      // Check if member exists with this email
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, membership_id, first_name, last_name, primary_email, is_test_account')
        .eq('primary_email', email)
        .maybeSingle()

      if (memberError) {
        console.error('Error checking member:', memberError)
        setMessage({ type: 'error', text: 'Error checking membership status' })
        setLoading(false)
        return
      }

      if (!memberData) {
        setMessage({
          type: 'error',
          text: 'No member found with this email. Please contact the office to register as a member first.',
        })
        setLoading(false)
        return
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        console.error('Registration error:', authError)
        setMessage({ type: 'error', text: authError.message })
        setLoading(false)
        return
      }

      if (!authData.user) {
        setMessage({ type: 'error', text: 'Failed to create account' })
        setLoading(false)
        return
      }

      // Link auth user to member record
      const { error: updateError } = await supabase
        .from('members')
        .update({ auth_user_id: authData.user.id })
        .eq('id', memberData.id)

      if (updateError) {
        console.error('Error linking account:', updateError)
        setMessage({
          type: 'error',
          text: 'Account created but failed to link to member record. Please contact support.',
        })
        setLoading(false)
        return
      }

      // Record terms acceptance
      if (activeTerms && authData.user) {
        await recordTermsAcceptance({
          termsVersion: activeTerms.version,
          termsContentId: activeTerms.id,
          memberId: memberData.id,
          acceptanceMethod: 'registration',
        })
      }

      // Track successful registration login
      try {
        await fetch('/api/login-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loginMethod: 'registration',
            success: true,
          }),
        })
      } catch (trackingError) {
        // Don't fail the registration if tracking fails
        console.warn('Login tracking error:', trackingError)
      }

      // Send welcome email
      try {
        await fetch('/api/members/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: memberData.id,
          }),
        })
      } catch (welcomeError) {
        // Don't fail the registration if welcome email fails
        console.warn('Welcome email error:', welcomeError)
      }

      // Success!
      setMessage({
        type: 'success',
        text: memberData.is_test_account
          ? 'Test account registered successfully! You can now login.'
          : 'Registration successful! Please check your email to verify your account.',
      })

      // If test account, redirect to login after 2 seconds
      // If real account, they need to verify email first
      if (memberData.is_test_account) {
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error) {
      console.error('Registration exception:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred during registration',
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking setting (also check mounted to avoid hydration mismatch)
  if (!mounted || traditionalLoginEnabled === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if traditional login is disabled
  if (traditionalLoginEnabled === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-[#FF9933] to-[#800000] rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Traditional Registration Disabled</h2>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
            <div className="p-4 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200">
              <p className="text-sm font-medium mb-2">Email/password registration is currently disabled.</p>
              <p className="text-sm">
                Please use one of the following options to access your account:
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-md">
                <h3 className="font-semibold text-gray-900 mb-2">Already a Member?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Use Magic Link or Google Sign-In at the login page
                </p>
                <Link
                  href="/login"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-[#FF9933] to-[#800000] text-white rounded-md hover:from-[#FF8800] hover:to-[#700000] transition-all"
                >
                  Go to Login
                </Link>
              </div>

              <div className="p-4 border border-gray-200 rounded-md">
                <h3 className="font-semibold text-gray-900 mb-2">Not a Member Yet?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Apply for HSNEF membership
                </p>
                <Link
                  href="/join"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-[#FF9933] to-[#800000] text-white rounded-md hover:from-[#FF8800] hover:to-[#700000] transition-all"
                >
                  Apply for Membership
                </Link>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-[#FF9933] to-[#800000] rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Register to access the HSNEF Member Portal
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                placeholder="you@example.com"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Use the email registered with your HSNEF membership
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FF9933] focus:border-[#FF9933]"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Terms Acceptance */}
            <div>
              <TermsCheckbox
                checked={termsAccepted}
                onChange={setTermsAccepted}
                required={true}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !termsAccepted}
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="text-[#FF9933] hover:text-[#FF8800] font-medium">
              Sign in here
            </Link>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>
              Not a member yet?{' '}
              <Link
                href="/join"
                className="text-[#FF9933] hover:text-[#FF8800] font-medium underline"
              >
                Apply for membership
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            By creating an account, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}
