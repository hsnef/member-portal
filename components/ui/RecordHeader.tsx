'use client';

import type { LucideIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { Breadcrumbs, Crumb } from "./Breadcrumbs";
import { IconTile } from "./IconTile";
import { easeSmooth } from "./Motion";
import { CornerMandala } from "../brand/Motifs";
import { Tone } from "../../utils/tones";

interface RecordHeaderProps {
  crumbs: Crumb[];
  icon: LucideIcon;
  tone?: Tone;
  eyebrow?: string;
  title: string;
  /** Badges, status chips, IDs — rendered under the title */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Header for a single-record screen (member detail, booking detail, request
 * detail). Distinct from PageHeader, which heads a whole section.
 */
export function RecordHeader({
  crumbs,
  icon,
  tone = 'saffron',
  eyebrow,
  title,
  meta,
  actions
}: RecordHeaderProps) {
  return <motion.header initial={{
    opacity: 0,
    y: 10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.4,
    ease: easeSmooth
  }} className="relative mb-8 overflow-hidden">
      <CornerMandala className="-right-16 -top-24 text-saffron/[0.06]" />
      <div className="relative">
        <Breadcrumbs items={crumbs} />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <IconTile icon={icon} tone={tone} size="lg" shape="arch" />
            <div className="min-w-0">
              {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
                  {eyebrow}
                </p>}
              <h1 className="mt-1 font-serif text-[34px] leading-[1.1] text-ink">{title}</h1>
              {meta && <div className="mt-3 flex flex-wrap items-center gap-2.5">{meta}</div>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
        </div>
        <div className="hs-rule mt-7" aria-hidden="true" />
      </div>
    </motion.header>;
}