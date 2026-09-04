import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Guards the bug class that shipped in `/admin/test-accounts`: a Supabase auth
 * call whose `redirectTo` pointed at `/auth/reset-password`, a route that did
 * not exist. The email sent fine and the link 404'd, so nothing failed loudly
 * and nothing in the build or type check could see it.
 *
 * These read the source rather than render it — no jsdom needed.
 */

const APP = 'app'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const sourceFiles = walk(APP)
  .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
  .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))

/**
 * Source with comments removed. Without this the checks below match their own
 * explanatory prose — both of these tests failed on exactly that first.
 */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

/** Every routable path, from the file that defines it. */
const routes = new Set(
  sourceFiles
    .filter((f) => /[\\/](page|route)\.tsx?$/.test(f))
    .map((f) =>
      f
        .replace(/\\/g, '/')
        .replace(/^app/, '')
        .replace(/\/(page|route)\.tsx?$/, '')
        .replace(/\/\([^)]+\)/g, '') // route groups are not URL segments
        || '/'
    )
)

/** `emailRedirectTo`/`redirectTo` targets written as `${...origin}/some/path`. */
function redirectTargets() {
  const found: { file: string; path: string }[] = []
  for (const file of sourceFiles) {
    const src = code(file)
    const re = /(?:emailRedirectTo|redirectTo):\s*`\$\{[^}]*origin\}(\/[A-Za-z0-9\-_/]*)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      found.push({ file: file.replace(/\\/g, '/'), path: m[1] })
    }
  }
  return found
}

describe('auth redirect targets', () => {
  it('finds the redirects it is meant to be checking', () => {
    // If this drops to zero the regex has rotted and the suite is asserting nothing.
    expect(redirectTargets().length).toBeGreaterThan(0)
  })

  it('every redirect target resolves to a real route', () => {
    const broken = redirectTargets().filter((t) => !routes.has(t.path))

    expect(
      broken.map((b) => `${b.file} -> ${b.path}`),
      'a redirect points at a route that does not exist; the emailed link will 404'
    ).toEqual([])
  })
})

describe('sign-in is magic link or Google only', () => {
  // Decided 2026-09-03. The login page has no password field; registration no
  // longer sets a password nothing can use.
  it('no page or component calls signInWithPassword', () => {
    const offenders = sourceFiles.filter((f) => code(f).includes('signInWithPassword'))

    expect(offenders.map((f) => f.replace(/\\/g, '/'))).toEqual([])
  })

  it('registration does not create a password account', () => {
    const register = code(join(APP, 'register', 'page.tsx'))

    expect(register).not.toContain('auth.signUp')
    expect(register).not.toContain('type="password"')
  })
})
