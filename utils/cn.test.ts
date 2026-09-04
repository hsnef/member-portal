import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('joins non-conflicting classes', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('drops falsy entries', () => {
    expect(cn('flex', false, null, undefined, 'gap-2')).toBe('flex gap-2')
  })

  it('returns an empty string when given nothing usable', () => {
    expect(cn()).toBe('')
    expect(cn(false, null, undefined)).toBe('')
  })

  // The reason tailwind-merge is a dependency at all. With a plain join both
  // classes survive and stylesheet order picks the winner, so a caller's
  // override can silently do nothing.
  describe('conflict resolution — the caller wins', () => {
    it('lets a caller override a component default', () => {
      expect(cn('p-6', 'p-2')).toBe('p-2')
      expect(cn('rounded-xl', 'rounded-none')).toBe('rounded-none')
      expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    })

    it('resolves this design system\'s own colour tokens', () => {
      // These are project tokens, not stock Tailwind. They merge because they
      // follow the standard {prefix}-{value} shape -- worth pinning, since a
      // token named off-pattern would silently stop merging.
      expect(cn('bg-saffron', 'bg-kumkum')).toBe('bg-kumkum')
      expect(cn('text-ink', 'text-ink-2')).toBe('text-ink-2')
      expect(cn('border-line', 'border-line-strong')).toBe('border-line-strong')
      expect(cn('bg-surface', 'bg-surface-sunk')).toBe('bg-surface-sunk')
    })
  })

  describe('things that must NOT be merged away', () => {
    it('keeps a text colour and a text size together', () => {
      // The one genuine hazard in this system: `text-ink` and `text-sm` share a
      // prefix but are different properties. If these ever collapse, text
      // colour disappears across the app.
      expect(cn('text-ink', 'text-sm')).toBe('text-ink text-sm')
      expect(cn('text-sm', 'text-ink')).toBe('text-sm text-ink')
      expect(cn('text-saffron', 'text-xs')).toBe('text-saffron text-xs')
    })

    it('keeps a base utility alongside its responsive variant', () => {
      expect(cn('p-6', 'md:p-2')).toBe('p-6 md:p-2')
    })

    it('keeps a base utility alongside its state variant', () => {
      expect(cn('text-ink', 'hover:text-saffron')).toBe('text-ink hover:text-saffron')
    })

    it('keeps utilities that target different properties', () => {
      expect(cn('bg-canvas', 'text-ink', 'border-line')).toBe('bg-canvas text-ink border-line')
    })
  })

  it('handles the shape components actually call it with', () => {
    // Component default, a conditional, then the caller's className.
    const isActive = true
    expect(cn('px-4 py-2 bg-surface', isActive && 'bg-saffron', 'px-8')).toBe(
      'py-2 bg-saffron px-8'
    )
  })
})
