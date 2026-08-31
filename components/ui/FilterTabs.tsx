'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { easeSmooth } from './Motion';

interface FilterTabsProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  counts?: Partial<Record<T, number>>;
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  counts
}: FilterTabsProps<T>) {
  const groupId = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-xs">
      
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option)}
            className={cn(
              'relative rounded-xl px-4 py-2 text-[14.5px] font-semibold transition-colors duration-200',
              selected ? 'text-white' : 'text-ink-2 hover:text-ink'
            )}>
            
            {selected &&
            <motion.span
              layoutId={`tab-pill-${groupId}`}
              transition={{ duration: 0.35, ease: easeSmooth }}
              className="absolute inset-0 rounded-xl bg-saffron shadow-[0_4px_12px_-4px_rgba(199,91,18,0.55)]" />

            }
            <span className="relative z-10 whitespace-nowrap">
              {option}
              {counts?.[option] !== undefined &&
              <span
                className={cn(
                  'ml-2 tnum text-[12.5px]',
                  selected ? 'text-white/75' : 'text-ink-3'
                )}>
                
                  {counts[option]}
                </span>
              }
            </span>
          </button>);

      })}
    </div>);

}