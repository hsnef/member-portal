/**
 * Runs before any test module is imported.
 *
 * `lib/qr-token.ts` and `lib/zelle/index.ts` both read their signing secret into
 * a module-level `const` at import time, so the value has to be in place before
 * the first import or the module falls back to its hardcoded development
 * default. Tests import these same constants to forge tokens deliberately.
 */
export const TEST_QR_SECRET = 'test-qr-secret-not-a-real-key'
export const TEST_ZELLE_SECRET = 'test-zelle-secret-not-a-real-key'

process.env.QR_TOKEN_SECRET = TEST_QR_SECRET
process.env.ZELLE_TOKEN_SECRET = TEST_ZELLE_SECRET

// Keeps URL-building helpers deterministic; several default to
// NEXT_PUBLIC_APP_URL and then to localhost.
process.env.NEXT_PUBLIC_APP_URL = 'https://member.example.org'
