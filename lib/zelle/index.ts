/**
 * Zelle: the parts that need no database. Safe to import from the browser.
 *
 * Spec: docs/architecture/payments.md ("Zelle"). Server operations are in
 * lib/zelle/server.ts; tables in supabase/migrations/20261112000006_zelle.sql.
 */

// ---------------------------------------------------------------------------
// Reference codes
// ---------------------------------------------------------------------------

/** No 0/O, 1/I/L: the code is read off a screen and typed into a bank memo. */
export const REFERENCE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const REFERENCE_PREFIX = 'HSNEF-'
const REFERENCE_LENGTH = 6

/** A new reference code, e.g. HSNEF-7K3Q9P. About 887 million possibilities. */
export function generateReferenceCode(random: (n: number) => Uint8Array = randomBytes): string {
  const bytes = random(REFERENCE_LENGTH)
  let code = ''
  for (let i = 0; i < REFERENCE_LENGTH; i++) code += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length]
  return REFERENCE_PREFIX + code
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  globalThis.crypto.getRandomValues(out)
  return out
}

/** Find a reference code in a bank memo, however the member typed it. */
export function findReferenceCode(memo: string | null | undefined): string | null {
  if (!memo) return null
  const m = memo.toUpperCase().match(/HSNEF[\s\-_]*([A-HJ-NP-Z2-9]{6})(?![A-Z0-9])/)
  return m ? REFERENCE_PREFIX + m[1] : null
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface ZelleSettings {
  enabled: boolean
  email: string
  phone: string
  recipientName: string
  instructions: string
  reminderDays: number
  expiryDays: number
  qrImagePath: string
  csvMapping: CsvMapping | null
}

export const DEFAULT_ZELLE_SETTINGS: ZelleSettings = {
  enabled: false,
  email: '',
  phone: '',
  recipientName: 'Hindu Society of North East Florida',
  instructions: '',
  reminderDays: 3,
  expiryDays: 7,
  qrImagePath: '',
  csvMapping: null,
}

/** Settings from portal_settings rows ({ setting_key, setting_value }). */
export function parseZelleSettings(rows: Array<{ setting_key: string; setting_value: unknown }>): ZelleSettings {
  const v = (key: string): unknown => {
    const row = rows.find((r) => r.setting_key === key)
    const value = row?.setting_value as { value?: unknown; enabled?: unknown } | null | undefined
    if (!value || typeof value !== 'object') return undefined
    return 'enabled' in value ? value.enabled : value.value
  }
  const text = (key: string, fallback: string) => (typeof v(key) === 'string' ? (v(key) as string).trim() : fallback)
  const days = (key: string, fallback: number) => {
    const n = Number(v(key))
    return Number.isInteger(n) && n >= 1 && n <= 60 ? n : fallback
  }
  const mapping = v('zelle_csv_mapping')
  return {
    enabled: v('zelle_enabled') === true,
    email: text('zelle_email', ''),
    phone: text('zelle_phone', ''),
    recipientName: text('zelle_recipient_name', DEFAULT_ZELLE_SETTINGS.recipientName) || DEFAULT_ZELLE_SETTINGS.recipientName,
    instructions: text('zelle_instructions', ''),
    reminderDays: days('zelle_reminder_days', DEFAULT_ZELLE_SETTINGS.reminderDays),
    expiryDays: days('zelle_expiry_days', DEFAULT_ZELLE_SETTINGS.expiryDays),
    qrImagePath: text('zelle_qr_image_path', ''),
    csvMapping: isCsvMapping(mapping) ? mapping : null,
  }
}

/** Zelle is offered only when switched on AND there is somewhere to send money. */
export function zelleIsReady(s: Pick<ZelleSettings, 'enabled' | 'email' | 'phone'>): boolean {
  return s.enabled && (s.email !== '' || s.phone !== '')
}

/** Problems with settings an Admin is about to save, or [] if they are fine. */
export function validateZelleSettings(s: ZelleSettings): string[] {
  const errors: string[] = []
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) errors.push('The Zelle email address does not look right.')
  if (s.phone && s.phone.replace(/\D/g, '').length !== 10) errors.push('The Zelle phone number needs 10 digits.')
  if (s.enabled && !s.email && !s.phone) errors.push('Add a Zelle email or phone before switching Zelle on.')
  if (!(s.reminderDays >= 1)) errors.push('The reminder needs to be at least 1 day.')
  if (!(s.expiryDays > s.reminderDays)) errors.push('Requests must expire after the reminder is sent.')
  if (s.expiryDays > 60) errors.push('Requests can stay open at most 60 days.')
  return errors
}

// ---------------------------------------------------------------------------
// What arrived, against what was due
// ---------------------------------------------------------------------------

export type TransferOutcome =
  | { kind: 'exact' }
  | { kind: 'short'; balance: number }
  | { kind: 'over'; extra: number }

const cents = (n: number) => Math.round(n * 100)

export function compareReceived(due: number, received: number): TransferOutcome {
  const d = cents(due)
  const r = cents(received)
  if (r === d) return { kind: 'exact' }
  if (r < d) return { kind: 'short', balance: (d - r) / 100 }
  return { kind: 'over', extra: (r - d) / 100 }
}

/** When a request opened at `from` expires, or its reminder is due. */
export function daysAfter(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
}

// ---------------------------------------------------------------------------
// The bank's transaction file (CSV)
// ---------------------------------------------------------------------------

/** Which column (by header text) holds each field. Saved once per bank. */
export interface CsvMapping {
  date: string
  amount: string
  memo: string
  sender: string
}

function isCsvMapping(v: unknown): v is CsvMapping {
  const m = v as Record<string, unknown> | null
  return !!m && ['date', 'amount', 'memo', 'sender'].every((k) => typeof m[k] === 'string' && m[k] !== '')
}

/** Parse CSV text (quoted fields, embedded commas and quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

/** A first guess at the mapping from the header row, for the Admin to confirm. */
export function guessCsvMapping(headers: string[]): Partial<CsvMapping> {
  // Words in order of preference: "Memo" beats "Description" when both exist.
  const find = (...words: string[]) => {
    for (const w of words) {
      const hit = headers.find((h) => h.toLowerCase().includes(w))
      if (hit) return hit
    }
    return undefined
  }
  return {
    date: find('posting date', 'date', 'posted'),
    amount: find('amount', 'credit'),
    memo: find('memo', 'description', 'details', 'note'),
    sender: find('sender', 'from', 'name', 'payer'),
  }
}

export interface BankRow {
  /** Stable id for this row, so the same row in a later file is recognised. */
  hash: string
  postedOn: string | null
  amount: number
  memo: string
  sender: string
}

/** Money in only (positive amounts), with a stable hash per row. */
export function readBankRows(table: string[][], mapping: CsvMapping): BankRow[] {
  const [headers, ...rows] = table
  const col = (name: string) => headers.findIndex((h) => h.trim() === name.trim())
  const ci = { date: col(mapping.date), amount: col(mapping.amount), memo: col(mapping.memo), sender: col(mapping.sender) }
  if (Object.values(ci).some((i) => i < 0)) throw new Error('The bank file does not have the columns that were set up for it.')
  const seen = new Map<string, number>()
  const out: BankRow[] = []
  for (const r of rows) {
    const amount = parseMoney(r[ci.amount])
    if (!(amount > 0)) continue
    const postedOn = parseDate(r[ci.date])
    const memo = (r[ci.memo] ?? '').trim()
    const sender = (r[ci.sender] ?? '').trim()
    const base = [postedOn, amount.toFixed(2), memo, sender].join('|')
    // Two identical transactions on the same day are still two rows.
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    out.push({ hash: hashString(`${base}|${n}`), postedOn, amount, memo, sender })
  }
  return out
}

function parseMoney(v: string | undefined): number {
  if (!v) return NaN
  const negative = /^\s*\(.*\)\s*$/.test(v) || v.trim().startsWith('-')
  const n = Number(v.replace(/[^0-9.]/g, ''))
  return negative ? -n : n
}

function parseDate(v: string | undefined): string | null {
  if (!v) return null
  const s = v.trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  return null
}

/** cyrb53: a small, stable, non-cryptographic hash (row identity only). */
export function hashString(s: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0')
}

/** An open request, as the matcher needs it. */
export interface MatchableRequest {
  id: string
  reference_code: string
  amount_due: number
  received: number
  memberName: string
}

export type BankMatch =
  | { kind: 'matched'; row: BankRow; request: MatchableRequest }
  | { kind: 'possible'; row: BankRow; candidates: MatchableRequest[] }
  | { kind: 'unmatched'; row: BankRow }

/**
 * Matched: the memo carries an open request's code and the amount is what
 * is still owed on it. Possible: no code, but the amount owed matches and the
 * sender's name shares a word with the member's. Everything else: unmatched.
 */
export function matchBankRows(rows: BankRow[], open: MatchableRequest[]): BankMatch[] {
  const owed = (r: MatchableRequest) => Math.round((r.amount_due - r.received) * 100)
  const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1))
  return rows.map((row) => {
    const code = findReferenceCode(row.memo)
    const byCode = code ? open.find((r) => r.reference_code === code) : undefined
    if (byCode && owed(byCode) === Math.round(row.amount * 100)) return { kind: 'matched', row, request: byCode }
    if (byCode) return { kind: 'possible', row, candidates: [byCode] } // right code, other amount: a person decides
    const sender = words(row.sender)
    const candidates = open.filter(
      (r) => owed(r) === Math.round(row.amount * 100) && [...words(r.memberName)].some((w) => sender.has(w)),
    )
    return candidates.length ? { kind: 'possible', row, candidates } : { kind: 'unmatched', row }
  })
}

// ---------------------------------------------------------------------------
// Wording
// ---------------------------------------------------------------------------

export const ZELLE_STATUS_LABEL: Record<string, string> = {
  awaiting: 'Awaiting payment',
  sent: 'Member says sent',
  paid: 'Paid',
  not_received: 'Not received',
  cancelled: 'Cancelled',
  expired: 'Expired',
}
