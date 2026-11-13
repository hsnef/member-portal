/**
 * The cross-tab lock Supabase auth uses, with a ceiling on the wait.
 *
 * Supabase serialises session work (reading the session, refreshing the token)
 * across every tab of the site with a Web Lock. Its own lock waits FOREVER for
 * the lock (`acquireTimeout` -1). If the tab holding it is frozen by the
 * browser — a background tab, a laptop lid closed mid-refresh — every other
 * tab's sign-in calls hang behind it, and the portal looks stuck on loading.
 *
 * This lock keeps the serialising, but waits at most `timeoutMs`. Past that, the
 * holder is treated as dead and the lock is taken over (`steal`), so the
 * waiting tab carries on. A real holder finishes in well under a second, and
 * Supabase tolerates two near-simultaneous refreshes (refresh-token reuse
 * interval), so taking over a slow holder is safe; hanging is not.
 *
 * Supabase calls it as `lock(name, acquireTimeout, fn)`:
 *   -1 → wait (here: up to timeoutMs, then take over)
 *    0 → only if free right now, otherwise fail at once (unchanged)
 *   >0 → wait that long, then fail (unchanged; Supabase does not use it today)
 *
 * Tested in authLock.test.ts.
 */

export const AUTH_LOCK_TIMEOUT_MS = 10_000

type LockFn = <R>(name: string, acquireTimeout: number, fn: () => Promise<R>) => Promise<R>

/** The part of `navigator.locks` this needs. */
export interface LockManagerLike {
  request<R>(
    name: string,
    options: { mode: 'exclusive'; ifAvailable?: boolean; steal?: boolean; signal?: AbortSignal },
    callback: (lock: unknown) => Promise<R>
  ): Promise<R>
}

/** Same shape as Supabase's own error, which it recognises by `isAcquireTimeout`. */
export class AuthLockTimeoutError extends Error {
  readonly isAcquireTimeout = true
  constructor(name: string) {
    super(`Could not acquire auth lock "${name}"`)
  }
}

export function makeAuthLock({
  locks,
  timeoutMs = AUTH_LOCK_TIMEOUT_MS,
  onTakeover,
}: {
  locks: LockManagerLike | undefined
  timeoutMs?: number
  onTakeover?: (name: string) => void
}): LockFn {
  return async function authLock<R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
    // No Web Locks (old browser, server render): nothing to serialise against.
    if (!locks) return fn()

    if (acquireTimeout === 0) {
      return locks.request(name, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
        if (!lock) throw new AuthLockTimeoutError(name)
        return fn()
      })
    }

    const wait = acquireTimeout > 0 ? acquireTimeout : timeoutMs
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), wait)
    try {
      return await locks.request(name, { mode: 'exclusive', signal: abort.signal }, async () => {
        clearTimeout(timer)
        return fn()
      })
    } catch (error) {
      // Only a wait that ran out is handled here; an error from fn() is not.
      if (!abort.signal.aborted || (error as { name?: string })?.name !== 'AbortError') throw error
      if (acquireTimeout > 0) throw new AuthLockTimeoutError(name)
      onTakeover?.(name)
      return locks.request(name, { mode: 'exclusive', steal: true }, async () => fn())
    } finally {
      clearTimeout(timer)
    }
  }
}

/** The lock for the browser client: the real `navigator.locks`, when there is one. */
export const browserAuthLock: LockFn = makeAuthLock({
  locks:
    typeof globalThis !== 'undefined' && (globalThis as { navigator?: { locks?: LockManagerLike } }).navigator?.locks
      ? (globalThis as unknown as { navigator: { locks: LockManagerLike } }).navigator.locks
      : undefined,
  onTakeover: (name) =>
    console.warn(`[auth] Another tab held "${name}" for over ${AUTH_LOCK_TIMEOUT_MS / 1000}s; taking it over.`),
})
