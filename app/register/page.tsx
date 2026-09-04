'use client'

import Link from 'next/link'

import { TEMPLE_CONFIG } from '@/lib/constants/temple'

/**
 * `/register` — how to get portal access.
 *
 * This page used to create an account with `supabase.auth.signUp({ email,
 * password })`. That password could never be used: the login page has no
 * password field and signs people in with a magic link or Google. The portal is
 * magic-link-only by decision (2026-09-03), so the password path is gone.
 *
 * Nothing was lost with it. Both jobs the old flow did already happen on a
 * normal magic-link sign-in:
 *
 *   - Linking the account to the member record — `lib/auth/AuthContext.tsx`
 *     calls `/api/auth/link-member`, which matches on email and bypasses RLS.
 *   - Recording terms acceptance — `TermsAcceptanceModal`, rendered by
 *     `PortalShell`, records `first_login` acceptance on the first visit.
 *
 * So an existing member simply signs in; there is nothing to register. Someone
 * who is not a member yet needs an application, which is `/join`.
 */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <main className="w-full max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <h1 className="font-serif text-[26px] leading-tight text-ink">
            Getting into the portal
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            There is no separate account to create. If the temple has your email on
            file, signing in creates and links your portal account for you.
          </p>

          <div className="mt-7 space-y-5">
            <section className="rounded-xl border border-line bg-surface-sunk p-5">
              <h2 className="text-[15px] font-semibold text-ink">
                Already a member
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                Sign in with a link sent to your email, or with Google. Your
                membership is matched automatically.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-lg bg-saffron px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-saffron-hover"
              >
                Go to sign in
              </Link>
            </section>

            <section className="rounded-xl border border-line p-5">
              <h2 className="text-[15px] font-semibold text-ink">
                Not a member yet
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                Apply for membership and the office will review it.
              </p>
              <Link
                href="/join"
                className="mt-4 inline-block rounded-lg border border-line-strong px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-sunk"
              >
                Apply for membership
              </Link>
            </section>
          </div>

          <p className="mt-7 border-t border-line pt-5 text-[13.5px] leading-relaxed text-ink-3">
            Signing in does not work, or the office does not have your email?
            Contact{' '}
            <a
              href={`mailto:${TEMPLE_CONFIG.contact.email}`}
              className="font-semibold text-saffron transition-colors hover:text-saffron-hover"
            >
              {TEMPLE_CONFIG.contact.email}
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
