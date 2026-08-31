'use client';

import React from 'react';
import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react';
import { Input, Select } from './Field';
import { cn } from '../../utils/cn';

interface ToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Inline dropdown filters rendered to the right of the search field */
  filters?: React.ReactNode;
  /** Primary/secondary actions, right-aligned */
  actions?: React.ReactNode;
  /** Result summary line, e.g. "42 members · 3 expiring" */
  summary?: string;
  className?: string;
}

/**
 * The list-screen control bar. Every admin index page uses this so search,
 * filtering and the primary action always sit in the same place.
 */
export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  filters,
  actions,
  summary,
  className
}: ToolbarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <SearchIcon
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-3"
            aria-hidden="true" />
          
          <Input
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            className="pl-11"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)} />
          
        </div>

        {filters &&
        <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontalIcon
            className="hidden h-[18px] w-[18px] text-ink-3 lg:block"
            aria-hidden="true" />
          
            {filters}
          </div>
        }

        {actions && <div className="flex flex-wrap gap-2.5 lg:ml-auto">{actions}</div>}
      </div>

      {summary &&
      <p className="text-[13.5px] text-ink-3">
          {summary}
        </p>
      }
    </div>);

}

/** A compact labelled select for use inside `Toolbar.filters`. */
export function ToolbarFilter({
  label,
  value,
  onChange,
  options





}: {label: string;value: string;onChange: (value: string) => void;options: readonly string[];}) {
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-auto min-w-[150px] text-[14.5px]">
        
        {options.map((option) =>
        <option key={option} value={option}>
            {option === 'All' ? `All ${label.toLowerCase()}` : option}
          </option>
        )}
      </Select>
    </label>);

}