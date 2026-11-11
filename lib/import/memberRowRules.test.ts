import { describe, expect, it } from 'vitest'
import { legacyMemberNumber, parseMemberClass, parseMemberLevel, parseNakshatra } from './memberRowRules'

describe('parseMemberLevel', () => {
  it('accepts the three levels in any case', () => {
    expect(parseMemberLevel('Annual')).toBe('Annual')
    expect(parseMemberLevel(' lifetime ')).toBe('Lifetime')
    expect(parseMemberLevel('COMMUNITY')).toBe('Community')
  })

  it('refuses a blank or unknown level instead of quietly making it Community', () => {
    expect(parseMemberLevel('')).toBeNull()
    expect(parseMemberLevel(undefined)).toBeNull()
    expect(parseMemberLevel('Anual')).toBeNull()
    expect(parseMemberLevel('Gold')).toBeNull()
  })
})

describe('parseMemberClass', () => {
  it('reads blank and the personal spellings as Personal', () => {
    expect(parseMemberClass('')).toBe('Personal')
    expect(parseMemberClass('Individual')).toBe('Personal')
    expect(parseMemberClass('family')).toBe('Personal')
  })

  it('reads Business and Corporate as Business', () => {
    expect(parseMemberClass('Business')).toBe('Business')
    expect(parseMemberClass('corporate')).toBe('Business')
  })

  it('refuses anything else', () => {
    expect(parseMemberClass('Temple')).toBeNull()
  })
})

describe('parseNakshatra', () => {
  it('returns the canonical spelling, ignoring case', () => {
    expect(parseNakshatra('rohini')).toBe('Rohini')
    expect(parseNakshatra('Purva Phalguni')).toBe('Purva Phalguni')
  })

  it('treats blank as none and flags an unknown star', () => {
    expect(parseNakshatra('  ')).toBeNull()
    expect(parseNakshatra('Sirius')).toBe('invalid')
  })
})

describe('legacyMemberNumber', () => {
  it('keeps whatever number the file has, as text', () => {
    expect(legacyMemberNumber(' 10000001 ')).toBe('10000001')
    expect(legacyMemberNumber('HS-0042')).toBe('HS-0042')
  })

  it('is null when the file has none', () => {
    expect(legacyMemberNumber('')).toBeNull()
  })
})
