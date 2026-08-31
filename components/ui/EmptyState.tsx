import type { LucideIcon } from "lucide-react";
import React from "react";
import { IconTile } from "./IconTile";
import { CornerMandala } from "../brand/Motifs";
import { Tone } from "../../utils/tones";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: Tone;
}
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'sandal'
}: EmptyStateProps) {
  return <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-dashed border-line-strong bg-surface-sunk px-6 py-16 text-center">
      <CornerMandala className="-bottom-24 -left-20 text-ink/[0.04]" />
      <CornerMandala className="-right-20 -top-24 text-ink/[0.04]" />
      <IconTile icon={icon} tone={tone} size="lg" shape="arch" />
      <h3 className="relative mt-5 font-serif text-[24px] text-ink">{title}</h3>
      <p className="relative mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{description}</p>
      {action && <div className="relative mt-6">{action}</div>}
    </div>;
}