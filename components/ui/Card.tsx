import React from 'react';
import { cn } from '../../utils/cn';
import { tones, type Tone } from '../../utils/tones';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'li';
  padded?: boolean;
  interactive?: boolean;
  tone?: 'default' | 'sunk' | 'accent' | 'ceremonial';
  /** Adds a 3px coloured spine down the left edge — how a card declares its domain */
  spine?: Tone;
}

const toneClasses = {
  default: 'bg-surface border-line',
  sunk: 'bg-surface-sunk border-line',
  accent: 'bg-saffron-soft border-saffron/20',
  ceremonial: 'bg-kumkum text-white border-kumkum'
};

export function Card({
  as: Tag = 'div',
  padded = true,
  interactive = false,
  tone = 'default',
  spine,
  className,
  children,
  ...props
}: CardProps) {
  const Component = Tag as React.ElementType;
  return (
    <Component
      className={cn(
        'relative overflow-hidden rounded-2xl border shadow-card',
        toneClasses[tone],
        padded && 'p-6',
        interactive &&
        'transition-[transform,box-shadow,border-color] duration-300 ease-smooth hover:-translate-y-1 hover:border-saffron-ring hover:shadow-lift',
        className
      )}
      {...props}>
      
      {spine &&
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: `var(${tones[spine].varName})` }} />

      }
      {children}
    </Component>);

}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="font-serif text-[23px] leading-tight text-ink">{title}</h2>
        {description && <p className="mt-1 text-[14.5px] text-ink-2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>);

}