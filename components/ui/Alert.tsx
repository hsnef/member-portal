'use client';

import type { LucideIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XCircleIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { easeSmooth } from "./Motion";
type AlertTone = 'info' | 'success' | 'warning' | 'danger';
const config: Record<AlertTone, {
  icon: LucideIcon;
  surface: string;
  rail: string;
  glyph: string;
}> = {
  info: {
    icon: InfoIcon,
    surface: 'bg-sandal-soft border-sandal/20',
    rail: 'bg-sandal',
    glyph: 'text-sandal-ink'
  },
  success: {
    icon: CheckCircle2Icon,
    surface: 'bg-tulsi-soft border-tulsi/20',
    rail: 'bg-tulsi',
    glyph: 'text-tulsi-ink'
  },
  warning: {
    icon: AlertTriangleIcon,
    surface: 'bg-marigold-soft border-marigold/30',
    rail: 'bg-marigold',
    glyph: 'text-marigold-ink'
  },
  danger: {
    icon: XCircleIcon,
    surface: 'bg-danger-soft border-danger/20',
    rail: 'bg-danger',
    glyph: 'text-danger'
  }
};
interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className
}: AlertProps) {
  const {
    icon: Icon,
    surface,
    rail,
    glyph
  } = config[tone];
  return <motion.div initial={{
    opacity: 0,
    y: 8
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.4,
    ease: easeSmooth
  }} role={tone === 'danger' ? 'alert' : 'status'} className={cn('relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 pl-6 sm:flex-row sm:items-center', surface, className)}>
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', rail)} />
      <Icon className={cn('h-6 w-6 shrink-0', glyph)} strokeWidth={1.9} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-[16px] font-semibold leading-snug text-ink">{title}</p>
        {children && <div className="mt-1 text-[14.5px] leading-relaxed text-ink-2">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>;
}