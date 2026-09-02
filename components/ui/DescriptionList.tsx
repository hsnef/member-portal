import React from 'react';
import { cn } from '../../utils/cn';

export interface DescriptionItem {
  label: string;
  value: React.ReactNode;
  /** Renders full-width across the grid */
  wide?: boolean;
  /** Tabular figures for IDs, money and dates */
  numeric?: boolean;
}

interface DescriptionListProps {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * The read view of any record. Detail screens are a stack of these inside
 * Cards — never a form rendered with disabled inputs.
 */
export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl
      className={cn(
        'grid gap-x-8 gap-y-5',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        className
      )}>
      
      {items.map((item) =>
      <div key={item.label} className={cn(item.wide && 'sm:col-span-full')}>
          <dt className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-ink-3">
            {item.label}
          </dt>
          <dd
          className={cn(
            'mt-1.5 text-[16.5px] leading-snug text-ink',
            item.numeric && 'tnum font-semibold'
          )}>
          
            {item.value || <span className="text-ink-3">—</span>}
          </dd>
        </div>
      )}
    </dl>);

}