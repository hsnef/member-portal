'use client'

/**
 * Login — presentation only.
 *
 * Every prop is supplied by app/login/page.tsx, which owns all auth logic
 * (Supabase OAuth, magic link, login tracking, portal settings). This file
 * contains no data fetching and no side effects.
 *
 * Exemplar: design-kit/pages/Login.tsx
 */

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { IconTile } from '@/components/ui/IconTile'
import { easeSmooth } from '@/components/ui/Motion'
import { BrandLockup } from '@/components/brand/TempleMark'
import { CornerMandala, Diya, Eyebrow, KolamBand } from '@/components/brand/Motifs'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'
import { getVersionString } from '@/lib/constants/version'

export interface LoginViewProps {
  email: string
  onEmailChange: (value: string) => void
  onGoogleSignIn: (event: React.MouseEvent) => void
  onMagicLinkSubmit: (event: React.FormEvent) => void
  onUseDifferentEmail: () => void
  loading: boolean
  message: { type: 'success' | 'error'; text: string } | null
  /** Address the link was sent to, so the confirmation can name it. */
  sentToEmail: string | null
  /** Portal setting: show the "create portal account" route. */
  showTraditionalLogin: boolean
}

export function LoginView({
  email,
  onEmailChange,
  onGoogleSignIn,
  onMagicLinkSubmit,
  onUseDifferentEmail,
  loading,
  message,
  sentToEmail,
  showTraditionalLogin,
}: LoginViewProps) {
  const sent = message?.type === 'success' && Boolean(sentToEmail)
  const errorText = message?.type === 'error' ? message.text : undefined

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* ---- Left: place ---- */}
      <aside className="relative hidden w-[46%] max-w-[640px] shrink-0 overflow-hidden lg:block">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: easeSmooth }}
          className="absolute inset-0"
        >
          <picture>
            <source srcSet="/images/temple-hero.webp" type="image/webp" />
            <img
              src="/images/temple-hero.jpg"
              alt="The temple at golden hour, its carved shikhara rising above the entrance, marigold garlands strung across the doors"
              className="h-full w-full object-cover"
            />
          </picture>
        </motion.div>

        <div className="absolute inset-0 bg-kumkum/65" />
        <span aria-hidden="true" className="hs-weave absolute inset-0 opacity-50" />
        <CornerMandala className="-right-20 top-1/3 h-96 w-96 text-marigold/15" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <BrandLockup inverse subtitle="Member Portal" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeSmooth, delay: 0.15 }}
            className="max-w-md"
          >
            <Diya className="h-11 w-11" />
            <h1 className="mt-6 font-serif text-[52px] leading-[1.02]">
              Your temple,
              <br />
              always within reach.
            </h1>
            <p className="mt-5 text-[17.5px] leading-relaxed text-white/75">
              Renew your membership, sponsor a puja, register the family for festivals, and keep
              every receipt in one calm place.
            </p>
          </motion.div>

          <div>
            <KolamBand className="mb-7 text-marigold/40" />
            <dl className="grid grid-cols-2 gap-6 text-[15px]">
              <div>
                <dt className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Location
                </dt>
                <dd className="mt-1.5 font-medium text-white">
                  {TEMPLE_CONFIG.address.city}, {TEMPLE_CONFIG.address.state}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/50">
                  <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Temple office
                </dt>
                <dd className="tnum mt-1.5 font-medium text-white">
                  {TEMPLE_CONFIG.contact.phone}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>

      {/* ---- Right: sign in ---- */}
      <main className="hs-dots relative flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <CornerMandala className="-left-24 -top-24 text-saffron/[0.06]" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeSmooth }}
          className="relative w-full max-w-[430px]"
        >
          <div className="lg:hidden">
            <BrandLockup subtitle="Member Portal" />
          </div>

          <div className="mt-8 lg:mt-0">
            <Eyebrow>Member Portal</Eyebrow>
            <h2 className="mt-3 font-serif text-[40px] leading-[1.05] text-ink">Welcome back</h2>
            <p className="mt-2.5 text-[16px] text-ink-2">
              Sign in with your email — no password to remember.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: easeSmooth }}
                className="mt-8 space-y-5"
              >
                <Alert tone="success" title={`Check ${sentToEmail}`}>
                  {message?.text} You can close this tab — the link opens your portal directly.
                </Alert>
                <Button variant="ghost" fullWidth onClick={onUseDifferentEmail}>
                  Use a different email
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: easeSmooth }}
                onSubmit={onMagicLinkSubmit}
                className="mt-8 space-y-5"
                noValidate
                suppressHydrationWarning
              >
                {/* Errors here come from Supabase, OAuth or config -- not from
                    field validation -- so they belong in a banner, not under
                    the email input. This matches the original behaviour. */}
                {errorText && <Alert tone="danger" title={errorText} />}

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={loading}
                  onClick={onGoogleSignIn}
                  suppressHydrationWarning
                >
                  <span className="flex items-center gap-3">
                    <GoogleGlyph />
                    Continue with Google
                  </span>
                </Button>

                <div className="flex items-center gap-4" aria-hidden="true">
                  <span className="h-px flex-1 bg-line-strong" />
                  <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">
                    or use your email
                  </span>
                  <span className="h-px flex-1 bg-line-strong" />
                </div>

                <Field
                  label="Email address"
                  hint="Use the email the temple office has on file for you."
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      name="email"
                      aria-describedby={describedBy}
                      invalid={invalid}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      disabled={loading}
                      onChange={(e) => onEmailChange(e.target.value)}
                      suppressHydrationWarning
                    />
                  )}
                </Field>

                <Button type="submit" size="lg" fullWidth icon={MailIcon} loading={loading}>
                  {loading ? 'Sending your link' : 'Email me a sign-in link'}
                </Button>

                <p className="flex items-start gap-2 text-[13.5px] leading-snug text-ink-3">
                  <ShieldCheckIcon
                    className="mt-0.5 h-4 w-4 shrink-0 text-tulsi"
                    aria-hidden="true"
                  />
                  By signing in you agree to our terms of service and privacy policy.
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Join card */}
          <div className="mt-9 flex gap-4 rounded-2xl border border-marigold/35 bg-marigold-soft p-5">
            <IconTile icon={SparklesIcon} tone="marigold" size="md" shape="arch" />
            <div>
              <p className="font-serif text-[21px] leading-tight text-ink">Not a member yet?</p>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
                Join the HSNEF family for member rates on every puja, festival pricing, and a voice
                at the general body meeting.
              </p>
              <a
                href="/join"
                className="group mt-3 inline-flex items-center gap-2 text-[15px] font-semibold text-copper-ink"
              >
                Apply for membership
                <ArrowRightIcon
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          {/* Existing member without portal access — gated on the portal setting */}
          {showTraditionalLogin && (
            <p className="mt-6 text-center text-[14px] text-ink-2">
              Existing member without portal access?{' '}
              <a
                href="/register"
                className="font-semibold text-saffron hover:text-saffron-hover"
              >
                Create a portal account
              </a>
            </p>
          )}

          <p className="mt-7 text-center text-[13.5px] text-ink-3">
            Trouble signing in? Email{' '}
            <a
              href={`mailto:${TEMPLE_CONFIG.contact.email}`}
              className="font-semibold text-saffron hover:text-saffron-hover"
            >
              {TEMPLE_CONFIG.contact.email}
            </a>
          </p>

          <p className="tnum mt-4 text-center text-[11.5px] text-ink-3/70">
            {getVersionString()}
          </p>
        </motion.div>
      </main>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}
