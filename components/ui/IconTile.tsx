import type { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "../../utils/cn";
import { tones, Tone } from "../../utils/tones";

type TileSize = 'sm' | 'md' | 'lg';
type TileShape = 'squircle' | 'arch' | 'circle';
interface IconTileProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: TileSize;
  shape?: TileShape;
  solid?: boolean;
  className?: string;
}
const sizeClasses: Record<TileSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14'
};
const glyphClasses: Record<TileSize, string> = {
  sm: 'h-[18px] w-[18px]',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
};

/**
 * The `arch` shape echoes a temple torana — flat-bottomed with a domed top.
 * It is what stops our icon chrome reading like every other dashboard.
 */
const shapeClasses: Record<TileShape, string> = {
  squircle: 'rounded-[30%]',
  arch: 'rounded-t-full rounded-b-xl',
  circle: 'rounded-full'
};
export function IconTile({
  icon: Icon,
  tone = 'saffron',
  size = 'md',
  shape = 'arch',
  solid = false,
  className
}: IconTileProps) {
  return <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center', sizeClasses[size], shapeClasses[shape], solid ? tones[tone].solid : tones[tone].tile, className)}>
      <Icon className={glyphClasses[size]} strokeWidth={1.9} />
    </span>;
}