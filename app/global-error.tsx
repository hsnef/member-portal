'use client'

import { useEffect } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import './globals.css'
import { StatusScreen } from '@/components/ui/StatusScreen'
import { Button } from '@/components/ui/Button'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

/**
 * Last resort: the root layout itself failed (so no header, sign-in or fonts).
 * It replaces the whole document, which is why it renders <html> and <body>
 * and imports the stylesheet itself. Plain <a> links, not client navigation:
 * a full reload is the most likely thing to recover.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <StatusScreen
          standalone
          icon={TriangleAlertIcon}
          tone="danger"
          eyebrow="Something went wrong"
          title="The portal didn't load"
          description="Please try again in a moment. If it keeps happening, the office can help."
          facts={error.digest ? [{ label: 'Reference', value: error.digest }] : undefined}
          actions={
            <>
              <Button size="lg" onClick={() => reset()}>
                Try again
              </Button>
              <a href="/">
                <Button size="lg" variant="secondary">
                  Reload the portal
                </Button>
              </a>
            </>
          }
          footnote={`Office: ${TEMPLE_CONFIG.contact.phone} · ${TEMPLE_CONFIG.contact.email}`}
        />
      </body>
    </html>
  )
}
