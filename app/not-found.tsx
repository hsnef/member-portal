'use client'

import { CompassIcon } from 'lucide-react'
import { StatusScreen } from '@/components/ui/StatusScreen'
import { Button } from '@/components/ui/Button'
import { AppLink } from '@/components/nav/Nav'
import { TEMPLE_CONFIG } from '@/lib/constants/temple'

/** Any address the portal has no page for (Next.js renders this with a 404). */
export default function NotFound() {
  return (
    <StatusScreen
      standalone
      icon={CompassIcon}
      tone="saffron"
      eyebrow="Page not found"
      title="We couldn't find that page"
      description="The link may be old, or the address may have a typo. Your portal home has everything you can do here."
      actions={
        <>
          <AppLink to="/member">
            <Button size="lg">Go to my portal</Button>
          </AppLink>
          <AppLink to="/">
            <Button size="lg" variant="secondary">
              Temple portal home
            </Button>
          </AppLink>
        </>
      }
      footnote={`Still stuck? Call the office on ${TEMPLE_CONFIG.contact.phone} or email ${TEMPLE_CONFIG.contact.email}.`}
    />
  )
}
