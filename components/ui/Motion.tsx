'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

export const easeSmooth = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeSmooth }
  }
};

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'section';
}

export function Stagger({ children, className, as = 'div' }: StaggerProps) {
  const Component = motion[as];
  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}>
      
      {children}
    </Component>);

}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'section';
}

export function StaggerItem({ children, className, as = 'div' }: StaggerItemProps) {
  const Component = motion[as];
  return (
    <Component variants={itemVariants} className={className}>
      {children}
    </Component>);

}

export function FadeIn({
  children,
  className,
  delay = 0




}: {children: React.ReactNode;className?: string;delay?: number;}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeSmooth, delay }}
      className={className}>
      
      {children}
    </motion.div>);

}