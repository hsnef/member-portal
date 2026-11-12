'use client'

import { useEffect } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { StatusScreen } from '@/components/ui/StatusScreen'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

/**
 * Shown when a page throws while rendering. The site's header, footer and
 * sign-in stay in place; only the broken page is replaced. `reset` re-renders
 * it, which is enough when the cause was a dropped connection.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[page error]', error)
  }, [error])

  return (
    <StatusScreen
      icon={TriangleAlertIcon}
      tone="danger"
      eyebrow="Something went wrong"
      title="This page didn't load"
      description="This is usually a passing connection problem. Try again; if it keeps happening, the office can help."
      facts={error.digest ? [{ label: 'Reference', value: error.digest }] : undefined}
      actions={
        <>
          <Button size="lg" onClick={() => reset()}>
            Try again
          </Button>
          <AppLink to="/member">
            <Button size="lg" variant="secondary">
              Go to my portal
            </Button>
          </AppLink>
        </>
      }
      footnote={`Office: ${TEMPLE_CONFIG.contact.phone} · ${TEMPLE_CONFIG.contact.email}${error.digest ? ' (quote the reference above)' : ''}`}
    />
  )
}
