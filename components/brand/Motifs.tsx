import React from 'react';
import { cn } from '../../utils/cn';

/**
 * A hairline kolam border — the chalk lattice drawn at temple thresholds.
 * Used as a quiet top edge on ceremonial surfaces.
 */
export function KolamBand({ className }: {className?: string;}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 12"
      preserveAspectRatio="none"
      className={cn('h-3 w-full', className)}>
      
      <defs>
        <pattern id="kolam" width="20" height="12" patternUnits="userSpaceOnUse">
          <path
            d="M0 6 L5 1 L10 6 L15 11 L20 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.55" />
          
          <circle cx="10" cy="6" r="1.1" fill="currentColor" opacity="0.8" />
        </pattern>
      </defs>
      <rect width="120" height="12" fill="url(#kolam)" />
    </svg>);

}

/**
 * A corner mandala — a quarter rosette that sits behind page headers so
 * every screen has a faint sense of place without competing with content.
 */
export function CornerMandala({ className }: {className?: string;}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      className={cn('pointer-events-none absolute h-56 w-56', className)}
      fill="none">
      
      {[...Array(12)].map((_, index) =>
      <ellipse
        key={index}
        cx="100"
        cy="100"
        rx="16"
        ry="72"
        stroke="currentColor"
        strokeWidth="1"
        transform={`rotate(${index * 15} 100 100)`} />

      )}
      <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="1" strokeDasharray="3 7" />
    </svg>);

}

/**
 * A lit diya. Rendered live rather than as an image so the flame can flicker.
 */
export function Diya({ className }: {className?: string;}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={cn('h-8 w-8', className)} fill="none">
      <path
        className="animate-flame origin-bottom"
        d="M20 6c3.2 3.4 5 6 5 8.7a5 5 0 0 1-10 0C15 12 16.8 9.4 20 6Z"
        fill="var(--marigold)" />
      
      <path
        className="animate-flame origin-bottom"
        d="M20 11.5c1.5 1.8 2.4 3.2 2.4 4.5a2.4 2.4 0 1 1-4.8 0c0-1.3.9-2.7 2.4-4.5Z"
        fill="var(--saffron)" />
      
      <path
        d="M7 24h26c0 5-5.8 9-13 9S7 29 7 24Z"
        fill="var(--copper)" />
      
      <path d="M7 24h26" stroke="var(--gold)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>);

}

/**
 * Section eyebrow with the small gold diamond used across the system.
 */
export function Eyebrow({
  children,
  tone = 'text-saffron'



}: {children: React.ReactNode;tone?: string;}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em]',
        tone
      )}>
      
      <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-gold" />
      {children}
    </p>);

}