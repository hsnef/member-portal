'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Client-side callback handler for magic links
 * Magic links use hash fragments (#access_token=...) which are only accessible client-side
 */
function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for hash fragments (magic link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const errorParam = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        const redirect = searchParams.get('redirect') || '/admin'

        // Handle error from hash
        if (errorParam) {
          console.error('Auth error from hash:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
          return
        }

        // Handle magic link (hash fragments)
        if (accessToken && refreshToken) {
          console.log('Magic link callback - setting session from hash')
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('Error setting session from hash:', sessionError)
            setError(sessionError.message)
            router.push(`/login?error=${encodeURIComponent(sessionError.message)}`)
            return
          }

          if (data.session) {
            console.log('Magic link session established successfully')

            // Track successful magic link login
            try {
              await fetch('/api/login-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  loginMethod: 'magic_link',
                  success: true,
                }),
              })
            } catch (trackingError) {
              // Don't fail the login if tracking fails
              console.warn('Login tracking error:', trackingError)
            }

            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            router.push(redirect)
            return
          }
        }

        // No auth data found - check if we already have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Existing session found')
          router.push(redirect)
          return
        }

        // No session and no auth data
        console.warn('No authentication data found in callback')
        setError('No authentication data found')
        router.push(`/login?error=${encodeURIComponent('No authentication data found')}`)
      } catch (err) {
        console.error('Error in auth callback:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        router.push(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'An error occurred')}`)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Completing sign in...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Sign In Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#FF8800] transition-colors"
            >
              Return to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Wrap in Suspense for useSearchParams
export default function CallbackHandlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-[#FF9933] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
