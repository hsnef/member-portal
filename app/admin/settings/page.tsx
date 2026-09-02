'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { AppLink } from '@/components/nav/Nav'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { IconTile } from '@/components/ui/IconTile'
import { PermissionNote } from '@/components/auth/RoleGate'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FileClockIcon,
  HistoryIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserCogIcon,
  FlaskConicalIcon,
  WalletIcon,
} from 'lucide-react'
import type { UserRole } from '@/types/database'
import type { Tone } from '@/utils/tones'

interface SettingsCard {
  title: string
  description: string
  href: string
  icon: typeof SettingsIcon
  tone: Tone
  roles: UserRole[]
}

/**
 * The `roles` on each card mirror the requiredRoles on the destination route.
 * A card the current user cannot open is still SHOWN, with a PermissionNote
 * naming the role needed -- the design system's rule against dead controls.
 * Previously these were rendered as ordinary links and bounced the user to
 * /unauthorized with no explanation.
 */
const SETTINGS_CARDS: SettingsCard[] = [
  {
    title: 'Staff roles',
    description: 'Who can use the office console, and what each of them can do.',
    href: '/admin/settings/staff-roles',
    icon: ShieldCheckIcon,
    tone: 'kumkum',
    roles: ['Admin'],
  },
  {
    title: 'Portal settings',
    description: 'Registration, authentication and membership pricing.',
    href: '/admin/portal-settings',
    icon: SettingsIcon,
    tone: 'sandal',
    roles: ['Admin', 'Office Manager'],
  },
  {
    title: 'Appearance',
    description: 'The portal theme: colours, fonts and spacing.',
    href: '/admin/settings/appearance',
    icon: PaletteIcon,
    tone: 'lotus',
    roles: ['Admin'],
  },
  {
    title: 'Zelle payments',
    description: 'Where members send transfers, and how requests behave.',
    href: '/admin/zelle/settings',
    icon: WalletIcon,
    tone: 'tulsi',
    roles: ['Admin', 'Office Manager'],
  },
  {
    title: 'Test accounts',
    description: 'Seeded logins for QA, kept separate from real member data.',
    href: '/admin/test-accounts',
    icon: FlaskConicalIcon,
    tone: 'neutral',
    roles: ['Admin', 'Office Manager'],
  },
  {
    title: 'Import members',
    description: 'Create many membership records from a spreadsheet.',
    href: '/admin/members/import',
    icon: UploadIcon,
    tone: 'saffron',
    roles: ['Admin', 'Office Manager', 'Office Staff'],
  },
  {
    title: 'Import history',
    description: 'Past imports, and reverting one that went wrong.',
    href: '/admin/members/import-history',
    icon: HistoryIcon,
    tone: 'sandal',
    roles: ['Admin', 'Office Manager', 'Office Staff'],
  },
  {
    title: 'Service catalog',
    description: 'The pujas and services members can book, and their pricing.',
    href: '/admin/services',
    icon: ClipboardListIcon,
    tone: 'copper',
    roles: ['Admin', 'Office Manager', 'Office Staff'],
  },
  {
    title: 'Priests',
    description: 'Purohits available to perform services.',
    href: '/admin/settings/priests',
    icon: UserCogIcon,
    tone: 'kumkum',
    roles: ['Admin', 'Office Manager', 'Office Staff'],
  },
  {
    title: 'Events',
    description: 'Festivals, classes and seva.',
    href: '/admin/events',
    icon: CalendarDaysIcon,
    tone: 'marigold',
    roles: ['Admin', 'Office Manager', 'Office Staff'],
  },
  {
    title: 'Audit trail',
    description: 'Every change made to a member record, and who made it.',
    href: '/admin/audit-logs',
    icon: FileClockIcon,
    tone: 'sandal',
    roles: ['Admin', 'Office Manager', 'Office Staff'],
  },
]

export default function AdminSettingsPage() {
  const { hasAnyRole } = useAuth()

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Office console"
        title="Settings"
        description="Configuration for the portal, the catalog and the office itself."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_CARDS.map((card) => {
          const allowed = hasAnyRole(card.roles)

          if (!allowed) {
            return (
              <Card as="li" key={card.href} tone="sunk" className="flex h-full flex-col">
                <IconTile icon={card.icon} tone="neutral" size="lg" shape="arch" />
                <h2 className="mt-4 font-serif text-[21px] leading-tight text-ink-2">
                  {card.title}
                </h2>
                <p className="mt-1.5 flex-1 text-[14.5px] leading-snug text-ink-3">
                  {card.description}
                </p>
                <div className="mt-4">
                  <PermissionNote roles={card.roles} />
                </div>
              </Card>
            )
          }

          return (
            <li key={card.href}>
              <AppLink to={card.href} className="group block h-full">
                <Card interactive spine={card.tone} className="flex h-full flex-col pl-7">
                  <IconTile icon={card.icon} tone={card.tone} size="lg" shape="arch" />
                  <h2 className="mt-4 font-serif text-[21px] leading-tight text-ink">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 flex-1 text-[14.5px] leading-snug text-ink-2">
                    {card.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-saffron">
                    Open
                    <ArrowRightIcon
                      className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Card>
              </AppLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
