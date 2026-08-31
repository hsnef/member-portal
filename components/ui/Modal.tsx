'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { easeSmooth } from './Motion';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** `panel` slides in from the right (forms, detail editing); `dialog` centres. */
  variant?: 'dialog' | 'panel';
  width?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
  width = 'md'
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open &&
      <div
        className={cn(
          'fixed inset-0 z-50 flex',
          variant === 'panel' ? 'justify-end' : 'items-center justify-center p-4'
        )}>
        
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-kumkum/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={variant === 'panel' ? { x: '100%' } : { opacity: 0, scale: 0.96, y: 12 }}
          animate={variant === 'panel' ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
          exit={variant === 'panel' ? { x: '100%' } : { opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.35, ease: easeSmooth }}
          className={cn(
            'relative flex w-full flex-col bg-canvas shadow-lift',
            variant === 'panel' ?
            'h-full max-w-[560px]' :
            cn('max-h-[88vh] rounded-3xl border border-line', widths[width])
          )}>
          
            <div className="flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-5">
              <div>
                <h2 className="font-serif text-[25px] leading-tight text-ink">{title}</h2>
                {description && <p className="mt-1 text-[14.5px] text-ink-2">{description}</p>}
              </div>
              <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl p-2 text-ink-2 transition-colors hover:bg-surface-sunk hover:text-ink">
              
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

            {footer &&
          <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-surface px-6 py-4">
                {footer}
              </div>
          }
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}