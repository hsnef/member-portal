import { NextResponse } from 'next/server'
import { getZelleSettingsServer } from '@/lib/zelle/server'

/**
 * GET /api/zelle/settings
 * Get Zelle payment settings (public endpoint)
 */
export async function GET() {
  try {
    const settings = await getZelleSettingsServer()

    // Return only public settings (hide internal config)
    return NextResponse.json({
      enabled: settings.enabled,
      hasEmail: !!settings.zelle_email,
      hasPhone: !!settings.zelle_phone,
      zelle_email: settings.zelle_email,
      zelle_phone: settings.zelle_phone,
      instructions: settings.instructions,
    })
  } catch (error) {
    console.error('Error fetching Zelle settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
