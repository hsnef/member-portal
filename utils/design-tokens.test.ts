import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * `CLAUDE.md` rule 3: colour comes from tokens, never a hex literal in
 * `className`. The design-system port was recorded as complete while 12 hex
 * literals were still in place across 8 files, so the rule needs something that
 * checks it rather than a note saying it was done.
 *
 * Four of those twelve were also dead CSS — `hover:from-…`/`hover:to-…` are
 * gradient utilities, and they sat on solid `bg-kumkum` buttons with no
 * `bg-gradient-*` class, so nothing consumed them and the buttons had no hover
 * state at all.
 */

const ROOTS = ['app', 'components']

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const sourceFiles = ROOTS.flatMap(walk)
  .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
  .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))

function offenders(pattern: RegExp) {
  const hits: string[] = []
  for (const file of sourceFiles) {
    const src = readFileSync(file, 'utf8')
    src.split('\n').forEach((line, i) => {
      if (pattern.test(line)) hits.push(`${file.replace(/\\/g, '/')}:${i + 1}`)
      pattern.lastIndex = 0
    })
  }
  return hits
}

describe('colour tokens (CLAUDE.md rule 3)', () => {
  it('scans a realistic number of files', () => {
    // If this collapses, the walk broke and the checks below prove nothing.
    expect(sourceFiles.length).toBeGreaterThan(50)
  })

  it('has no Tailwind arbitrary hex colour anywhere in app/ or components/', () => {
    // e.g. `hover:text-[#FF8800]`. Use a token: saffron, saffron-hover,
    // kumkum, ink, line ... see app/globals.css.
    expect(offenders(/\[#[0-9A-Fa-f]{6}\]/)).toEqual([])
  })

  it('keeps the two legacy brand colours at zero', () => {
    // Named explicitly in CLAUDE.md. lib/themes/themes/built-in/default.ts is
    // the deliberate exception -- it IS the legacy palette -- and is not scanned
    // here because this only walks app/ and components/.
    expect(offenders(/#(FF9933|E68A2E)/i)).toEqual([])
  })

  it('never puts a gradient stop on an element with no gradient', () => {
    // The bug that made four buttons hover-dead. `from-`/`to-` only render
    // alongside `bg-gradient-*`.
    const broken: string[] = []
    for (const file of sourceFiles) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/className="([^"]*)"/g)) {
        const cls = m[1]
        const hasStop = /(^|\s|:)(from|to)-/.test(cls)
        const hasGradient = cls.includes('bg-gradient')
        if (hasStop && !hasGradient) broken.push(`${file.replace(/\\/g, '/')} :: ${cls.slice(0, 70)}`)
      }
    }
    expect(broken).toEqual([])
  })
})
