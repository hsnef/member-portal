import { describe, expect, it } from 'vitest'
import {
  REFERENCE_ALPHABET,
  compareReceived,
  findReferenceCode,
  generateReferenceCode,
  guessCsvMapping,
  matchBankRows,
  parseCsv,
  parseZelleSettings,
  readBankRows,
  validateZelleSettings,
  zelleIsReady,
  DEFAULT_ZELLE_SETTINGS,
  type MatchableRequest,
} from './index'

describe('reference codes', () => {
  it('are HSNEF- and six characters a person cannot misread', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferenceCode()
      expect(code).toMatch(/^HSNEF-[A-Z2-9]{6}$/)
      expect(code.slice(6)).not.toMatch(/[01ILO]/)
    }
    expect(REFERENCE_ALPHABET).not.toMatch(/[01ILO]/)
  })

  it('are found in a memo however the member typed them', () => {
    expect(findReferenceCode('Temple HSNEF-7K3Q9P thanks')).toBe('HSNEF-7K3Q9P')
    expect(findReferenceCode('hsnef 7k3q9p')).toBe('HSNEF-7K3Q9P')
    expect(findReferenceCode('HSNEF_7K3Q9P')).toBe('HSNEF-7K3Q9P')
    expect(findReferenceCode('donation for diwali')).toBeNull()
    expect(findReferenceCode('HSNEF-7K3Q9PX')).toBeNull() // not a code: too long
  })
})

describe('settings', () => {
  const row = (setting_key: string, setting_value: unknown) => ({ setting_key, setting_value })

  it('reads the portal_settings shapes, with defaults for anything missing or out of range', () => {
    const s = parseZelleSettings([
      row('zelle_enabled', { enabled: true }),
      row('zelle_email', { value: ' treasurer@hsnef.org ' }),
      row('zelle_expiry_days', { value: 10 }),
      row('zelle_reminder_days', { value: -2 }),
    ])
    expect(s).toMatchObject({ enabled: true, email: 'treasurer@hsnef.org', expiryDays: 10, reminderDays: 3 })
  })

  it('is only offered when switched on and there is somewhere to send money', () => {
    expect(zelleIsReady({ enabled: true, email: '', phone: '' })).toBe(false)
    expect(zelleIsReady({ enabled: false, email: 'a@b.org', phone: '' })).toBe(false)
    expect(zelleIsReady({ enabled: true, email: '', phone: '9042687630' })).toBe(true)
  })

  it('refuses settings that would not work', () => {
    const ok = { ...DEFAULT_ZELLE_SETTINGS, enabled: true, email: 'treasurer@hsnef.org' }
    expect(validateZelleSettings(ok)).toEqual([])
    expect(validateZelleSettings({ ...ok, email: '', phone: '' })).toContainEqual(expect.stringMatching(/before switching Zelle on/))
    expect(validateZelleSettings({ ...ok, phone: '12345' })).toContainEqual(expect.stringMatching(/10 digits/))
    expect(validateZelleSettings({ ...ok, reminderDays: 7, expiryDays: 7 })).toContainEqual(expect.stringMatching(/after the reminder/))
  })
})

describe('compareReceived', () => {
  it('names exact, short and over, to the cent', () => {
    expect(compareReceived(51, 51)).toEqual({ kind: 'exact' })
    expect(compareReceived(51, 50.99)).toEqual({ kind: 'short', balance: 0.01 })
    expect(compareReceived(101, 151)).toEqual({ kind: 'over', extra: 50 })
    expect(compareReceived(0.3, 0.1 + 0.2)).toEqual({ kind: 'exact' }) // no floating-point surprise
  })
})

describe('bank file', () => {
  const csv = [
    'Posting Date,Description,Amount,Sender Name,Memo',
    '11/12/2026,"Zelle from RAO, ASHA",51.00,ASHA RAO,"HSNEF-7K3Q9P"',
    '11/12/2026,Zelle from GUPTA VIKRAM,101.00,VIKRAM GUPTA,membership',
    '11/13/2026,Electric bill,-120.50,FPL,autopay',
    '11/13/2026,Zelle from UNKNOWN,25.00,J DOE,',
    '11/13/2026,Zelle from UNKNOWN,25.00,J DOE,',
  ].join('\r\n')

  const table = parseCsv(csv)
  const mapping = { date: 'Posting Date', amount: 'Amount', memo: 'Memo', sender: 'Sender Name' }

  it('parses quoted fields and guesses the columns', () => {
    expect(table[1][1]).toBe('Zelle from RAO, ASHA')
    expect(guessCsvMapping(table[0])).toMatchObject({ date: 'Posting Date', amount: 'Amount', memo: 'Memo', sender: 'Sender Name' })
  })

  it('keeps money in only, and tells identical same-day transfers apart', () => {
    const rows = readBankRows(table, mapping)
    expect(rows.map((r) => r.amount)).toEqual([51, 101, 25, 25])
    expect(rows[0].postedOn).toBe('2026-11-12')
    expect(rows[2].hash).not.toBe(rows[3].hash)
    expect(readBankRows(table, mapping)[0].hash).toBe(rows[0].hash) // same file, same ids
  })

  it('matches by code and amount owed; suggests by amount and name; leaves the rest', () => {
    const open: MatchableRequest[] = [
      { id: 'a', reference_code: 'HSNEF-7K3Q9P', amount_due: 51, received: 0, memberName: 'Asha Rao' },
      { id: 'b', reference_code: 'HSNEF-ABCDEF', amount_due: 101, received: 0, memberName: 'Vikram Gupta' },
    ]
    const result = matchBankRows(readBankRows(table, mapping), open)
    expect(result.map((r) => r.kind)).toEqual(['matched', 'possible', 'unmatched', 'unmatched'])
    expect(result[0].kind === 'matched' && result[0].request.id).toBe('a')
    expect(result[1].kind === 'possible' && result[1].candidates.map((c) => c.id)).toEqual(['b'])
  })

  it('does not auto-match a code whose amount differs: a person decides', () => {
    const rows = readBankRows(table, mapping).slice(0, 1)
    const open: MatchableRequest[] = [{ id: 'a', reference_code: 'HSNEF-7K3Q9P', amount_due: 60, received: 0, memberName: 'Asha Rao' }]
    expect(matchBankRows(rows, open)[0].kind).toBe('possible')
  })

  it('refuses a file without the columns that were set up', () => {
    expect(() => readBankRows(parseCsv('Date,Value\n1/1/2026,5'), mapping)).toThrow(/columns/)
  })
})
