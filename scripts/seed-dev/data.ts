/**
 * Demo dataset for the DEV Supabase project (dev-mp) — never production.
 *
 * Pure data and pure helpers only; `index.ts` does the I/O. Kept separate so
 * the rules the database enforces (and the safety guard) are unit-tested
 * without a network.
 *
 * Every person here is fictional: addresses are `demo…@example.com`
 * (RFC 2606, never deliverable) and phones are 904-555-01xx. The reset step
 * finds previous demo rows by that email pattern, so every member and account
 * MUST match `DEMO_EMAIL_PATTERN` — a test enforces it.
 *
 * The schema is mirrored from dev-mp as it actually is (checked 2026-10-09),
 * not from the app's insert code: the booking forms currently send columns
 * that do not exist (#40).
 */

export const DEV_PROJECT_REF = 'bcujsesgrzijyisvmnwm'
export const DEV_SUPABASE_URL = `https://${DEV_PROJECT_REF}.supabase.co`
export const DEV_SITE_URL = 'https://dev.member.hsnef.org'

/** Matches every demo address; used by the reset step to find old demo rows. */
export const DEMO_EMAIL_PATTERN = /^demo[a-z0-9.-]*@example\.com$/
/** The same pattern in PostgREST `ilike` form. */
export const DEMO_EMAIL_ILIKE = 'demo%@example.com'
export const DEMO_BOOKING_PREFIX = 'DEMO-BK-'

/**
 * Throws unless `url` is exactly the dev-mp URL. The seed deletes and rewrites
 * rows, so anything else — production, a lookalike host, a missing value — is
 * refused before a client is even created.
 */
export function assertDevTarget(url: string | undefined): void {
  const normalised = (url ?? '').trim().replace(/\/+$/, '')
  if (normalised !== DEV_SUPABASE_URL) {
    throw new Error(
      `Refusing to run: NEXT_PUBLIC_SUPABASE_URL is '${url ?? ''}', not dev-mp (${DEV_SUPABASE_URL}). Nothing was changed.`
    )
  }
}

export type Role = 'Member' | 'Office Staff' | 'Office Manager' | 'Admin'
export type Level = 'Community' | 'Annual' | 'Lifetime'

export interface DemoMember {
  key: string
  email: string
  first: string
  last: string
  level: Level
  /** Expired = an Annual membership that lapsed last year. */
  status: 'Active' | 'Expired' | 'Pending'
  memberSinceYear: number
  phone: string
  city: string
  business?: string
  family?: Array<{ relationship: 'Secondary' | 'Child'; first: string; last: string; childOrder?: number }>
}

export interface DemoAccount {
  key: string
  email: string
  roles: Role[]
  /** The member record this sign-in is linked to. */
  memberKey: string
  /** Where `dev-signin` lands this account by default. */
  home: '/member' | '/admin'
}

const phone = (n: number) => `904-555-01${String(n).padStart(2, '0')}`

export const MEMBERS: DemoMember[] = [
  // Linked to the four sign-in accounts below.
  { key: 'member', email: 'demo-member@example.com', first: 'Anika', last: 'Rao', level: 'Annual', status: 'Active', memberSinceYear: 2019, phone: phone(1), city: 'Jacksonville',
    family: [
      { relationship: 'Secondary', first: 'Vikram', last: 'Rao' },
      { relationship: 'Child', first: 'Meera', last: 'Rao', childOrder: 1 },
      { relationship: 'Child', first: 'Arjun', last: 'Rao', childOrder: 2 },
    ] },
  { key: 'staff', email: 'demo-staff@example.com', first: 'Kavya', last: 'Iyer', level: 'Annual', status: 'Active', memberSinceYear: 2021, phone: phone(2), city: 'Orange Park' },
  { key: 'manager', email: 'demo-manager@example.com', first: 'Rohan', last: 'Mehta', level: 'Lifetime', status: 'Active', memberSinceYear: 2012, phone: phone(3), city: 'St. Augustine' },
  { key: 'admin', email: 'demo-admin@example.com', first: 'Priya', last: 'Nair', level: 'Lifetime', status: 'Active', memberSinceYear: 2010, phone: phone(4), city: 'Jacksonville' },
  // The wider community, so lists, dashboards and receipts are not empty.
  { key: 'lakshmi', email: 'demo.lakshmi.sharma@example.com', first: 'Lakshmi', last: 'Sharma', level: 'Lifetime', status: 'Active', memberSinceYear: 2008, phone: phone(10), city: 'Jacksonville',
    family: [{ relationship: 'Secondary', first: 'Suresh', last: 'Sharma' }] },
  { key: 'arun', email: 'demo.arun.pillai@example.com', first: 'Arun', last: 'Pillai', level: 'Annual', status: 'Active', memberSinceYear: 2022, phone: phone(11), city: 'Fleming Island' },
  { key: 'deepa', email: 'demo.deepa.krishnan@example.com', first: 'Deepa', last: 'Krishnan', level: 'Annual', status: 'Expired', memberSinceYear: 2018, phone: phone(12), city: 'Ponte Vedra',
    family: [{ relationship: 'Child', first: 'Ishaan', last: 'Krishnan', childOrder: 1 }] },
  { key: 'sanjay', email: 'demo.sanjay.patel@example.com', first: 'Sanjay', last: 'Patel', level: 'Community', status: 'Active', memberSinceYear: 2024, phone: phone(13), city: 'Jacksonville Beach' },
  { key: 'neha', email: 'demo.neha.gupta@example.com', first: 'Neha', last: 'Gupta', level: 'Community', status: 'Active', memberSinceYear: 2025, phone: phone(14), city: 'Jacksonville' },
  { key: 'ravi', email: 'demo.ravi.subramanian@example.com', first: 'Ravi', last: 'Subramanian', level: 'Annual', status: 'Pending', memberSinceYear: 2026, phone: phone(15), city: 'Yulee' },
  { key: 'gita', email: 'demo.gita.menon@example.com', first: 'Gita', last: 'Menon', level: 'Lifetime', status: 'Active', memberSinceYear: 2015, phone: phone(16), city: 'Mandarin',
    family: [
      { relationship: 'Secondary', first: 'Hari', last: 'Menon' },
      { relationship: 'Child', first: 'Tara', last: 'Menon', childOrder: 1 },
    ] },
  { key: 'business', email: 'demo.spicegarden@example.com', first: 'Mohan', last: 'Das', level: 'Annual', status: 'Active', memberSinceYear: 2020, phone: phone(17), city: 'Jacksonville', business: 'Spice Garden Grocers (demo)' },
]

export const ACCOUNTS: DemoAccount[] = [
  { key: 'member', email: 'demo-member@example.com', roles: ['Member'], memberKey: 'member', home: '/member' },
  { key: 'staff', email: 'demo-staff@example.com', roles: ['Member', 'Office Staff'], memberKey: 'staff', home: '/admin' },
  { key: 'manager', email: 'demo-manager@example.com', roles: ['Member', 'Office Manager'], memberKey: 'manager', home: '/admin' },
  { key: 'admin', email: 'demo-admin@example.com', roles: ['Member', 'Admin'], memberKey: 'admin', home: '/admin' },
]

/** Membership prices as configured in dev-mp `portal_settings.membership_pricing`. */
export const MEMBERSHIP_PRICE: Record<Level, number> = { Community: 0, Annual: 101, Lifetime: 1008 }

const iso = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (today: Date, days: number) => {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + days)
  return iso(d)
}

/**
 * The membership row for a member, honouring the table's CHECKs:
 * Annual needs `year`; Lifetime must have no `end_date`.
 */
export function membershipFor(m: DemoMember, today: Date) {
  const year = today.getUTCFullYear()
  if (m.level === 'Lifetime') {
    return { level: m.level, status: 'Active' as const, year: null, start_date: `${m.memberSinceYear}-01-01`, end_date: null, amount: MEMBERSHIP_PRICE.Lifetime }
  }
  if (m.level === 'Annual') {
    const y = m.status === 'Expired' ? year - 1 : year
    return { level: m.level, status: m.status, year: y, start_date: `${y}-01-01`, end_date: `${y}-12-31`, amount: MEMBERSHIP_PRICE.Annual }
  }
  return { level: m.level, status: m.status, year: null, start_date: `${m.memberSinceYear}-01-01`, end_date: null, amount: 0 }
}

export interface DemoEvent {
  key: string
  name: string
  short: string
  category: 'Festival' | 'Puja' | 'Educational' | 'Social' | 'Cultural' | 'Fundraiser' | 'Other'
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed'
  inDays: number
  time: string
  payable: boolean
  memberPrice?: number
  nonMemberPrice?: number
  capacity?: number
}

export const EVENTS: DemoEvent[] = [
  { key: 'diwali', name: 'Diwali Celebration (demo)', short: 'Lamps, prayers, cultural program and dinner.', category: 'Festival', status: 'Published', inDays: 21, time: '18:00', payable: true, memberPrice: 15, nonMemberPrice: 25, capacity: 300 },
  { key: 'satyanarayan', name: 'Community Satyanarayan Puja (demo)', short: 'Monthly community puja. All welcome.', category: 'Puja', status: 'Published', inDays: 9, time: '10:30', payable: false, capacity: 120 },
  { key: 'yoga', name: 'Saturday Yoga for Families (demo)', short: 'Gentle yoga in the hall, mats provided.', category: 'Educational', status: 'Published', inDays: 4, time: '09:00', payable: false, capacity: 3 },
  { key: 'gala', name: 'Annual Fundraising Gala (demo)', short: 'Draft — not yet announced.', category: 'Fundraiser', status: 'Draft', inDays: 60, time: '19:00', payable: true, memberPrice: 75, nonMemberPrice: 100 },
  { key: 'navratri', name: 'Navratri Garba Night (demo)', short: 'Nine nights of garba — completed.', category: 'Cultural', status: 'Completed', inDays: -14, time: '19:30', payable: true, memberPrice: 10, nonMemberPrice: 15, capacity: 250 },
]

export const REGISTRATIONS = [
  // demo-member: paid for Diwali with family, free RSVP to the puja.
  { eventKey: 'diwali', memberKey: 'member', primary: 1, family: 3, guest: 0, pay: { method: 'Stripe' as const } },
  { eventKey: 'satyanarayan', memberKey: 'member', primary: 1, family: 1, guest: 0 },
  // Yoga is at capacity (3 of 3) so the full state is visible.
  { eventKey: 'yoga', memberKey: 'lakshmi', primary: 1, family: 0, guest: 0 },
  { eventKey: 'yoga', memberKey: 'arun', primary: 1, family: 0, guest: 0 },
  { eventKey: 'yoga', memberKey: 'gita', primary: 1, family: 0, guest: 0 },
  { eventKey: 'diwali', memberKey: 'gita', primary: 1, family: 2, guest: 1, pay: { method: 'Cash' as const } },
  { eventKey: 'navratri', memberKey: 'member', primary: 1, family: 1, guest: 0, pay: { method: 'Stripe' as const } },
]

export type BookingStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Paid' | 'Completed' | 'Cancelled'

export interface DemoBooking {
  number: string
  memberKey: string | null
  status: BookingStatus
  /** Indexes into the active, priced services fetched at run time. */
  items: Array<{ service: number; inDays: number; location: 'Temple' | 'External'; purohit?: number }>
  notes?: string
  walkIn?: boolean
  rejection?: string
}

export const BOOKINGS: DemoBooking[] = [
  { number: `${DEMO_BOOKING_PREFIX}0001`, memberKey: 'member', status: 'Pending Approval', items: [{ service: 0, inDays: 12, location: 'Temple', purohit: 0 }], notes: 'For Meera’s birthday.' },
  { number: `${DEMO_BOOKING_PREFIX}0002`, memberKey: 'member', status: 'Approved', items: [{ service: 1, inDays: 25, location: 'External', purohit: 1 }] },
  { number: `${DEMO_BOOKING_PREFIX}0003`, memberKey: 'member', status: 'Completed', items: [{ service: 0, inDays: -30, location: 'Temple', purohit: 0 }] },
  { number: `${DEMO_BOOKING_PREFIX}0004`, memberKey: 'arun', status: 'Paid', items: [{ service: 2, inDays: 6, location: 'Temple', purohit: 1 }, { service: 0, inDays: 6, location: 'Temple' }] },
  { number: `${DEMO_BOOKING_PREFIX}0005`, memberKey: 'deepa', status: 'Rejected', items: [{ service: 1, inDays: 3, location: 'External' }], rejection: 'No priest available on that date — please choose another.' },
  { number: `${DEMO_BOOKING_PREFIX}0006`, memberKey: 'sanjay', status: 'Cancelled', items: [{ service: 0, inDays: 15, location: 'Temple' }] },
  { number: `${DEMO_BOOKING_PREFIX}0007`, memberKey: null, status: 'Paid', walkIn: true, items: [{ service: 0, inDays: 0, location: 'Temple', purohit: 0 }], notes: 'Walk-in, paid cash at the office.' },
]

export const REQUESTS = [
  { memberKey: 'member', purpose: 'Sponsorship' as const, description: 'Diwali flower decoration sponsorship (demo)', amount: 251, status: 'Sent' as const, dueInDays: 14 },
  { memberKey: 'lakshmi', purpose: 'Donation' as const, description: 'Building fund pledge, instalment 2 of 4 (demo)', amount: 500, status: 'Paid' as const, dueInDays: -5 },
  { memberKey: 'arun', purpose: 'Service' as const, description: 'Griha pravesh puja balance (demo)', amount: 150, status: 'Draft' as const, dueInDays: 30 },
  { memberKey: 'deepa', purpose: 'Membership' as const, description: 'Annual membership renewal (demo)', amount: 101, status: 'Expired' as const, dueInDays: -45 },
]

/** Stand-alone donations, so payments and receipts have history. */
export const DONATIONS = [
  { memberKey: 'member', amount: 51, method: 'Stripe' as const, daysAgo: 40 },
  { memberKey: 'member', amount: 108, method: 'Stripe' as const, daysAgo: 3 },
  { memberKey: 'gita', amount: 1001, method: 'Check' as const, daysAgo: 20, check: '4417' },
  { memberKey: 'business', amount: 250, method: 'Cash' as const, daysAgo: 8 },
]

export type PayMethod = 'Stripe' | 'Cash' | 'Check' | 'Zelle'

/**
 * Payment-row fields that the table's CHECKs depend on: a Stripe payment must
 * carry a `stripe_payment_intent_id`; amounts must be positive.
 */
export function paymentFields(method: PayMethod, ref: string, amount: number) {
  if (!(amount > 0)) throw new Error(`payment ${ref}: amount must be > 0, got ${amount}`)
  return {
    method,
    amount,
    stripe_payment_intent_id: method === 'Stripe' ? `pi_demo_${ref}` : null,
  }
}
