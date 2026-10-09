import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Guards the most expensive mistake available in this repo: treating
 * `gapvsdrzavjaublwkqfm` as the dev database. It is PRODUCTION, and local
 * development uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses every RLS policy.
 *
 * The confusion is structural, not careless. Until 2026-09-02 one Supabase
 * project served every environment. The split made a NEW project dev and left
 * the existing one as production, so the old ref legitimately meant "dev" in
 * everything written before that date.
 *
 * These checks are deliberately narrow. A first attempt flagged any line holding
 * both the production ref and the word "dev", which failed on all seven lines
 * that *explain* the trap — correct prose, every one. A guard that cries wolf
 * gets switched off, so this now only asserts things that cannot be argued with:
 * where a value is actually assigned, and whether a file states which is which.
 *
 * `docs/SUPABASE-PROJECTS.md` is the single source of truth.
 */

const PROD_REF = 'gapvsdrzavjaublwkqfm'
const DEV_REF = 'bcujsesgrzijyisvmnwm'
const CANONICAL = 'docs/SUPABASE-PROJECTS.md'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (entry === 'node_modules' || entry === '.next' || entry === 'design-kit') return []
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const docs = [...walk('docs'), 'CLAUDE.md', '.env.local.example'].filter(
  (f) => f.endsWith('.md') || f.endsWith('.example')
)

const read = (f: string) => readFileSync(f, 'utf8')
const clean = (f: string) => f.replace(/\\/g, '/')

/** Openly marked as historical, or carrying the post-split warning. */
function isMarked(text: string): boolean {
  return /Historical|not current state|separate databases since|predates the/i.test(
    text.slice(0, 2500)
  )
}

describe('Supabase project references', () => {
  it('the canonical page names both projects and says which is which', () => {
    const page = read(CANONICAL)

    expect(page).toContain(PROD_REF)
    expect(page).toContain(DEV_REF)
    expect(page).toMatch(/gapvsdrzavjaublwkqfm` is PRODUCTION/)
  })

  it('scans a realistic number of docs', () => {
    expect(docs.length).toBeGreaterThan(40)
  })

  it('.env.local.example points at dev, never production', () => {
    // The file people copy. If this is wrong, a new developer writes to live
    // member data on their first run.
    const line = read('.env.local.example')
      .split('\n')
      .find((l) => l.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL='))

    expect(line, 'NEXT_PUBLIC_SUPABASE_URL missing from .env.local.example').toBeDefined()
    expect(line).toContain(DEV_REF)
    expect(line).not.toContain(PROD_REF)
  })

  it('no unmarked doc tells you to set the URL to the production project', () => {
    // An assignment is unambiguous in a way prose is not: `NEXT_PUBLIC_SUPABASE_URL=
    // https://<prod>` is an instruction, and following it points you at production.
    // Files carrying the historical or post-split banner are exempt; the banner
    // is what makes them safe to read.
    const offenders: string[] = []
    for (const file of docs) {
      const text = read(file)
      if (isMarked(text)) continue
      text.split('\n').forEach((line, i) => {
        if (/NEXT_PUBLIC_SUPABASE_URL\s*=\s*\S*/.test(line) && line.includes(PROD_REF)) {
          offenders.push(`${clean(file)}:${i + 1}`)
        }
      })
    }

    expect(offenders, `${PROD_REF} is PRODUCTION. See ${CANONICAL}.`).toEqual([])
  })

  it('any doc naming the production ref also says it is production', () => {
    // File-level, not line-level, so prose explaining the trap passes. What this
    // catches is a bare table row or config snippet that names the ref and never
    // says what it is -- the exact shape of the wrong rows found on 2026-09-03.
    const offenders: string[] = []
    for (const file of docs) {
      const text = read(file)
      if (!text.includes(PROD_REF)) continue
      if (isMarked(text)) continue
      const explains =
        /\bPRODUCTION\b/.test(text) ||
        /\bprod-mp\b/.test(text) ||
        text.includes('SUPABASE-PROJECTS.md')
      if (!explains) offenders.push(clean(file))
    }

    expect(
      offenders,
      `these name ${PROD_REF} without saying it is production, and without linking ${CANONICAL}`
    ).toEqual([])
  })
})
