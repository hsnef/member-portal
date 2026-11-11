/**
 * Run at most one call per key at a time; concurrent callers share it.
 *
 * AuthContext loads the member record and roles from two places that can fire
 * together on a sign-in: the initial `getSession()` and the auth-state
 * listener. Run in parallel, both asked `/api/auth/link-member` to link the
 * new member; the second found nothing left to link, answered 404, and the
 * "account belongs to nobody" check signed a brand-new member out
 * (reproduced on dev 2026-11-11). With this, the second caller waits for the
 * first load instead of starting its own.
 */
export function singleFlight<A extends unknown[]>(
  keyOf: (...args: A) => string,
  fn: (...args: A) => Promise<void>
): (...args: A) => Promise<void> {
  const inFlight = new Map<string, Promise<void>>()
  return (...args: A) => {
    const key = keyOf(...args)
    const running = inFlight.get(key)
    if (running) return running
    const p = fn(...args).finally(() => inFlight.delete(key))
    inFlight.set(key, p)
    return p
  }
}
