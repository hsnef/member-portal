import type { LucideIcon } from "lucide-react";
import React from "react";
import { IconTile } from "./IconTile";
import { cn } from "../../utils/cn";
import { tones, Tone } from "../../utils/tones";

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  tone?: Tone;
}
export function StatCard({
  label,
  value,
  caption,
  icon,
  tone = 'saffron'
}: StatCardProps) {
  return <div className={cn('group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card', 'transition-[transform,box-shadow] duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift')}>
      {/* Faint tinted wash that only wakes up on hover */}
      <span aria-hidden="true" className={cn('absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 transition-opacity duration-500 group-hover:opacity-80', tones[tone].bg)} />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
        <IconTile icon={icon} tone={tone} size="sm" shape="arch" />
      </div>
      <p className="tnum relative mt-4 font-serif text-[34px] leading-none text-ink">{value}</p>
      {caption && <p className="relative mt-2 text-[13.5px] leading-snug text-ink-3">{caption}</p>}
    </div>;
}