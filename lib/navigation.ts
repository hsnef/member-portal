/**
 * Portal navigation.
 *
 * `roles` on each item MIRRORS the `requiredRoles` on the real route. The code
 * is authoritative: where the design kit's nav data disagreed with the app, the
 * app won. Differences from the kit's data/navigation.ts, all verified against
 * the pages themselves:
 *
 *   - /admin/purohits          -> /admin/settings/priests (feature relocated;
 *                                 the table is still `purohits`)
 *   - /admin/settings          -> staff, NOT Admin-only. The kit and
 *                                 docs/ROUTE_MAP.md both claim Admin-only;
 *                                 app/admin/settings/page.tsx says otherwise.
 *   - /member/membership       -> does not exist. Uses /member/pass.
 *   - /member/services         -> does not exist. Members book via
 *                                 /member/bookings/new.
 *   - added: Zelle, Applications, Activity Logs, Audit Trail, My Bookings --
 *     all real routes the kit's nav predates.
 *
 * If a route's requiredRoles ever changes, change it here too.
 */

import {
  CalendarDaysIcon,
  ClipboardListIcon,
  CreditCardIcon,
  FileClockIcon,
  FlameIcon,
  HandCoinsIcon,
  HomeIcon,
  IdCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  QrCodeIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Tone } from '@/utils/tones'
import type { UserRole } from '@/types/database'

export const STAFF_ROLES: UserRole[] = ['Office Staff', 'Office Manager', 'Admin']

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  description: string
  tone: Tone
  /** Undefined = every authenticated user. Otherwise the roles allowed to see it. */
  roles?: UserRole[]
  primaryOnMobile?: boolean
  /** Match only the exact path (used for section index routes) */
  exact?: boolean
}

/**
 * Each destination owns a hue from the accent family. The colour is the
 * wayfinding cue -- members learn "the rose one is my requests" long before
 * they read the label.
 *
 * Every /member route is authenticated-only, so no item carries `roles`.
 */
export const memberNav: NavItem[] = [
  {
    label: 'Home',
    to: '/member',
    icon: HomeIcon,
    description: 'What needs you today',
    tone: 'saffron',
    primaryOnMobile: true,
    exact: true,
  },
  {
    label: 'My Pass',
    to: '/member/pass',
    icon: IdCardIcon,
    description: 'Your membership QR pass',
    tone: 'kumkum',
    primaryOnMobile: true,
  },
  {
    label: 'Book a Service',
    to: '/member/bookings/new',
    icon: FlameIcon,
    description: 'Pujas, havans, samskaras',
    tone: 'copper',
    primaryOnMobile: true,
  },
  {
    label: 'My Bookings',
    to: '/member/bookings',
    icon: ClipboardListIcon,
    description: 'Scheduled and past services',
    tone: 'marigold',
  },
  {
    label: 'My Requests',
    to: '/member/requests',
    icon: ScrollTextIcon,
    description: 'Approvals and invoices',
    tone: 'lotus',
    primaryOnMobile: true,
  },
  {
    label: 'Events',
    to: '/member/events',
    icon: CalendarDaysIcon,
    description: 'Festivals, classes, seva',
    tone: 'marigold',
  },
  {
    label: 'Donate',
    to: '/member/donate',
    icon: HandCoinsIcon,
    description: 'Support the temple funds',
    tone: 'tulsi',
  },
  {
    label: 'Payments',
    to: '/member/payments',
    icon: ReceiptTextIcon,
    description: 'History and tax receipts',
    tone: 'sandal',
  },
  {
    label: 'Family & Profile',
    to: '/member/profile',
    icon: UsersIcon,
    description: 'Your details and household',
    tone: 'neutral',
  },
]

/**
 * Office console. `roles` mirrors requiredRoles on each page.
 */
export const adminNav: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboardIcon,
    description: 'Today at the temple',
    tone: 'saffron',
    roles: STAFF_ROLES,
    primaryOnMobile: true,
    exact: true,
  },
  {
    label: 'Members',
    to: '/admin/members',
    icon: UsersIcon,
    description: 'Directory, import, history',
    tone: 'kumkum',
    roles: STAFF_ROLES,
    primaryOnMobile: true,
  },
  {
    label: 'Applications',
    to: '/admin/pending-registrations',
    icon: InboxIcon,
    description: 'Pending membership requests',
    tone: 'lotus',
    roles: STAFF_ROLES,
  },
  {
    label: 'Bookings',
    to: '/admin/bookings',
    icon: FlameIcon,
    description: 'Approve and schedule',
    tone: 'copper',
    roles: STAFF_ROLES,
    primaryOnMobile: true,
  },
  {
    label: 'Requests',
    to: '/admin/requests',
    icon: ScrollTextIcon,
    description: 'Invoices and service requests',
    tone: 'lotus',
    roles: STAFF_ROLES,
  },
  {
    label: 'Payments',
    to: '/admin/payments',
    icon: CreditCardIcon,
    description: 'Record and reconcile',
    tone: 'tulsi',
    roles: STAFF_ROLES,
    primaryOnMobile: true,
  },
  {
    label: 'Zelle',
    to: '/admin/zelle',
    icon: WalletIcon,
    description: 'Confirm Zelle transfers',
    tone: 'tulsi',
    roles: STAFF_ROLES,
  },
  {
    label: 'Receipts',
    to: '/admin/receipts',
    icon: ReceiptTextIcon,
    description: 'Issued tax receipts',
    tone: 'sandal',
    roles: STAFF_ROLES,
  },
  {
    label: 'Events',
    to: '/admin/events',
    icon: CalendarDaysIcon,
    description: 'Publish and track registrations',
    tone: 'marigold',
    roles: STAFF_ROLES,
  },
  {
    label: 'Services',
    to: '/admin/services',
    icon: ClipboardListIcon,
    description: 'The puja catalog and pricing',
    tone: 'copper',
    roles: STAFF_ROLES,
  },
  {
    label: 'Priests',
    to: '/admin/settings/priests',
    icon: UserCogIcon,
    description: 'Purohits and availability',
    tone: 'kumkum',
    roles: STAFF_ROLES,
  },
  {
    label: 'Scan QR',
    to: '/admin/scan-qr',
    icon: QrCodeIcon,
    description: 'Check members in at the desk',
    tone: 'neutral',
    roles: STAFF_ROLES,
  },
  {
    label: 'Audit Trail',
    to: '/admin/audit-logs',
    icon: FileClockIcon,
    description: 'Member data change history',
    tone: 'sandal',
    roles: STAFF_ROLES,
  },
  {
    label: 'Activity Logs',
    to: '/admin/login-activity',
    icon: ShieldCheckIcon,
    description: 'Sign-in attempts and geo',
    tone: 'neutral',
    roles: ['Office Manager', 'Admin'],
  },
  {
    label: 'Settings',
    to: '/admin/settings',
    icon: SettingsIcon,
    description: 'Organisation configuration',
    tone: 'neutral',
    roles: STAFF_ROLES,
  },
]

export function visibleNav(items: NavItem[], roles: UserRole[]): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)))
}
