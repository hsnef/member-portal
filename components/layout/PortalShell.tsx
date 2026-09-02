'use client'

/**
 * ONE shell for both sections. The section decides the nav set and the chrome
 * accent; roles decide which items inside that set are visible. There is no
 * separate AdminLayout -- that is what keeps the two halves of the portal
 * feeling like one product.
 *
 * Ported from the design kit. Differences from the kit's version:
 *   - <Outlet /> becomes {children} (Next App Router layouts).
 *   - Reads the real useAuth(), not the kit's SessionContext stub.
 *   - The demo-only "Viewing as" RoleSwitcher is deleted.
 *   - Sign out calls the real signOut(); the kit just linked to "/".
 *   - Footer carries the version and deployment strings that used to live in
 *     components/AppFooter.tsx.
 *   - Temple office card reads lib/constants/temple.ts rather than hardcoding.
 */

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOutIcon, MenuIcon, PhoneIcon, ShieldCheckIcon, XIcon } from 'lucide-react'
import { AppLink, isPathActive, useActivePath } from '../nav/Nav'
import { BrandLockup } from '../brand/TempleMark'
import { Diya, KolamBand } from '../brand/Motifs'
import { Badge } from '../ui/Badge'
import { easeSmooth } from '../ui/Motion'
import { adminNav, memberNav, visibleNav, STAFF_ROLES, type NavItem } from '@/lib/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'
import { getVersionString, getDeploymentDateString } from '@/lib/constants/version'
import TermsAcceptanceModal from '@/components/TermsAcceptanceModal'
import { TestDataToggle } from '@/components/admin/TestDataToggle'
import { cn } from '@/utils/cn'
import { tones } from '@/utils/tones'

type Section = 'member' | 'admin'

interface PortalShellProps {
  section: Section
  children: React.ReactNode
}

export function PortalShell({ section, children }: PortalShellProps) {
  const pathname = useActivePath()
  const { roles } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const items = visibleNav(section === 'admin' ? adminNav : memberNav, roles)
  const mobileItems = items.filter((item) => item.primaryOnMobile).slice(0, 4)

  useEffect(() => {
    setDrawerOpen(false)
    window.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <Sidebar section={section} items={items} pathname={pathname} className="hidden lg:flex" />

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-kumkum/40 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: easeSmooth }}
              className="absolute inset-y-0 left-0 w-[310px] max-w-[86vw]"
            >
              <Sidebar
                section={section}
                items={items}
                pathname={pathname}
                className="flex h-full"
                onClose={() => setDrawerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar section={section} scrolled={scrolled} onMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 pb-32 pt-8 sm:px-6 lg:px-10 lg:pb-16">
          <div className="mx-auto w-full max-w-content">{children}</div>
        </main>
        <SiteFooter />
      </div>

      {mobileItems.length > 0 && <MobileNav items={mobileItems} pathname={pathname} />}

      {/* Terms gate. This used to live in the deleted AdminLayout, so it only
          ever covered /admin; rendering it here covers /member too, which is
          where most people accept terms in practice. The modal self-gates --
          it checks acceptance and renders nothing once accepted. */}
      <TermsAcceptanceModal />
    </div>
  )
}

/* ───────────────────────────── Sidebar ───────────────────────────── */

function Sidebar({
  section,
  items,
  pathname,
  className,
  onClose,
}: {
  section: Section
  items: NavItem[]
  pathname: string
  className?: string
  onClose?: () => void
}) {
  const { hasAnyRole } = useAuth()
  const isAdmin = section === 'admin'

  return (
    <aside className={cn('w-[284px] shrink-0 flex-col border-r border-line bg-surface', className)}>
      <div className="flex items-center justify-between px-5 py-6">
        <AppLink to={isAdmin ? '/admin' : '/member'} aria-label="HSNEF home">
          <BrandLockup subtitle={isAdmin ? 'Office Console' : 'Member Portal'} />
        </AppLink>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-xl p-2 text-ink-2 transition-colors hover:bg-surface-sunk"
          >
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <KolamBand className="px-5 text-saffron/25" />

      <nav
        aria-label={isAdmin ? 'Office console' : 'Member portal'}
        className="mt-4 flex-1 overflow-y-auto px-3"
      >
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isPathActive(pathname, item.to, item.exact)
            return (
              <li key={item.to}>
                <AppLink
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200',
                    active ? 'text-ink' : 'text-ink-2 hover:bg-surface-sunk hover:text-ink'
                  )}
                >
                  {active && (
                    <>
                      <motion.span
                        layoutId={`nav-active-${section}`}
                        transition={{ duration: 0.35, ease: easeSmooth }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-canvas-deep ring-1 ring-inset ring-line-strong"
                      />
                      <motion.span
                        layoutId={`nav-rail-${section}`}
                        transition={{ duration: 0.35, ease: easeSmooth }}
                        aria-hidden="true"
                        className="absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full"
                        style={{ backgroundColor: `var(${tones[item.tone].varName})` }}
                      />
                    </>
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-t-full rounded-b-lg transition-all duration-300 ease-smooth',
                      active
                        ? tones[item.tone].tile
                        : 'bg-surface-sunk text-ink-3 ring-1 ring-inset ring-line'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="relative z-10 min-w-0">
                    <span className="block text-[15px] font-semibold leading-tight">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">
                      {item.description}
                    </span>
                  </span>
                </AppLink>
              </li>
            )
          })}
        </ul>

        {/* Cross-section jump — only for staff, who live in both halves */}
        {hasAnyRole(STAFF_ROLES) && (
          <div className="mt-6 border-t border-line pt-4">
            <AppLink
              to={isAdmin ? '/member' : '/admin'}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-ink-2 transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-t-full rounded-b-lg bg-surface-sunk ring-1 ring-inset ring-line">
                <ShieldCheckIcon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold leading-tight">
                  {isAdmin ? 'My member portal' : 'Office console'}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-ink-3">
                  {isAdmin ? 'Your own membership' : 'Staff tools'}
                </span>
              </span>
            </AppLink>
          </div>
        )}
      </nav>

      <div className="p-4">
        <div className="relative overflow-hidden rounded-2xl bg-kumkum p-5 text-white">
          <span aria-hidden="true" className="hs-weave absolute inset-0 opacity-40" />
          <div className="relative flex items-start gap-3">
            <Diya className="h-9 w-9 shrink-0" />
            <div>
              <p className="text-[15px] font-semibold leading-tight">Temple office</p>
              <p className="mt-1 text-[13px] leading-snug text-white/70">
                {TEMPLE_CONFIG.address.city}, {TEMPLE_CONFIG.address.state}
              </p>
              <a
                href={`tel:${TEMPLE_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`}
                className="tnum mt-2 inline-flex items-center gap-1.5 text-[14px] font-semibold text-marigold hover:text-white"
              >
                <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {TEMPLE_CONFIG.contact.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ───────────────────────────── Top bar ───────────────────────────── */

function TopBar({
  section,
  scrolled,
  onMenu,
}: {
  section: Section
  scrolled: boolean
  onMenu: () => void
}) {
  const { member, roles, signOut } = useAuth()
  const isAdmin = section === 'admin'

  // member is nullable in the real app (staff without a member record, or
  // still loading), so every field below is defensive.
  const first = member?.first_name ?? ''
  const last = member?.last_name ?? ''
  const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '—'
  const displayName = [first, last].filter(Boolean).join(' ') || 'Signed in'

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300 ease-smooth',
        scrolled
          ? 'border-b border-line bg-canvas/85 backdrop-blur-md'
          : 'border-b border-transparent bg-canvas'
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="rounded-xl p-2 text-ink-2 transition-colors hover:bg-surface-sunk lg:hidden"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <AppLink to={isAdmin ? '/admin' : '/member'} className="lg:hidden" aria-label="HSNEF home">
          <BrandLockup compact subtitle={isAdmin ? 'Office' : 'Member'} />
        </AppLink>

        <div className="ml-auto flex items-center gap-3">
          {/* Staff-only test-data switch. Self-gates on canToggleTestData, so it
              renders nothing for anyone who cannot use it. Lived in the deleted
              AdminLayout. */}
          {isAdmin && <TestDataToggle />}

          {isAdmin ? (
            <Badge tone="kumkum" className="hidden sm:inline-flex">
              {roles.filter((r) => r !== 'Member')[0] ?? 'Staff'}
            </Badge>
          ) : (
            member?.current_level && (
              <Badge tone="tulsi" dot className="hidden sm:inline-flex">
                {member.current_level}
              </Badge>
            )
          )}
          <AppLink
            to={isAdmin ? '/admin/settings' : '/member/profile'}
            className="group flex items-center gap-3 rounded-2xl border border-transparent py-1 pl-1 pr-2.5 transition-colors hover:border-line hover:bg-surface"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-t-full rounded-b-xl bg-kumkum text-[14px] font-bold text-white ring-2 ring-inset ring-white/20"
            >
              {initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[14.5px] font-semibold text-ink">{displayName}</span>
              {member?.membership_id && (
                <span className="tnum block text-[11.5px] font-semibold tracking-wide text-ink-3">
                  {member.membership_id}
                </span>
              )}
            </span>
          </AppLink>
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Sign out"
            className="rounded-xl p-2 text-ink-3 transition-colors hover:bg-surface-sunk hover:text-ink"
          >
            <LogOutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

/* ───────────────────────────── Mobile nav ───────────────────────────── */

function MobileNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isPathActive(pathname, item.to, item.exact)
          return (
            <li key={item.to}>
              <AppLink
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center gap-1 px-1 pb-2.5 pt-3"
              >
                {active && (
                  <motion.span
                    layoutId="mobile-active"
                    transition={{ duration: 0.3, ease: easeSmooth }}
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-[3px] rounded-b-full"
                    style={{ backgroundColor: `var(${tones[item.tone].varName})` }}
                  />
                )}
                <item.icon
                  className={cn('h-[22px] w-[22px]', !active && 'text-ink-3')}
                  strokeWidth={1.9}
                  style={active ? { color: `var(${tones[item.tone].varName})` } : undefined}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-center text-[11px] font-semibold leading-tight',
                    active ? 'text-ink' : 'text-ink-3'
                  )}
                >
                  {item.label}
                </span>
              </AppLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ───────────────────────────── Footer ───────────────────────────── */

function SiteFooter() {
  return (
    <footer className="hidden px-10 pb-8 lg:block">
      <div className="mx-auto max-w-content">
        <div className="hs-rule mb-5" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-ink-3">
          <div>
            <p>
              © {new Date().getFullYear()} {TEMPLE_CONFIG.name} ·{' '}
              {TEMPLE_CONFIG.taxExemptStatus}
            </p>
            <p className="tnum mt-1 text-[12px] text-ink-3">
              Version {getVersionString()} · Deployed {getDeploymentDateString()}
            </p>
          </div>
          <a
            href={`mailto:${TEMPLE_CONFIG.contact.email}`}
            className="transition-colors hover:text-saffron"
          >
            {TEMPLE_CONFIG.contact.email}
          </a>
        </div>
      </div>
    </footer>
  )
}
