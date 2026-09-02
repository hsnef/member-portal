'use client';

import React, { useId } from 'react';
import { cn } from '../../utils/cn';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: {id: string;describedBy?: string;invalid: boolean;}) => React.ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className="block text-[13px] font-bold uppercase tracking-[0.09em] text-ink-2">
        
        {label}
        {required &&
        <span className="ml-1 text-saffron" aria-hidden="true">
            *
          </span>
        }
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error &&
      <p id={hintId} className="text-[13.5px] leading-snug text-ink-3">
          {hint}
        </p>
      }
      {error &&
      <p id={errorId} className="text-[13.5px] font-semibold text-danger">
          {error}
        </p>
      }
    </div>);

}

const controlBase = cn(
  'w-full rounded-xl border bg-surface px-4 text-[16px] text-ink placeholder:text-ink-3',
  'shadow-[inset_0_1px_2px_rgba(74,47,22,0.04)]',
  'transition-[border-color,box-shadow] duration-200 ease-smooth',
  'focus:border-saffron focus:outline-none focus:ring-4 focus:ring-saffron-ring/35',
  'disabled:bg-surface-sunk disabled:text-ink-3 disabled:shadow-none'
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {invalid?: boolean;}>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          'h-12',
          invalid ? 'border-danger focus:ring-danger/20' : 'border-line-strong',
          className
        )}
        {...props} />);


  });

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {invalid?: boolean;}>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          'h-12 appearance-none bg-[length:18px] bg-[right_1rem_center] bg-no-repeat pr-11',
          invalid ? 'border-danger' : 'border-line-strong',
          className
        )}
        style={{
          backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23c75b12' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"
        }}
        {...props}>
        
      {children}
    </select>);

  });

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {invalid?: boolean;}>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          'min-h-[112px] py-3 leading-relaxed',
          invalid ? 'border-danger' : 'border-line-strong',
          className
        )}
        {...props} />);


  });