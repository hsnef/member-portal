/**
 * Class name joiner used by every design system component.
 *
 * NOTE: the design kit implements this with `tailwind-merge` (twMerge), which
 * resolves conflicting Tailwind utilities so a caller's `className` reliably
 * beats the component's own default (e.g. passing `p-2` over a built-in `p-6`).
 *
 * `tailwind-merge` is not yet an approved dependency here, so this is a plain
 * join. The tradeoff: when a caller passes a utility that conflicts with a
 * built-in one, BOTH land in the class list and Tailwind's stylesheet order
 * decides the winner rather than the caller. That is usually invisible, but it
 * can make a deliberate override silently do nothing.
 *
 * To restore full behaviour once the dependency is approved:
 *   npm install tailwind-merge
 *   import { twMerge } from 'tailwind-merge'
 *   return twMerge(classes.filter(Boolean).join(' '))
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
