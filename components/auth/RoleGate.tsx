'use client';

import React from 'react';
import { LockKeyholeIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { PageLoading } from '../ui/Skeleton';
import { StatusScreen } from '../ui/StatusScreen';
import { Button } from '../ui/Button';
import { AppLink } from '../nav/Nav';
import { useAuth } from '@/lib/auth/AuthContext';
import type { UserRole } from '@/types/database';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CANONICAL ROLE PATTERNS
 * ─────────────────────────────────────────────────────────────────────────────
 * There are exactly three, and no page should invent a fourth:
 *
 *  1. RouteGuard   — the whole route requires a role. Wraps the page.
 *                    (= `ProtectedRoute` in the target repo, restyled.)
 *  2. RoleGate     — one region of a page requires a role. Hides or explains.
 *  3. useAuth()    — inline `hasRole` / `hasAnyRole` for a single button or
 *                    column. Use only when a whole region isn't being gated.
 *
 * Roles are an ARRAY. A user can hold several. Never compare a single "role"
 * field — always ask `hasRole` / `hasAnyRole`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface RouteGuardProps {
  /** Any one of these grants access. Omit to require only authentication. */
  roles?: UserRole[];
  loading?: boolean;
  children: React.ReactNode;
}

export function RouteGuard({ roles, loading = false, children }: RouteGuardProps) {
  const { hasAnyRole } = useAuth();

  if (loading) return <PageLoading label="Checking your access…" />;

  if (roles && !hasAnyRole(roles)) {
    return (
      <StatusScreen
        icon={LockKeyholeIcon}
        tone="danger"
        eyebrow="Access denied"
        title="You don't have access to this page"
        description={`This page is limited to ${formatRoles(roles)}. If you need it for your work at the temple, an Admin can grant the role.`}
        actions={
        <>
            <AppLink to="/member">
              <Button size="lg">Go to my portal</Button>
            </AppLink>
            <a href="mailto:office@hsnef.org">
              <Button size="lg" variant="secondary">
                Request access
              </Button>
            </a>
          </>
        } />);


  }

  return <>{children}</>;
}

interface RoleGateProps {
  roles: UserRole[];
  children: React.ReactNode;
  /**
   * What to show when the user lacks the role.
   *  - 'hide'    — render nothing (default; use when the absence isn't confusing)
   *  - 'explain' — render a short note saying which role is needed
   *  - a node    — render that instead
   */
  fallback?: 'hide' | 'explain' | React.ReactNode;
}

export function RoleGate({ roles, children, fallback = 'hide' }: RoleGateProps) {
  const { hasAnyRole } = useAuth();
  if (hasAnyRole(roles)) return <>{children}</>;
  if (fallback === 'hide') return null;
  if (fallback === 'explain') return <PermissionNote roles={roles} />;
  return <>{fallback}</>;
}

/** Inline "you can't do this, and here's why" — never a dead disabled button. */
export function PermissionNote({ roles }: {roles: UserRole[];}) {
  return (
    <p className="flex items-start gap-2.5 rounded-xl bg-surface-sunk px-4 py-3 text-[13.5px] leading-snug text-ink-3">
      <LockKeyholeIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Requires the {formatRoles(roles)} role.</span>
    </p>);

}

/** A whole card the user can see but not act on. */
export function PermissionDenied({
  roles,
  title = 'Restricted section',
  description




}: {roles: UserRole[];title?: string;description?: string;}) {
  return (
    <Card tone="sunk" className="text-center">
      <span
        aria-hidden="true"
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-t-full rounded-b-xl bg-neutral-soft text-neutral">
        
        <LockKeyholeIcon className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <h3 className="mt-4 font-serif text-[21px] leading-tight text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-ink-2">
        {description ?? `Only ${formatRoles(roles)} can view this.`}
      </p>
    </Card>);

}

function formatRoles(roles: UserRole[]): string {
  if (roles.length === 1) return roles[0];
  return `${roles.slice(0, -1).join(', ')} or ${roles[roles.length - 1]}`;
}