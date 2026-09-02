import React from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { AppLink } from '../nav/Nav';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: {items: Crumb[];}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13.5px]">
        {items.map((crumb, index) => {
          const last = index === items.length - 1;
          return (
            <li key={crumb.label} className="flex items-center gap-1.5">
              {crumb.to && !last ?
              <AppLink
                to={crumb.to}
                className="font-semibold text-ink-3 transition-colors hover:text-saffron">
                
                  {crumb.label}
                </AppLink> :

              <span aria-current={last ? 'page' : undefined} className="font-semibold text-ink-2">
                  {crumb.label}
                </span>
              }
              {!last &&
              <ChevronRightIcon className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              }
            </li>);

        })}
      </ol>
    </nav>);

}