'use client';

import type { LucideIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { CornerMandala, KolamBand } from "../brand/Motifs";
import { BrandLockup } from "../brand/TempleMark";
import { easeSmooth } from "./Motion";
import { cn } from "../../utils/cn";
import { tones, Tone } from "../../utils/tones";

interface StatusScreenProps {
  icon: LucideIcon;
  tone?: Tone | 'danger';
  eyebrow?: string;
  title: string;
  description: string;
  /** Key/value block shown in a bordered panel under the description */
  facts?: Array<{
    label: string;
    value: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  footnote?: React.ReactNode;
  /** Shows the brand lockup — used on standalone (unauthenticated) screens */
  standalone?: boolean;
}

/**
 * ARCHETYPE: full-screen outcome.
 * Payment success, QR verification result, access denied, session expired.
 * One glyph, one sentence, one obvious next step.
 */
export function StatusScreen({
  icon: Icon,
  tone = 'tulsi',
  eyebrow,
  title,
  description,
  facts,
  actions,
  footnote,
  standalone = false
}: StatusScreenProps) {
  const isDanger = tone === 'danger';
  const glyphClass = isDanger ? 'bg-danger-soft text-danger' : tones[tone as Tone].tile;
  return <div className="hs-dots relative flex min-h-full w-full items-center justify-center bg-canvas px-5 py-14">
      <CornerMandala className="-left-24 -top-24 h-80 w-80 text-saffron/[0.06]" />
      <CornerMandala className="-bottom-24 -right-24 h-80 w-80 text-saffron/[0.06]" />

      <motion.div initial={{
      opacity: 0,
      y: 16
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5,
      ease: easeSmooth
    }} className="relative w-full max-w-lg">
        {standalone && <div className="mb-8 flex justify-center">
            <BrandLockup />
          </div>}

        <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-lift">
          <KolamBand className="px-6 pt-4 text-saffron/25" />

          <div className="px-7 pb-8 pt-4 text-center sm:px-10">
            <motion.span initial={{
            scale: 0.85,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            duration: 0.45,
            ease: easeSmooth,
            delay: 0.1
          }} className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-t-full rounded-b-2xl', glyphClass)}>
              <Icon className="h-9 w-9" strokeWidth={1.7} aria-hidden="true" />
            </motion.span>

            {eyebrow && <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
                {eyebrow}
              </p>}
            <h1 className="mt-2 font-serif text-[34px] leading-[1.1] text-ink">{title}</h1>
            <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-ink-2">
              {description}
            </p>

            {facts && facts.length > 0 && <dl className="mt-7 divide-y divide-line rounded-2xl border border-line bg-surface-sunk px-5 text-left">
                {facts.map((fact) => <div key={fact.label} className="flex items-baseline justify-between gap-4 py-3.5">
                    <dt className="text-[13.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                      {fact.label}
                    </dt>
                    <dd className="tnum text-right text-[16px] font-semibold text-ink">
                      {fact.value}
                    </dd>
                  </div>)}
              </dl>}

            {actions && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">{actions}</div>}
          </div>
        </div>

        {footnote && <p className="mt-6 text-center text-[13.5px] leading-relaxed text-ink-3">{footnote}</p>}
      </motion.div>
    </div>;
}