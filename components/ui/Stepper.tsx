'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { easeSmooth } from './Motion';

interface StepperProps {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}

/**
 * Horizontal progress for multi-step flows (new booking, member import,
 * new event). Completed steps stay clickable so people can go back.
 */
export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const clickable = Boolean(onStepClick) && done;
          return (
            <li key={step} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onStepClick?.(index) : undefined}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 text-left',
                  clickable && 'cursor-pointer'
                )}>
                
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-t-full rounded-b-lg text-[13px] font-bold transition-colors duration-300',
                    done && 'bg-tulsi text-white',
                    active && 'bg-saffron text-white',
                    !done && !active && 'bg-surface-sunk text-ink-3 ring-1 ring-inset ring-line'
                  )}>
                  
                  {done ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden truncate text-[14px] font-semibold sm:block',
                    active ? 'text-ink' : 'text-ink-3'
                  )}>
                  
                  {step}
                </span>
              </button>
              {index < steps.length - 1 &&
              <span className="h-[2px] flex-1 overflow-hidden rounded-full bg-line">
                  <motion.span
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: easeSmooth }}
                  style={{ transformOrigin: 'left' }}
                  className="block h-full bg-tulsi" />
                
                </span>
              }
            </li>);

        })}
      </ol>
    </nav>);

}