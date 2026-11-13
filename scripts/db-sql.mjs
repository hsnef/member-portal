#!/usr/bin/env node
/**
 * Run a migration or a database test file against a Supabase project, through
 * the Management API (needs SUPABASE_ACCESS_TOKEN in .env.local).
 *
 *   npm run db:sql -- test  <ref> supabase/tests/x.sql
 *   npm run db:sql -- apply <ref> supabase/migrations/x.sql
 *
 * test  runs the file inside BEGIN ... ROLLBACK, so it leaves nothing behind,
 *       and refuses the production project outright.
 * apply runs the file inside BEGIN ... COMMIT. On production it also needs
 *       --confirm-production (production is an approval gate; Sujit runs it).
 *
 * Project refs: docs/SUPABASE-PROJECTS.md.
 */
import { readFileSync } from 'node:fs'

const PROD = 'gapvsdrzavjaublwkqfm'
const [mode, ref, file] = process.argv.slice(2)
const usage = 'usage: db-sql.mjs <test|apply> <project ref> <file.sql> [--confirm-production]'

if (!['test', 'apply'].includes(mode) || !ref || !file) {
  console.error(usage)
  process.exit(2)
}
if (ref === PROD && mode === 'test') {
  console.error('Refusing to run tests against production.')
  process.exit(2)
}
if (ref === PROD && !process.argv.includes('--confirm-production')) {
  console.error('Production needs --confirm-production.')
  process.exit(2)
}
if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN is not set (.env.local).')
  process.exit(2)
}

const body = readFileSync(file, 'utf8')
const query = mode === 'test' ? `begin;\n${body}\nrollback;` : `begin;\n${body}\ncommit;`

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})
const out = await res.json().catch(() => null)
if (!res.ok) {
  console.error(`${mode} FAILED on ${ref}: ${res.status}`)
  console.error(out?.message ?? JSON.stringify(out))
  process.exitCode = 1
} else {
  console.log(`${mode} ok on ${ref}: ${file}`)
  if (Array.isArray(out) && out.length) console.log(JSON.stringify(out))
}
