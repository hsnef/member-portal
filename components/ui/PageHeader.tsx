'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CornerMandala, Eyebrow } from '../brand/Motifs';
import { easeSmooth } from './Motion';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeSmooth }}
      className="relative mb-8 overflow-hidden">
      
      <CornerMandala className="-right-16 -top-24 text-saffron/[0.07]" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mt-2.5 font-serif text-[38px] leading-[1.08] text-ink sm:text-[44px]">
            {title}
          </h1>
          {description &&
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink-2">{description}</p>
          }
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>

      <div className="hs-rule mt-7" aria-hidden="true" />
    </motion.header>);

}