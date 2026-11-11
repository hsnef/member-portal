import { describe, expect, it } from 'vitest'
import { exactIlike, normaliseEmail } from './memberEmail'

describe('normaliseEmail', () => {
  it('lower-cases and trims, so case never decides a match', () => {
    expect(normaliseEmail('  Anika.Rao@Gmail.COM ')).toBe('anika.rao@gmail.com')
  })

  it('rejects non-addresses and non-strings', () => {
    for (const bad of ['', 'no-at-sign', 'a@', '@b.org', 'a b@c.org', 'a@b@c.org', null, undefined, 42, {}]) {
      expect(normaliseEmail(bad), String(bad)).toBe('')
    }
  })
})

describe('exactIlike', () => {
  it('leaves an ordinary address alone', () => {
    expect(exactIlike('anika.rao@gmail.com')).toBe('anika.rao@gmail.com')
  })

  it('escapes ilike wildcards, so "_" and "%" match only themselves', () => {
    expect(exactIlike('a_b@x.org')).toBe('a\\_b@x.org')
    expect(exactIlike('100%@x.org')).toBe('100\\%@x.org')
  })

  it('escapes the escape character first-class', () => {
    expect(exactIlike('a\\b@x.org')).toBe('a\\\\b@x.org')
  })

  it('a pattern built from it matches the address and nothing wider', () => {
    // Model of Postgres ILIKE with backslash escapes, enough to prove the point.
    const ilike = (value: string, pattern: string) => {
      let re = ''
      for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i]
        if (c === '\\') re += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        else if (c === '%') re += '.*'
        else if (c === '_') re += '.'
        else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
      return new RegExp(`^${re}$`, 'i').test(value)
    }
    const p = exactIlike('a_b@x.org')
    expect(ilike('a_b@x.org', p)).toBe(true)
    expect(ilike('A_B@X.ORG', p)).toBe(true)
    expect(ilike('axb@x.org', p)).toBe(false)
  })
})
