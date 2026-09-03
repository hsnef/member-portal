import { twMerge } from 'tailwind-merge';

/**
 * Class name joiner used by every design system component.
 *
 * Backed by `tailwind-merge`, which resolves conflicting Tailwind utilities so a
 * caller's `className` reliably beats the component's own default -- passing
 * `p-2` over a built-in `p-6` yields `p-2`, not both.
 *
 * This matters because the alternative fails silently. With a plain join both
 * classes land in the list and stylesheet order picks the winner, so a
 * deliberate override can do nothing at all with no error to notice.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
