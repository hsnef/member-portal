'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ROUTER ABSTRACTION — THE SINGLE PORT SEAM
 * ─────────────────────────────────────────────────────────────────────────────
 * Every design system component navigates through THIS file and nothing else.
 * No other file imports a router directly.
 *
 * This is the Next.js App Router implementation. The kit's original bodies were
 * written against react-router-dom; only the bodies below changed.
 *
 * `useRouteParam` is deliberately absent. In the App Router, dynamic segments
 * arrive as a `params` prop on the page, so the value is threaded down as a
 * plain prop instead of read from a hook.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AppLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: React.ReactNode;
}

export function AppLink({ to, children, ...rest }: AppLinkProps) {
  return (
    <NextLink href={to} {...rest}>
      {children}
    </NextLink>
  );
}

/** Current pathname. */
export function useActivePath(): string {
  return usePathname() ?? '';
}

/** Imperative navigation. */
export function useGoTo(): (to: string) => void {
  const router = useRouter();
  return React.useCallback((to: string) => router.push(to), [router]);
}

/**
 * Active-state matcher shared by every nav surface, so the sidebar, the mobile
 * bar and breadcrumbs all agree on what "current" means.
 */
export function isPathActive(pathname: string, to: string, exact = false): boolean {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}
