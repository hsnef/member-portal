import React from 'react';
import { cn } from '../../utils/cn';
import { tones, type Tone } from '../../utils/tones';

export type BadgeTone = Tone | 'success' | 'warning' | 'danger';

const semantic: Record<'success' | 'warning' | 'danger', string> = {
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/25',
  danger: 'bg-danger-soft text-danger ring-danger/20'
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ tone = 'neutral', children, className, dot = false }: BadgeProps) {
  const isSemantic = tone === 'success' || tone === 'warning' || tone === 'danger';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12.5px] font-semibold uppercase tracking-[0.05em] ring-1 ring-inset',
        isSemantic ?
        semantic[tone as 'success' | 'warning' | 'danger'] :
        cn(tones[tone as Tone].bg, tones[tone as Tone].text, 'ring-ink/10'),
        className
      )}>
      
      {dot &&
      <span
        aria-hidden="true"
        className="relative flex h-1.5 w-1.5">
        
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      }
      {children}
    </span>);

}