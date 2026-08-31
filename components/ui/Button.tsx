'use client';

import type { LucideIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { cn } from "../../utils/cn";
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sacred' | 'quiet';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-saffron text-white border border-saffron-hover/40 shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_18px_-8px_rgba(199,91,18,0.65)] hover:bg-saffron-hover',
  secondary: 'bg-surface text-ink border border-line-strong shadow-xs hover:border-saffron-ring hover:bg-saffron-soft/50',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-surface-sunk hover:text-ink',
  quiet: 'bg-surface-sunk text-ink-2 border border-transparent hover:bg-canvas-deep hover:text-ink',
  danger: 'bg-danger text-white border border-transparent hover:brightness-95',
  sacred: 'bg-kumkum text-white border border-kumkum shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_6px_18px_-8px_rgba(123,45,38,0.6)] hover:brightness-110'
};
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-[14.5px] gap-2 rounded-xl',
  md: 'h-12 px-5 text-[15.5px] gap-2.5 rounded-xl',
  lg: 'h-14 px-7 text-[16.5px] gap-3 rounded-2xl'
};
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return <motion.button whileTap={disabled || loading ? undefined : {
    scale: 0.975
  }} transition={{
    duration: 0.12
  }} className={cn('group/btn relative inline-flex select-none items-center justify-center overflow-hidden font-semibold tracking-[-0.005em]', 'transition-[background-color,border-color,color,box-shadow] duration-200 ease-smooth', 'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none', variantClasses[variant], sizeClasses[size], fullWidth && 'w-full', className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2Icon className="h-[18px] w-[18px] animate-spin" aria-hidden="true" /> : Icon && <Icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 ease-smooth group-hover/btn:-rotate-6" strokeWidth={2} aria-hidden="true" />}
      <span>{children}</span>
      {IconRight && !loading && <IconRight className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 ease-smooth group-hover/btn:translate-x-0.5" strokeWidth={2} aria-hidden="true" />}
    </motion.button>;
}