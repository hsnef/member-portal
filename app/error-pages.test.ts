import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// The pages import the stylesheet (global-error) and Next's client link; neither
// matters to what they say.
vi.mock('./globals.css', () => ({}))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => createElement('a', { href, ...rest }, children),
}))

const { default: NotFound } = await import('./not-found')
const { default: ErrorPage } = await import('./error')
const { default: GlobalError } = await import('./global-error')

const html = (el: any) => renderToStaticMarkup(el)
const boom = (digest?: string) => Object.assign(new Error('db down'), { digest })

describe('error pages', () => {
  it('not-found: one heading, and links back into the portal', () => {
    const out = html(createElement(NotFound))
    expect(out.match(/<h1/g)).toHaveLength(1)
    expect(out).toContain("We couldn&#x27;t find that page")
    expect(out).toContain('href="/member"')
    expect(out).toContain('office@hsnef.org')
  })

  it('error: offers Try again and shows the reference the office can look up', () => {
    const out = html(createElement(ErrorPage, { error: boom('abc123'), reset: () => {} }))
    expect(out).toContain('Try again')
    expect(out).toContain('abc123')
    expect(out).not.toContain('db down') // never shows the raw error to a member
  })

  it('error: without a reference, shows no empty reference panel', () => {
    const out = html(createElement(ErrorPage, { error: boom(), reset: () => {} }))
    expect(out).not.toContain('Reference')
  })

  it('global-error: renders a whole document, since the root layout is gone', () => {
    const out = html(createElement(GlobalError, { error: boom('xyz'), reset: () => {} }))
    expect(out).toMatch(/^<html/)
    expect(out).toContain('<body')
    expect(out).toContain('The portal didn&#x27;t load')
    expect(out).toContain('xyz')
    expect(out).not.toContain('db down')
  })
})
