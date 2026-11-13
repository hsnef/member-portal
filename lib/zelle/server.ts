/**
 * Zelle on the server. Every function takes a service-role client: members and
 * staff never write to the Zelle tables themselves. Routes check WHO may call
 * (the member who owns the request, or office staff) before calling these.
 *
 * Spec: docs/architecture/payments.md ("Zelle"). Pure helpers: lib/zelle/index.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Member, ZelleRequest } from '@/types/database'
import { priceCheckout, type CheckoutItem } from '@/lib/payments/checkout'
import { settlePayment, type SettleTarget } from '@/lib/payments/settle'
import { sendEmail } from '@/lib/email/mailer'
import {
  zelleBalanceDueEmail,
  zelleExpiredEmail,
  zelleInstructionsEmail,
  zelleNotReceivedEmail,
  zelleReminderEmail,
} from '@/lib/email/templates/zelle'
import { sendOfficeAlert } from '@/lib/notify/office'
import { formatCurrency } from '@/utils/format'
import {
  compareReceived,
  daysAfter,
  generateReferenceCode,
  matchBankRows,
  parseCsv,
  parseZelleSettings,
  readBankRows,
  zelleIsReady,
  type BankMatch,
  type ZelleSettings,
} from './index'

type Client = SupabaseClient<Database>
type Fail = { ok: false; status: number; error: string }
const fail = (status: number, error: string): Fail => ({ ok: false, status, error })
const money = (n: number) => formatCurrency(n, true)
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export interface ZelleDeps {
  db: Client
  send?: typeof sendEmail
  now?: Date
}

// ---------------------------------------------------------------------------
// Settings and people
// ---------------------------------------------------------------------------

export async function readZelleSettings(db: Client): Promise<ZelleSettings> {
  const { data } = await db.from('portal_settings').select('setting_key, setting_value').like('setting_key', 'zelle_%')
  return parseZelleSettings(data ?? [])
}

type Named = Pick<Member, 'member_class' | 'first_name' | 'last_name' | 'business_name' | 'member_profile_name'>
export function memberName(m: Named | null | undefined): string {
  if (!m) return 'Member'
  if (m.member_class === 'Business') return m.business_name || 'Member'
  return m.member_profile_name || [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Member'
}

async function memberFor(db: Client, id: string) {
  const { data } = await db.from('members').select('*').eq('id', id).single()
  return data
}

async function emailMember(deps: ZelleDeps, memberId: string, build: (name: string) => { subject: string; html: string; text: string }, tag: string) {
  const member = await memberFor(deps.db, memberId)
  if (!member?.primary_email) return false
  const content = build(memberName(member))
  const sent = await (deps.send ?? sendEmail)({
    to: member.primary_email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [{ name: 'category', value: tag }],
  })
  if (!sent.success) console.error(`[zelle] ${tag} email not sent`, sent.error)
  return !!sent.success
}

/** The settlement target a request pays for. */
export function requestTarget(r: Pick<ZelleRequest, 'target_kind' | 'target_id' | 'level' | 'purpose'>): SettleTarget {
  switch (r.target_kind) {
    case 'membership':
      return { kind: 'membership', level: r.level === 'Lifetime' ? 'Lifetime' : 'Annual' }
    case 'donation':
      return r.purpose === 'Sponsorship' ? { kind: 'donation', purpose: 'Sponsorship' } : { kind: 'donation' }
    default:
      return { kind: r.target_kind, id: r.target_id as string }
  }
}

/** Release an event place held for this request. True if one was released. */
async function releaseHold(db: Client, r: Pick<ZelleRequest, 'target_kind' | 'target_id'>): Promise<boolean> {
  if (r.target_kind !== 'event_registration' || !r.target_id) return false
  const { data } = await db
    .from('event_registrations')
    .update({ status: 'Cancelled' })
    .eq('id', r.target_id)
    .eq('status', 'Pending Payment')
    .select('id')
  return (data?.length ?? 0) > 0
}

// ---------------------------------------------------------------------------
// The member
// ---------------------------------------------------------------------------

export type OpenOutcome = { ok: true; request: ZelleRequest; reused: boolean } | Fail

/**
 * Open a Zelle request for an item (or return the open one for it). The
 * amount is the item's own (priceCheckout); an event place is held.
 */
export async function openZelleRequest(
  deps: ZelleDeps,
  member: Pick<Member, 'id' | 'current_level'>,
  item: CheckoutItem,
  createdBy: string | null,
): Promise<OpenOutcome> {
  const { db } = deps
  const settings = await readZelleSettings(db)
  if (!zelleIsReady(settings)) return fail(400, 'Zelle is not available right now; please pay by card or at the office')

  const priced = await priceCheckout(db, member, item)
  if (!priced.ok) return priced
  const { checkout } = priced
  const t = checkout.target
  const targetId = 'id' in t ? t.id : null
  const level = t.kind === 'membership' ? t.level : null

  if (t.kind !== 'donation') {
    let q = db.from('zelle_requests').select('*').eq('member_id', member.id).eq('target_kind', t.kind).in('status', ['awaiting', 'sent'])
    q = targetId ? q.eq('target_id', targetId) : q.is('target_id', null)
    q = level ? q.eq('level', level) : q.is('level', null)
    const { data: existing } = await q.maybeSingle()
    if (existing) return { ok: true, request: existing, reused: true }
  }

  const now = deps.now ?? new Date()
  const purpose =
    t.kind === 'membership' ? 'Membership' : t.kind === 'booking' ? 'Service' : t.kind === 'request' ? 'Request' : t.kind === 'event_registration' ? 'Event' : t.purpose ?? 'Donation'

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db
      .from('zelle_requests')
      .insert({
        reference_code: generateReferenceCode(),
        member_id: member.id,
        target_kind: t.kind,
        target_id: targetId,
        level,
        purpose,
        description: sentenceCase(checkout.description.replace(/^HSNEF /, '')),
        notes: checkout.notes ?? null,
        amount_due: checkout.amount,
        expires_at: daysAfter(now, settings.expiryDays).toISOString(),
        created_by: createdBy,
      })
      .select('*')
      .single()
    if (data) {
      await emailMember(deps, member.id, (name) => zelleInstructionsEmail(name, data, settings), 'zelle-instructions')
      return { ok: true, request: data, reused: false }
    }
    if (error?.code !== '23505') {
      console.error('[zelle] request insert failed', error?.message)
      return fail(500, 'Could not start the Zelle payment')
    }
    // 23505: a reference code collision (try another), or the same item
    // opened twice at once (the next attempt finds the open one above).
  }
  return fail(500, 'Could not start the Zelle payment; please try again')
}

/** The member says they have sent it. The office is alerted. */
export async function markSent(deps: ZelleDeps, memberId: string, requestId: string, bankReference: string | null) {
  const { db } = deps
  const { data: req } = await db.from('zelle_requests').select('*').eq('id', requestId).maybeSingle()
  if (!req || req.member_id !== memberId) return fail(404, 'Payment not found')
  if (req.status === 'paid') return fail(409, 'This payment is already complete')
  if (!['awaiting', 'not_received', 'sent'].includes(req.status)) return fail(409, 'This request is closed; please start a new one')

  const { data: updated } = await db
    .from('zelle_requests')
    .update({
      status: 'sent',
      member_sent_at: (deps.now ?? new Date()).toISOString(),
      member_bank_reference: bankReference?.trim().slice(0, 100) || req.member_bank_reference,
      close_reason: null,
    })
    .eq('id', requestId)
    .select('*')
    .single()

  const member = await memberFor(db, memberId)
  await sendOfficeAlert(
    db,
    {
      subject: `Zelle sent: ${money(req.amount_due)} from ${memberName(member)}`,
      lines: [
        `${memberName(member)} (${member?.membership_id ?? ''}) says they have sent ${money(req.amount_due)} by Zelle for ${req.description}.`,
        `Reference ${req.reference_code}${bankReference ? `; their bank confirmation: ${bankReference}` : ''}.`,
        'Please confirm it once it shows in the bank account.',
      ],
      link: { path: '/admin/zelle', label: 'Open the Zelle queue' },
    },
    deps.send,
  )
  return { ok: true as const, request: updated ?? req }
}

/** Cancel an open request (the member's own, or by staff). Releases a held place. */
export async function cancelRequest(deps: ZelleDeps, requestId: string, by: { memberId?: string; staffId?: string }, reason?: string) {
  const { db } = deps
  const { data: req } = await db.from('zelle_requests').select('*').eq('id', requestId).maybeSingle()
  if (!req || (by.memberId && req.member_id !== by.memberId)) return fail(404, 'Payment not found')
  if (!['awaiting', 'sent', 'not_received'].includes(req.status)) return fail(409, 'This request is already closed')
  const { count } = await db.from('zelle_transfers').select('id', { count: 'exact', head: true }).eq('request_id', requestId)
  if ((count ?? 0) > 0) return fail(409, 'Money has already arrived for this request; the office needs to finish it')

  await db
    .from('zelle_requests')
    .update({
      status: 'cancelled',
      closed_at: (deps.now ?? new Date()).toISOString(),
      closed_by: by.staffId ?? null,
      close_reason: reason?.slice(0, 300) || (by.memberId ? 'Cancelled by the member' : 'Cancelled by the office'),
    })
    .eq('id', requestId)
  await releaseHold(db, req)
  return { ok: true as const }
}

// ---------------------------------------------------------------------------
// The office
// ---------------------------------------------------------------------------

export interface ReceivedInput {
  requestId: string
  amount: number
  receivedOn?: string | null
  bankReference?: string | null
  submissionId?: string | null
  bankRowHash?: string | null
  /** What to do with money beyond what was due. */
  extra?: 'donation' | 'refund'
}

export type ReceivedOutcome =
  | { ok: true; state: 'short'; received: number; balance: number }
  | { ok: true; state: 'paid'; receiptNumber: string; extra: number; extraReceipt?: string }
  | Fail

/** Record money that arrived; when the full amount is in, settle it. */
export async function recordReceived(deps: ZelleDeps, staffId: string, input: ReceivedInput): Promise<ReceivedOutcome> {
  const { db } = deps
  if (!(input.amount > 0)) return fail(400, 'Enter the amount that arrived')
  const { data: rows, error } = await db.rpc('zelle_record_transfer', {
    p_request_id: input.requestId,
    p_amount: Math.round(input.amount * 100) / 100,
    p_received_on: input.receivedOn ?? null,
    p_bank_reference: input.bankReference?.trim() || null,
    p_bank_row_hash: input.bankRowHash ?? null,
    p_submission_id: input.submissionId ?? null,
    p_staff: staffId,
  })
  if (error) return fail(409, error.message.replace(/^zelle: /, ''))
  const row = Array.isArray(rows) ? rows[0] : rows
  return finishIfPaid(deps, staffId, input.requestId, input.extra ?? 'refund', { announceShort: !row?.duplicate })
}

/**
 * Settle a request whose transfers cover what is due. Safe to repeat (the
 * settlement is keyed on the request). Also the "finish" action for a request
 * whose money is in but whose settlement failed earlier.
 */
export async function finishIfPaid(
  deps: ZelleDeps,
  staffId: string,
  requestId: string,
  extraChoice: 'donation' | 'refund',
  opts: { announceShort?: boolean } = {},
): Promise<ReceivedOutcome> {
  const { db } = deps
  const { data: req } = await db.from('zelle_requests').select('*').eq('id', requestId).single()
  if (!req) return fail(404, 'Payment not found')
  const { data: transfers } = await db.from('zelle_transfers').select('amount, received_on, bank_reference').eq('request_id', requestId)
  const received = (transfers ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
  const due = Number(req.amount_due)
  const outcome = compareReceived(due, received)

  if (outcome.kind === 'short') {
    if (opts.announceShort) {
      const settings = await readZelleSettings(db)
      await emailMember(deps, req.member_id, (name) => zelleBalanceDueEmail(name, req, settings, received, outcome.balance), 'zelle-balance')
    }
    return { ok: true, state: 'short', received, balance: outcome.balance }
  }

  const banks = (transfers ?? []).map((t) => t.bank_reference).filter(Boolean)
  let main
  try {
    main = await settlePayment(
      {
        idempotencyKey: `zelle:${req.id}`,
        memberId: req.member_id,
        method: 'Zelle',
        amount: due,
        target: requestTarget(req),
        zelleReference: [req.reference_code, ...banks].join(' / ').slice(0, 200),
        notes: req.notes ?? undefined,
        createdBy: staffId,
      },
      { db, send: deps.send },
    )
  } catch (e) {
    return fail(409, e instanceof Error ? e.message.replace(/^settle_payment failed: (settle_payment: )?/, '') : 'Could not record the payment')
  }

  let extraReceipt: string | undefined
  let closeReason: string | null = null
  if (outcome.kind === 'over') {
    if (extraChoice === 'donation') {
      const extra = await settlePayment(
        {
          idempotencyKey: `zelle:${req.id}:extra`,
          memberId: req.member_id,
          method: 'Zelle',
          amount: outcome.extra,
          target: { kind: 'donation' },
          zelleReference: req.reference_code,
          notes: `Donation - General (extra sent with ${req.reference_code})`,
          createdBy: staffId,
        },
        { db, send: deps.send },
      )
      extraReceipt = extra.receiptNumber
      closeReason = `${money(outcome.extra)} extra recorded as a donation (${extra.receiptNumber})`
    } else {
      closeReason = `${money(outcome.extra)} extra to be refunded by the office, outside the portal`
    }
  }

  await db
    .from('zelle_requests')
    .update({
      status: 'paid',
      payment_id: main.paymentId,
      closed_at: (deps.now ?? new Date()).toISOString(),
      closed_by: staffId,
      close_reason: closeReason,
    })
    .eq('id', req.id)

  return { ok: true, state: 'paid', receiptNumber: main.receiptNumber, extra: outcome.kind === 'over' ? outcome.extra : 0, extraReceipt }
}

/** The office could not find the money. The member is told and may pay again. */
export async function markNotReceived(deps: ZelleDeps, staffId: string, requestId: string, reason: string) {
  const { db } = deps
  const { data: req } = await db.from('zelle_requests').select('*').eq('id', requestId).maybeSingle()
  if (!req) return fail(404, 'Payment not found')
  if (!['awaiting', 'sent'].includes(req.status)) return fail(409, 'This request is not waiting for money')
  const { count } = await db.from('zelle_transfers').select('id', { count: 'exact', head: true }).eq('request_id', requestId)
  if ((count ?? 0) > 0) return fail(409, 'Part of this payment has arrived; record the rest or cancel it instead')
  await db
    .from('zelle_requests')
    .update({ status: 'not_received', closed_by: staffId, close_reason: reason.slice(0, 300) || null })
    .eq('id', requestId)
  await emailMember(deps, req.member_id, (name) => zelleNotReceivedEmail(name, req, reason), 'zelle-not-received')
  return { ok: true as const }
}

export interface QueueRow extends ZelleRequest {
  member_name: string
  membership_id: string
  received: number
}

/** The office queue: open requests first (member says sent, then awaiting), then recent closed ones. */
export async function listQueue(db: Client, { closedDays = 60 } = {}): Promise<QueueRow[]> {
  const since = new Date(Date.now() - closedDays * 86400000).toISOString()
  const [open, closed] = await Promise.all([
    db.from('zelle_requests').select('*').in('status', ['sent', 'awaiting', 'not_received']).order('created_at'),
    db.from('zelle_requests').select('*').in('status', ['paid', 'cancelled', 'expired']).gte('updated_at', since).order('updated_at', { ascending: false }),
  ])
  const reqs = [...(open.data ?? []), ...(closed.data ?? [])]
  if (reqs.length === 0) return []
  const ids = reqs.map((r) => r.id)
  const memberIds = [...new Set(reqs.map((r) => r.member_id))]
  const [{ data: transfers }, { data: members }] = await Promise.all([
    db.from('zelle_transfers').select('request_id, amount').in('request_id', ids),
    db.from('members').select('id, membership_id, member_class, first_name, last_name, business_name, member_profile_name').in('id', memberIds),
  ])
  return reqs.map((r) => {
    const m = members?.find((x) => x.id === r.member_id)
    return {
      ...r,
      member_name: memberName(m as Named),
      membership_id: m?.membership_id ?? '',
      received: (transfers ?? []).filter((t) => t.request_id === r.id).reduce((s, t) => s + Number(t.amount), 0),
    }
  })
}

// ---------------------------------------------------------------------------
// Every day: reminders and expiry
// ---------------------------------------------------------------------------

export interface DailyResult {
  reminded: number
  expired: number
  staleHoldsReleased: number
}

/**
 * Remind members who have not paid after `reminderDays`; expire requests not
 * paid by `expires_at` (releasing held places). A request the member says
 * they sent never expires on its own: it waits for the office. Also releases
 * event places held by a card checkout that was never completed (24h).
 */
export async function runDailyZelle(deps: ZelleDeps): Promise<DailyResult> {
  const { db } = deps
  const now = deps.now ?? new Date()
  const settings = await readZelleSettings(db)
  const result: DailyResult = { reminded: 0, expired: 0, staleHoldsReleased: 0 }

  const remindBefore = new Date(now.getTime() - settings.reminderDays * 86400000).toISOString()
  const { data: toRemind } = await db
    .from('zelle_requests')
    .select('*')
    .eq('status', 'awaiting')
    .is('reminder_sent_at', null)
    .lte('created_at', remindBefore)
    .gt('expires_at', now.toISOString())
  for (const req of toRemind ?? []) {
    await emailMember(deps, req.member_id, (name) => zelleReminderEmail(name, req, settings), 'zelle-reminder')
    await db.from('zelle_requests').update({ reminder_sent_at: now.toISOString() }).eq('id', req.id)
    result.reminded++
  }

  const { data: toExpire } = await db
    .from('zelle_requests')
    .select('*')
    .in('status', ['awaiting', 'not_received'])
    .lte('expires_at', now.toISOString())
  for (const req of toExpire ?? []) {
    await db
      .from('zelle_requests')
      .update({ status: 'expired', closed_at: now.toISOString(), close_reason: 'Not paid in time' })
      .eq('id', req.id)
    const released = await releaseHold(db, req)
    await emailMember(deps, req.member_id, (name) => zelleExpiredEmail(name, req, released), 'zelle-expired')
    result.expired++
  }

  // Card checkouts hold an event place too; one abandoned for a day is released,
  // unless a Zelle request is still holding it.
  const dayAgo = new Date(now.getTime() - 86400000).toISOString()
  const { data: stale } = await db
    .from('event_registrations')
    .select('id')
    .eq('status', 'Pending Payment')
    .lte('registered_at', dayAgo)
  for (const reg of stale ?? []) {
    const { count } = await db
      .from('zelle_requests')
      .select('id', { count: 'exact', head: true })
      .eq('target_id', reg.id)
      .in('status', ['awaiting', 'sent', 'not_received'])
    if ((count ?? 0) === 0) {
      await db.from('event_registrations').update({ status: 'Cancelled' }).eq('id', reg.id).eq('status', 'Pending Payment')
      result.staleHoldsReleased++
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// The bank's transaction file
// ---------------------------------------------------------------------------

export type AnalyzeOutcome =
  | { ok: true; matches: BankMatch[]; alreadyImported: number; headers: string[] }
  | { ok: false; status: number; error: string; headers?: string[] }

/** Read a bank file and match its rows to open requests. Changes nothing. */
export async function analyzeBankFile(db: Client, csvText: string): Promise<AnalyzeOutcome> {
  const table = parseCsv(csvText)
  if (table.length < 2) return { ok: false, status: 400, error: 'The file has no transactions' }
  const settings = await readZelleSettings(db)
  if (!settings.csvMapping) return { ok: false, status: 409, error: 'Set up the bank file columns first', headers: table[0] }

  let rows
  try {
    rows = readBankRows(table, settings.csvMapping)
  } catch (e) {
    return { ok: false, status: 400, error: (e as Error).message, headers: table[0] }
  }
  const { data: known } = await db.from('zelle_bank_rows').select('hash').in('hash', rows.map((r) => r.hash))
  const knownSet = new Set((known ?? []).map((k) => k.hash))
  const fresh = rows.filter((r) => !knownSet.has(r.hash))

  const queue = (await listQueue(db, { closedDays: 0 })).filter((r) => ['awaiting', 'sent', 'not_received', 'expired'].includes(r.status))
  const matches = matchBankRows(
    fresh,
    queue.map((r) => ({ id: r.id, reference_code: r.reference_code, amount_due: Number(r.amount_due), received: r.received, memberName: r.member_name })),
  )
  return { ok: true, matches, alreadyImported: rows.length - fresh.length, headers: table[0] }
}

export interface BankDecision {
  hash: string
  postedOn: string | null
  amount: number
  memo: string
  sender: string
  /** Confirm against this request, or null to mark the row as not ours. */
  requestId: string | null
}

/** Apply the office's decisions on a bank file. Each confirm goes through recordReceived. */
export async function applyBankDecisions(deps: ZelleDeps, staffId: string, decisions: BankDecision[]) {
  const { db } = deps
  const results: Array<{ hash: string; ok: boolean; message: string }> = []
  for (const d of decisions) {
    if (d.requestId) {
      const out = await recordReceived(deps, staffId, {
        requestId: d.requestId,
        amount: d.amount,
        receivedOn: d.postedOn,
        bankReference: d.memo || null,
        bankRowHash: d.hash,
        extra: 'refund',
      })
      if (!out.ok) {
        results.push({ hash: d.hash, ok: false, message: out.error })
        continue
      }
      await db.from('zelle_bank_rows').upsert({
        hash: d.hash, posted_on: d.postedOn, amount: d.amount, memo: d.memo, sender: d.sender,
        outcome: 'confirmed', request_id: d.requestId, imported_by: staffId,
      })
      results.push({
        hash: d.hash,
        ok: true,
        message: out.state === 'paid' ? `Paid, receipt ${out.receiptNumber}` : `Part paid, ${money(out.balance)} still due`,
      })
    } else {
      await db.from('zelle_bank_rows').upsert({
        hash: d.hash, posted_on: d.postedOn, amount: d.amount, memo: d.memo, sender: d.sender,
        outcome: 'ignored', request_id: null, imported_by: staffId,
      })
      results.push({ hash: d.hash, ok: true, message: 'Marked as not a portal payment' })
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// What a member is shown
// ---------------------------------------------------------------------------

/** Public URL of the QR image an Admin uploaded, or null. */
export function qrImageUrl(path: string): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portal-assets/${path}`
}

export interface ZelleRecipientView {
  recipientName: string
  email: string
  phone: string
  qrUrl: string | null
  instructions: string
}

export function recipientView(s: ZelleSettings): ZelleRecipientView {
  return { recipientName: s.recipientName, email: s.email, phone: s.phone, qrUrl: qrImageUrl(s.qrImagePath), instructions: s.instructions }
}

export interface ZelleRequestView {
  id: string
  referenceCode: string
  description: string
  amountDue: number
  received: number
  status: ZelleRequest['status']
  expiresAt: string
  memberSentAt: string | null
  closeReason: string | null
  targetKind: ZelleRequest['target_kind']
  targetId: string | null
}

export function requestView(r: ZelleRequest, received = 0): ZelleRequestView {
  return {
    id: r.id,
    referenceCode: r.reference_code,
    description: r.description,
    amountDue: Number(r.amount_due),
    received,
    status: r.status,
    expiresAt: r.expires_at,
    memberSentAt: r.member_sent_at,
    closeReason: r.close_reason,
    targetKind: r.target_kind,
    targetId: r.target_id,
  }
}

/** A member's requests that still need something from them, with what arrived so far. */
export async function listMemberOpen(db: Client, memberId: string): Promise<ZelleRequestView[]> {
  const { data: reqs } = await db
    .from('zelle_requests')
    .select('*')
    .eq('member_id', memberId)
    .in('status', ['awaiting', 'sent', 'not_received'])
    .order('created_at', { ascending: false })
  if (!reqs?.length) return []
  const { data: transfers } = await db.from('zelle_transfers').select('request_id, amount').in('request_id', reqs.map((r) => r.id))
  return reqs.map((r) =>
    requestView(r, (transfers ?? []).filter((t) => t.request_id === r.id).reduce((s, t) => s + Number(t.amount), 0)),
  )
}
