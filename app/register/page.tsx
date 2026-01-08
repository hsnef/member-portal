'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

            {/* Submit Button */}
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
              <a
                href="mailto:info@hsnef.org"
                className="text-[#FF9933] hover:text-[#FF8800] font-medium"
              >
                Contact us to join
              </a>
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
