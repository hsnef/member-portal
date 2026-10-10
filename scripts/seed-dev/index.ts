/**
 * Reset and reseed demo data on the DEV Supabase project (dev-mp).
 *
 *   npm run seed:dev
 *
 * Refuses to run unless NEXT_PUBLIC_SUPABASE_URL is exactly dev-mp. Safe to
 * re-run: it deletes every row it previously created (found by the
 * `demo…@example.com` pattern and the `DEMO-BK-` booking prefix) and inserts
 * a fresh set. Auth accounts are kept and reused, so sign-ins keep working.
 *
 * Rows that are NOT demo data — the older `9999x000` test members, services,
 * purohits, portal settings, real staff accounts — are never touched.
 *
 * Sign in as a demo user with `npm run dev:signin -- <member|staff|manager|admin>`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  ACCOUNTS, BOOKINGS, DEMO_BOOKING_PREFIX, DEMO_EMAIL_ILIKE, DONATIONS, EVENTS,
  MEMBERS, REGISTRATIONS, REQUESTS, addDays, assertDevTarget, membershipFor, paymentFields,
  type PayMethod,
} from './data'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
assertDevTarget(url)
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (run via `npm run seed:dev`, which loads .env.local).')

const db: SupabaseClient = createClient(url!, key, { auth: { autoRefreshToken: false, persistSession: false } })
const today = new Date()

/** Unwraps a Supabase result, failing loudly with the step name. */
function must<T>(step: string, res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`${step}: ${res.error.message}`)
  return res.data
}

async function findAuthUser(email: string): Promise<string | null> {
  // Page through rather than trusting a filter; dev has a handful of users.
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const hit = data.users.find(u => (u.email ?? '').toLowerCase() === email)
    if (hit) return hit.id
    if (data.users.length < 200) return null
  }
  return null
}

async function reset() {
  const demoMembers = must('find demo members', await db.from('members').select('id').ilike('primary_email', DEMO_EMAIL_ILIKE)) as { id: string }[]
  const ids = demoMembers.map(m => m.id)

  must('delete demo bookings', await db.from('service_bookings').delete().like('booking_number', `${DEMO_BOOKING_PREFIX}%`))
  if (ids.length) {
    // receipts → payments → requests, because both FKs to members/payments are RESTRICT.
    must('delete receipts', await db.from('receipts').delete().in('member_id', ids))
    must('delete payments', await db.from('payments').delete().in('member_id', ids))
    must('delete requests', await db.from('requests').delete().in('member_id', ids))
  }
  const admins = ACCOUNTS.map(a => a.email)
  const authIds = (await Promise.all(admins.map(findAuthUser))).filter(Boolean) as string[]
  if (authIds.length) must('delete demo events', await db.from('events').delete().in('created_by', authIds))
  // Cascades family_members, memberships, event_registrations, audit rows.
  if (ids.length) must('delete demo members', await db.from('members').delete().in('id', ids))
  return { members: ids.length }
}

async function ensureAccounts() {
  const out: Record<string, string> = {}
  for (const a of ACCOUNTS) {
    let id = await findAuthUser(a.email)
    if (!id) {
      const { data, error } = await db.auth.admin.createUser({ email: a.email, email_confirm: true })
      if (error) throw new Error(`create ${a.email}: ${error.message}`)
      id = data.user.id
    }
    out[a.key] = id
    const rows = a.roles.map(role => ({ user_id: id, role }))
    must(`roles for ${a.email}`, await db.from('user_roles').upsert(rows, { onConflict: 'user_id,role', ignoreDuplicates: true }))
  }
  return out
}

async function insertPayment(memberId: string, ref: string, amount: number, method: PayMethod, purpose: string, daysAgo: number, extra: Record<string, unknown> = {}) {
  const row = {
    member_id: memberId,
    purpose,
    ...paymentFields(method, ref, amount),
    payment_date: new Date(Date.parse(addDays(today, -daysAgo))).toISOString(),
    notes: 'Demo data',
    ...extra,
  }
  const payment = must(`payment ${ref}`, await db.from('payments').insert(row).select('id').single()) as { id: string }
  // receipt_number comes from the auto_generate_receipt_number trigger.
  must(`receipt ${ref}`, await db.from('receipts').insert({
    payment_id: payment.id, member_id: memberId, amount, payment_method: method, purpose,
    receipt_date: row.payment_date,
  }))
  return payment.id
}

async function seed(authIds: Record<string, string>) {
  const memberId: Record<string, string> = {}
  const accountFor = Object.fromEntries(ACCOUNTS.map(a => [a.memberKey, a.key]))

  for (const m of MEMBERS) {
    const row = {
      // membership_id comes from the auto_generate_membership_id trigger.
      member_class: m.business ? 'Business' : 'Personal',
      business_name: m.business ?? null,
      current_level: m.level,
      first_name: m.first,
      last_name: m.last,
      primary_email: m.email,
      primary_phone: m.phone,
      address_line_1: '100 Demo Street',
      city: m.city,
      state: 'FL',
      zip: '32256',
      member_since: `${m.memberSinceYear}-01-01`,
      auth_user_id: accountFor[m.key] ? authIds[accountFor[m.key]] : null,
      is_test_account: false,
    }
    const created = must(`member ${m.key}`, await db.from('members').insert(row).select('id').single()) as { id: string }
    memberId[m.key] = created.id

    if (m.family?.length) {
      must(`family ${m.key}`, await db.from('family_members').insert(m.family.map(f => ({
        member_id: created.id, relationship: f.relationship, first_name: f.first, last_name: f.last,
        child_order: f.relationship === 'Child' ? f.childOrder : null,
      }))))
    }

    const ms = membershipFor(m, today)
    let paymentId: string | null = null
    if (ms.amount > 0 && m.status !== 'Pending') {
      paymentId = await insertPayment(created.id, `ms_${m.key}`, ms.amount, m.level === 'Lifetime' ? 'Check' : 'Stripe', 'Membership', m.status === 'Expired' ? 300 : 60)
    }
    must(`membership ${m.key}`, await db.from('memberships').insert({ member_id: created.id, ...ms, payment_id: paymentId }))
  }

  const eventId: Record<string, string> = {}
  for (const e of EVENTS) {
    const created = must(`event ${e.key}`, await db.from('events').insert({
      event_name: e.name, short_description: e.short, description: `${e.short}\n\nThis is demo data on the dev site.`,
      event_date: addDays(today, e.inDays), event_time: e.time, location: 'HSNEF Temple main hall',
      category: e.category, status: e.status, is_payable: e.payable,
      member_price: e.memberPrice ?? null, non_member_price: e.nonMemberPrice ?? null, price_per_person: e.memberPrice ?? null,
      max_capacity: e.capacity ?? null, registration_required: true, rsvp_enabled: true,
      created_by: authIds.admin, is_test_event: false,
    }).select('id').single()) as { id: string }
    eventId[e.key] = created.id
  }

  for (const [i, r] of REGISTRATIONS.entries()) {
    const ev = EVENTS.find(e => e.key === r.eventKey)!
    const total = r.primary + r.family + r.guest
    let paymentId: string | null = null
    let paid: number | null = null
    if (r.pay && ev.memberPrice) {
      paid = ev.memberPrice * total
      paymentId = await insertPayment(memberId[r.memberKey], `ev_${i}`, paid, r.pay.method, 'Event', 5)
    }
    must(`registration ${i}`, await db.from('event_registrations').insert({
      event_id: eventId[r.eventKey], member_id: memberId[r.memberKey],
      primary_attendee_count: r.primary, family_attendee_count: r.family, guest_attendee_count: r.guest,
      total_attendees: total, payment_id: paymentId, amount_paid: paid, attended: ev.status === 'Completed',
    }))
  }

  const services = must('services', await db.from('services').select('id, name, display_name, price_member_temple, price_member_external')
    .eq('is_active', true).not('price_member_temple', 'is', null).order('display_order').limit(3)) as Array<{ id: string; name: string; display_name: string | null; price_member_temple: number; price_member_external: number | null }>
  const purohits = must('purohits', await db.from('purohits').select('id, name').eq('is_active', true).order('display_order')) as Array<{ id: string; name: string }>
  if (services.length < 3) throw new Error(`need 3 active priced services on dev-mp, found ${services.length}`)

  const managerName = `${MEMBERS.find(m => m.key === 'manager')!.first} ${MEMBERS.find(m => m.key === 'manager')!.last}`
  for (const b of BOOKINGS) {
    const m = b.memberKey ? MEMBERS.find(x => x.key === b.memberKey)! : null
    const items = b.items.map(it => {
      const s = services[it.service]
      const price = Number(it.location === 'External' ? (s.price_member_external ?? s.price_member_temple) : s.price_member_temple)
      const p = it.purohit !== undefined ? purohits[it.purohit] : undefined
      return { s, it, price, p }
    })
    const total = items.reduce((sum, x) => sum + x.price, 0)
    const reviewed = b.status !== 'Pending Approval' && b.status !== 'Cancelled'
    const paidLike = b.status === 'Paid' || b.status === 'Completed'
    const mid = b.memberKey ? memberId[b.memberKey] : memberId.admin // walk-ins are paid against the office's record
    const paymentId = paidLike ? await insertPayment(mid, b.number.toLowerCase(), total, b.walkIn ? 'Cash' : 'Stripe', 'Service', 2) : null

    const booking = must(`booking ${b.number}`, await db.from('service_bookings').insert({
      booking_number: b.number,
      member_id: b.memberKey ? memberId[b.memberKey] : null,
      requester_name: m ? `${m.first} ${m.last}` : 'Walk-in visitor (demo)',
      requester_phone: m?.phone ?? '904-555-0199',
      requester_email: m?.email ?? 'demo.walkin@example.com',
      total_amount: total,
      status: b.status,
      notes: b.notes ?? null,
      is_walk_in: b.walkIn ?? false,
      reviewed_at: reviewed ? new Date().toISOString() : null,
      reviewed_by: reviewed ? authIds.manager : null,
      reviewed_by_name: reviewed ? managerName : null,
      approval_notes: reviewed && b.status !== 'Rejected' ? 'Approved (demo).' : null,
      rejection_reason: b.rejection ?? null,
      payment_id: paymentId,
      paid_at: paidLike ? new Date().toISOString() : null,
      completed_at: b.status === 'Completed' ? new Date().toISOString() : null,
      created_by: b.walkIn ? authIds.staff : null,
    }).select('id').single()) as { id: string }

    must(`booking items ${b.number}`, await db.from('service_booking_items').insert(items.map(({ s, it, price, p }) => ({
      booking_id: booking.id, service_id: s.id, service_name: s.display_name ?? s.name,
      service_date: addDays(today, it.inDays), service_time: '10:00', location_type: it.location,
      service_address: it.location === 'External' ? '100 Demo Street, Jacksonville, FL 32256' : null,
      purohit_id: p?.id ?? null, purohit_name: p?.name ?? null, item_amount: price,
    }))))
  }

  for (const [i, r] of REQUESTS.entries()) {
    const m = MEMBERS.find(x => x.key === r.memberKey)!
    // request_number comes from the auto_generate_request_number trigger.
    const req = must(`request ${i}`, await db.from('requests').insert({
      member_id: memberId[r.memberKey], contact_email: m.email, contact_name: `${m.first} ${m.last}`,
      purpose: r.purpose, description: r.description, amount: r.amount, status: r.status,
      due_date: addDays(today, r.dueInDays), sent_at: r.status === 'Draft' ? null : new Date().toISOString(),
      created_by: authIds.staff,
    }).select('id').single()) as { id: string }
    if (r.status === 'Paid') await insertPayment(memberId[r.memberKey], `rq_${i}`, r.amount, 'Check', 'Request', 4, { request_id: req.id })
  }

  for (const [i, d] of DONATIONS.entries()) {
    await insertPayment(memberId[d.memberKey], `dn_${i}`, d.amount, d.method, 'Donation', d.daysAgo, d.check ? { check_number: d.check } : {})
  }
}

async function main() {
  console.log(`Seeding demo data on dev-mp (${url})`)
  const removed = await reset()
  console.log(`  reset: removed ${removed.members} previous demo members and their records`)
  const authIds = await ensureAccounts()
  await seed(authIds)
  const count = async (t: string) => (await db.from(t).select('*', { count: 'exact', head: true })).count
  console.log('  seeded:', {
    members: MEMBERS.length, events: EVENTS.length, registrations: REGISTRATIONS.length,
    bookings: BOOKINGS.length, requests: REQUESTS.length,
  })
  console.log('  table totals now:', {
    members: await count('members'), payments: await count('payments'), receipts: await count('receipts'),
  })
  console.log('\nDemo sign-ins (no email needed):')
  for (const a of ACCOUNTS) console.log(`  npm run dev:signin -- ${a.key.padEnd(8)} ${a.email.padEnd(26)} ${a.roles.join(', ')}`)
}

main().catch(err => {
  console.error(`\nSeed failed: ${err instanceof Error ? err.message : err}`)
  console.error('Re-running is safe: the next run resets demo rows first.')
  process.exit(1)
})
