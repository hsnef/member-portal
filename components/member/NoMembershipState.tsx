'use client'

/**
 * Shown on a /member route when the signed-in account has no member record.
 *
 * Signing in and having a membership are separate things: `user_roles` and the
 * `members` table are independent, and an account can hold neither. When that
 * happened, most member routes had no guard at all — they rendered their normal
 * layout against a null member, which meant empty lists, and in one case a
 * query built from an empty-string id that PostgREST rejected outright.
 *
 * Three routes did handle it, each with its own wording. This is that state,
 * said once, with a way out of it: the office is the only party that can create
 * the membership, so the page says so and offers to email them — and offers
 * sign-out, because the other reason to land here is being signed in as the
 * wrong account.
 */

import Link from 'next/link'
import { UserXIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/AuthContext'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'
import { STAFF_ROLES } from '@/lib/navigation'

interface NoMembershipStateProps {
  /** What the member cannot see, e.g. "no payments to show". Keep it short. */
  detail?: string
}

export function NoMembershipState({ detail }: NoMembershipStateProps) {
  const { signOut, hasAnyRole } = useAuth()
  // Staff accounts need not have a membership: they ARE the office. Telling
  // them to email the office is a dead end, so they get a way to their console.
  const isStaff = hasAnyRole(STAFF_ROLES)

  return (
    <EmptyState
      icon={UserXIcon}
      title="No membership found"
      description={
        `Your account is not linked to a membership${detail ? `, so there is ${detail}` : ''}. ` +
        'The temple office creates memberships — once yours exists, it links to this account automatically the next time you sign in.'
      }
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isStaff && (
            <Link href="/admin">
              <Button>Go to the office console</Button>
            </Link>
          )}
          <a href={`mailto:${TEMPLE_CONFIG.contact.email}`}>
            <Button variant={isStaff ? 'secondary' : undefined}>Email the office</Button>
          </a>
          <Button variant="secondary" onClick={() => signOut()}>
            Sign in as someone else
          </Button>
        </div>
      }
    />
  )
}
