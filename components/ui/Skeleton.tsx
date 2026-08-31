import React from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className }: {className?: string;}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-xl bg-[length:1000px_100%]',
        'bg-[linear-gradient(90deg,var(--surface-sunk)_0%,var(--canvas-deep)_50%,var(--surface-sunk)_100%)]',
        className
      )} />);


}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-4 h-9 w-1/2" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
    </div>);

}

export function PageLoading({ label = 'Loading…' }: {label?: string;}) {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>);

}