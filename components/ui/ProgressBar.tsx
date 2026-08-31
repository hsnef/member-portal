'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { easeSmooth } from './Motion';
import { tones, type Tone } from '../../utils/tones';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  tone?: Tone;
}

export function ProgressBar({ value, max, label, tone = 'marigold' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round(value / max * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className="relative h-2.5 w-full overflow-hidden rounded-full bg-canvas-deep ring-1 ring-inset ring-ink/[0.06]">
      
      {/* Quarter ticks, like measure marks on a brass vessel */}
      <span aria-hidden="true" className="absolute inset-0 flex justify-evenly">
        {[0, 1, 2].map((i) =>
        <span key={i} className="w-px bg-ink/[0.07]" />
        )}
      </span>
      <motion.span
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: easeSmooth }}
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: `var(${tones[tone].varName})` }} />
      
    </div>);

}