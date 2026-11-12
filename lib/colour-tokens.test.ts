import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EMAIL } from '@/lib/email/theme'
import { PDF } from '@/lib/pdf/theme'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

/**
 * One palette, everywhere. The web reads app/globals.css; emails and PDFs
 * cannot read CSS, so they restate the colours. These tests fail if the
 * copies drift apart, or if the brand saffron stops being readable.
 */

const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8')
const cssVar = (name: string) => {
  const m = css.match(new RegExp(name + ':[ \\t]*(#[0-9a-fA-F]{6})'))
  if (!m) throw new Error(`${name} not found in globals.css`)
  return m[1].toLowerCase()
}
const hex = (rgb: [number, number, number]) =>
  '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('')

/** WCAG 2.x contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('brand colours', () => {
  const saffron = cssVar('--theme-accent-primary')

  it('saffron is the same on the web, in emails, in PDFs and in the temple constants', () => {
    expect(saffron).toBe('#b8530e')
    expect(EMAIL.saffron.toLowerCase()).toBe(saffron)
    expect(hex(PDF.saffron)).toBe(saffron)
    expect(TEMPLE_CONFIG.colors.primary.toLowerCase()).toBe(saffron)
  })

  it('white text on saffron and on its hover meets WCAG AA (4.5:1)', () => {
    expect(contrast('#ffffff', saffron)).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#ffffff', cssVar('--saffron-hover'))).toBeGreaterThanOrEqual(4.5)
  })

  it('the contrast check itself is right: the old saffron failed, black on white is 21', () => {
    expect(contrast('#ffffff', '#c75b12')).toBeLessThan(4.5)
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })
})
