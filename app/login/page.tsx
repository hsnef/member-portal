'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isTraditionalLoginEnabled } from '@/lib/utils/portalSettings'
import { LoginView } from '@/components/auth/LoginView'
import { Skeleton } from '@/components/ui/Skeleton'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/member'

  const [email, setEmail] = useState('')
  const [sentToEmail, setSentToEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false)

  // Initialize Supabase client
  const supabase = createClient()

  // Check for error in URL params (from callback)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setMessage({ type: 'error', text: decodeURIComponent(errorParam) })
      return
    }
    // AuthContext signs out an account with no membership and no role, and
    // sends it here. Say why, or being bounced back to the login page with no
    // explanation reads as the sign-in silently failing.
    if (searchParams.get('reason') === 'no-membership') {
      setMessage({
        type: 'error',
        text: `That account is not linked to a membership, so there is nothing for it to open. If you are a member, the temple office can add your address — contact ${TEMPLE_CONFIG.contact.email}.`,
      })
    }
  }, [searchParams])

  // Check if traditional login is enabled
  useEffect(() => {
    async function checkTraditionalLogin() {
      const enabled = await isTraditionalLoginEnabled()
      setShowTraditionalLogin(enabled)
    }
    checkTraditionalLogin()
  }, [])

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    try {
      setLoading(true)
      setMessage(null)

      // Check if Supabase client is initialized
      if (!supabase) {
        console.error('Supabase client not initialized')
        setMessage({ type: 'error', text: 'Authentication service not available. Please refresh the page.' })
        return
      }

      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        console.error('NEXT_PUBLIC_SUPABASE_URL not set')
        setMessage({ type: 'error', text: 'Configuration error. Please contact support.' })
        return
      }

      console.log('Starting Google OAuth...')
      console.log('Supabase URL:', supabaseUrl)
      const redirectUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
      console.log('Redirect to:', redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      console.log('OAuth response:', { data, error, hasUrl: !!data?.url })

      if (error) {
        console.error('OAuth error:', error)
        setMessage({ type: 'error', text: error.message })

        // Track failed Google OAuth login
        try {
          await fetch('/api/login-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loginMethod: 'google',
              success: false,
              failureReason: error.message,
            }),
          })
        } catch (trackingError) {
          console.warn('Login tracking error:', trackingError)
        }

        setLoading(false)
      } else if (data?.url) {
        console.log('Redirecting to:', data.url)
        // Force redirect immediately
        window.location.href = data.url
        // Don't set loading to false here as we're redirecting
      } else {
        console.warn('No redirect URL returned from OAuth')
        setMessage({ type: 'error', text: 'OAuth redirect failed. Please check your configuration.' })
        setLoading(false)
      }
    } catch (error) {
      console.error('OAuth exception:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      })
      setLoading(false)
    }
  }

  // Handle Magic Link sign-in
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    try {
      setLoading(true)
      setMessage(null)

      // Refuse unknown addresses before Supabase is asked for a link.
      // `signInWithOtp` creates an account for any address it is given, and an
      // account with no member record behind it can do nothing in this portal
      // and has no way to fix itself. See the route for why it allows both a
      // member record and an existing auth account.
      const gate = await fetch('/api/auth/check-member-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then((r) => r.json())
        .catch(() => ({ allowed: true }))

      if (!gate.allowed) {
        setMessage({
          type: 'error',
          text: `We do not have a membership on file for ${email}. If you are a member, the temple office can add your address — contact ${TEMPLE_CONFIG.contact.email}.`,
        })
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Use server-side callback which handles PKCE code exchange better
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })

        // Track failed magic link login
        try {
          await fetch('/api/login-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loginMethod: 'magic_link',
              success: false,
              failureReason: error.message,
            }),
          })
        } catch (trackingError) {
          console.warn('Login tracking error:', trackingError)
        }
      } else {
        setMessage({
          type: 'success',
          text: 'We sent you a secure sign-in link.',
        })
        setSentToEmail(email)
        setEmail('')
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  // Return to the form after a link has been sent.
  const handleUseDifferentEmail = () => {
    setSentToEmail(null)
    setMessage(null)
  }

  return (
    <LoginView
      email={email}
      onEmailChange={(value) => {
        setEmail(value)
        if (message?.type === 'error') setMessage(null)
      }}
      onGoogleSignIn={handleGoogleSignIn}
      onMagicLinkSubmit={handleMagicLink}
      onUseDifferentEmail={handleUseDifferentEmail}
      loading={loading}
      message={message}
      sentToEmail={sentToEmail}
      showTraditionalLogin={showTraditionalLogin}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="hs-dots flex min-h-screen items-center justify-center bg-canvas px-6">
          <div
            className="w-full max-w-[430px] space-y-5"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading sign in…</span>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-11 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
