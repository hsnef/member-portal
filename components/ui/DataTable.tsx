'use client';

import React from 'react';
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  /** Stable key, also used as the sort key */
  key: string;
  header: string;
  /** Cell renderer. Keep it presentational — no data fetching. */
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  sortable?: boolean;
  /** Hidden below `lg` so the mobile card view stays readable */
  secondary?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  caption: string;
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  /** Renders the compact stacked card used under `md` */
  mobileCard: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

/**
 * The one table in the system. Every admin list screen renders through this so
 * sorting, density, zebra behaviour, keyboard focus and the mobile fallback are
 * identical everywhere.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  mobileCard,
  onRowClick,
  sortKey,
  sortDirection = 'asc',
  onSort,
  loading = false,
  empty,
  pagination
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="space-y-3 p-6">
          {[...Array(6)].map((_, i) =>
          <Skeleton key={i} className="h-12 w-full" />
          )}
        </div>
      </div>);

  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className="space-y-4">
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-line bg-surface-sunk">
                {columns.map((column) =>
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    'px-5 py-3.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.secondary && 'hidden lg:table-cell'
                  )}>
                  
                    {column.sortable && onSort ?
                  <button
                    onClick={() => onSort(column.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 transition-colors hover:text-saffron',
                      sortKey === column.key && 'text-saffron'
                    )}
                    aria-label={`Sort by ${column.header}`}>
                    
                        {column.header}
                        <ArrowUpDownIcon
                      className={cn(
                        'h-3 w-3 transition-transform',
                        sortKey === column.key && sortDirection === 'desc' && 'rotate-180'
                      )}
                      aria-hidden="true" />
                    
                      </button> :

                  column.header
                  }
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) =>
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                onRowClick ?
                (e) => {
                  if (e.key === 'Enter') onRowClick(row);
                } :
                undefined
                }
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-saffron-soft/45 focus:bg-saffron-soft/60'
                )}>
                
                  {columns.map((column) =>
                <td
                  key={column.key}
                  className={cn(
                    'px-5 py-4 align-middle text-[15px] text-ink-2',
                    column.align === 'right' && 'text-right',
                    column.secondary && 'hidden lg:table-cell'
                  )}>
                  
                      {column.cell(row)}
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) =>
        <li key={rowKey(row)}>
            <button
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'w-full rounded-2xl border border-line bg-surface p-4 text-left shadow-card',
              onRowClick && 'transition-colors active:bg-saffron-soft/50'
            )}>
            
              {mobileCard(row)}
            </button>
          </li>
        )}
      </ul>

      {pagination && <Pagination {...pagination} />}
    </div>);

}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange





}: {page: number;pageSize: number;total: number;onPageChange: (page: number) => void;}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3 shadow-xs">
      
      <p className="tnum text-[14px] text-ink-2">
        Showing <span className="font-semibold text-ink">{from}</span>–
        <span className="font-semibold text-ink">{to}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeftIcon}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}>
          
          Previous
        </Button>
        <span className="tnum px-2 text-[14px] font-semibold text-ink-2">
          {page} / {pages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          iconRight={ChevronRightIcon}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}>
          
          Next
        </Button>
      </div>
    </nav>);

}