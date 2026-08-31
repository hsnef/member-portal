import React from 'react';
import { cn } from '../../utils/cn';

interface TempleMarkProps {
  className?: string;
  title?: string;
}

/**
 * HSNEF mark — a torana arch enclosing a lit diya, set on a kumkum disc.
 * Built from four flat colours so it holds up at 24px and at hero scale.
 */
export function TempleMark({ className, title = 'HSNEF' }: TempleMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10', className)}
      fill="none">
      
      <circle cx="24" cy="24" r="23" fill="var(--kumkum)" />
      <circle cx="24" cy="24" r="19.5" stroke="var(--gold)" strokeWidth="0.9" opacity="0.6" />
      {/* Torana arch */}
      <path
        d="M12 34V24a12 12 0 0 1 24 0v10"
        stroke="var(--marigold)"
        strokeWidth="2.2"
        strokeLinecap="round" />
      
      {/* Flame */}
      <path
        d="M24 15.5c2.4 2.6 3.7 4.5 3.7 6.4a3.7 3.7 0 1 1-7.4 0c0-1.9 1.3-3.8 3.7-6.4Z"
        fill="var(--marigold)" />
      
      <path
        d="M24 19.5c1 1.2 1.6 2.1 1.6 3a1.6 1.6 0 1 1-3.2 0c0-.9.6-1.8 1.6-3Z"
        fill="var(--saffron)" />
      
      {/* Lamp base */}
      <path d="M15 30h18c0 3.4-4 6-9 6s-9-2.6-9-6Z" fill="var(--saffron)" />
      <path d="M13.5 30h21" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>);

}

interface BrandLockupProps {
  className?: string;
  subtitle?: string;
  compact?: boolean;
  inverse?: boolean;
}

export function BrandLockup({
  className,
  subtitle,
  compact = false,
  inverse = false
}: BrandLockupProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <TempleMark className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      <div className="leading-none">
        <p
          className={cn(
            'font-serif tracking-tight',
            compact ? 'text-[20px]' : 'text-[23px]',
            inverse ? 'text-white' : 'text-ink'
          )}>
          
          HSNEF
        </p>
        <p
          className={cn(
            'mt-1 text-[10.5px] font-bold uppercase tracking-[0.2em]',
            inverse ? 'text-white/65' : 'text-ink-3'
          )}>
          
          {subtitle ?? 'Member Portal'}
        </p>
      </div>
    </div>);

}