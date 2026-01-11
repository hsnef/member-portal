'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Client-side callback handler for magic links and PKCE auth flows
 * Handles both hash fragments (#access_token=...) and code parameter (?code=...)
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
        const redirect = searchParams.get('redirect') || '/member'

        // Log current URL for debugging
        console.log('[CallbackHandler] Full URL:', window.location.href)
        console.log('[CallbackHandler] Hash:', window.location.hash)
        console.log('[CallbackHandler] Search:', window.location.search)

        // Check for error in query params first
        const errorFromQuery = searchParams.get('error')
        const errorDescFromQuery = searchParams.get('error_description')
        if (errorFromQuery) {
          console.error('[CallbackHandler] Auth error from query:', errorFromQuery, errorDescFromQuery)
          setError(errorDescFromQuery || errorFromQuery)
          router.push(`/login?error=${encodeURIComponent(errorDescFromQuery || errorFromQuery)}`)
          return
        }

        // Check for hash fragments (older magic link flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const errorParam = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        // Handle error from hash
        if (errorParam) {
          console.error('[CallbackHandler] Auth error from hash:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          router.push(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
          return
        }

        // Handle magic link with hash fragments
        if (accessToken && refreshToken) {
          console.log('[CallbackHandler] Setting session from hash fragments')

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            console.error('[CallbackHandler] Error setting session from hash:', sessionError)
            setError(sessionError.message)
            router.push(`/login?error=${encodeURIComponent(sessionError.message)}`)
            return
          }

          if (data.session) {
            console.log('[CallbackHandler] Session established from hash')
            await trackLogin()
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            router.push(redirect)
            return
          }
        }

        // Check for PKCE code parameter (newer flow)
        const code = searchParams.get('code')
        if (code) {
          console.log('[CallbackHandler] Exchanging PKCE code for session')

          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              // Check if this is a PKCE error - if so, try to get session anyway
              if (exchangeError.message.includes('PKCE') || exchangeError.message.includes('code verifier')) {
                console.warn('[CallbackHandler] PKCE error, checking for existing session:', exchangeError.message)
                // The session might have been established already, try to get it
                const { data: { session: existingSession } } = await supabase.auth.getSession()
                if (existingSession) {
                  console.log('[CallbackHandler] Found existing session despite PKCE error')
                  await trackLogin()
                  router.push(redirect)
                  return
                }
              }
              console.error('[CallbackHandler] Error exchanging code:', exchangeError)
              setError(exchangeError.message)
              router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`)
              return
            }

            if (data.session) {
              console.log('[CallbackHandler] Session established from code exchange')
              await trackLogin()
              router.push(redirect)
              return
            }
          } catch (pkceError: any) {
            console.error('[CallbackHandler] PKCE exchange exception:', pkceError)
            // Try to recover by checking for existing session
            const { data: { session: existingSession } } = await supabase.auth.getSession()
            if (existingSession) {
              console.log('[CallbackHandler] Recovered - found existing session')
              await trackLogin()
              router.push(redirect)
              return
            }
            setError('Authentication failed. Please try logging in again.')
            router.push(`/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
            return
          }
        }

        // No auth data in URL - check if we already have a session
        console.log('[CallbackHandler] No auth data in URL, checking for existing session')
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('[CallbackHandler] Existing session found, redirecting')
          router.push(redirect)
          return
        }

        // Last resort: wait a moment and try getSession again
        // (sometimes the auth state takes a moment to propagate)
        console.log('[CallbackHandler] No session yet, waiting and retrying...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (retrySession) {
          console.log('[CallbackHandler] Session found on retry')
          router.push(redirect)
          return
        }

        // No session and no auth data
        console.warn('[CallbackHandler] No authentication data found')
        setError('No authentication data found. Please try logging in again.')
        router.push(`/login?error=${encodeURIComponent('No authentication data found')}`)
      } catch (err) {
        console.error('[CallbackHandler] Error in auth callback:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        router.push(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'An error occurred')}`)
      } finally {
        setLoading(false)
      }
    }

    // Helper function to track login
    const trackLogin = async () => {
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
        console.warn('[CallbackHandler] Login tracking error:', trackingError)
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
