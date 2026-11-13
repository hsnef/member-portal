import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isManagerOrAdmin } from '@/lib/auth/helpers'
import { createServiceClient } from '@/lib/supabase/client'
import { readZelleSettings, recipientView } from '@/lib/zelle/server'
import { validateZelleSettings, zelleIsReady, type ZelleSettings } from '@/lib/zelle'

/**
 * GET: whether checkout offers Zelle, and where members send money. Public
 * information (it is printed on every Zelle instruction); no secrets. With
 * ?all=1, for an Office Manager or Admin: every setting, for the settings page.
 *
 * PUT (Office Manager, Admin): save the settings, after validating them on
 * the server (validateZelleSettings), so Zelle cannot be switched on with
 * nowhere to send money.
 */
export async function GET(request: NextRequest) {
  const settings = await readZelleSettings(createServiceClient())
  if (request.nextUrl.searchParams.get('all') === '1') {
    if (!(await isManagerOrAdmin())) return NextResponse.json({ error: 'Office Manager or Admin only' }, { status: 403 })
    return NextResponse.json({ settings })
  }
  const available = zelleIsReady(settings)
  return NextResponse.json({ available, recipient: available ? recipientView(settings) : null })
}

const KEYS: Array<[keyof ZelleSettings, string, 'enabled' | 'value']> = [
  ['enabled', 'zelle_enabled', 'enabled'],
  ['email', 'zelle_email', 'value'],
  ['phone', 'zelle_phone', 'value'],
  ['recipientName', 'zelle_recipient_name', 'value'],
  ['instructions', 'zelle_instructions', 'value'],
  ['reminderDays', 'zelle_reminder_days', 'value'],
  ['expiryDays', 'zelle_expiry_days', 'value'],
  ['qrImagePath', 'zelle_qr_image_path', 'value'],
  ['csvMapping', 'zelle_csv_mapping', 'value'],
]

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  if (!(await isManagerOrAdmin())) return NextResponse.json({ error: 'Office Manager or Admin only' }, { status: 403 })

  const db = createServiceClient()
  const current = await readZelleSettings(db)
  const body = ((await request.json().catch(() => ({}))) as { settings?: Partial<ZelleSettings> }).settings ?? {}
  const next: ZelleSettings = {
    ...current,
    ...body,
    email: String(body.email ?? current.email).trim(),
    phone: String(body.phone ?? current.phone).trim(),
    recipientName: String(body.recipientName ?? current.recipientName).trim() || current.recipientName,
    instructions: String(body.instructions ?? current.instructions).trim().slice(0, 500),
    reminderDays: Number(body.reminderDays ?? current.reminderDays),
    expiryDays: Number(body.expiryDays ?? current.expiryDays),
    enabled: body.enabled === undefined ? current.enabled : body.enabled === true,
  }
  const errors = validateZelleSettings(next)
  if (errors.length) return NextResponse.json({ error: errors.join(' '), errors }, { status: 400 })

  for (const [field, key, shape] of KEYS) {
    const { error } = await db
      .from('portal_settings')
      .update({ setting_value: { [shape]: next[field] }, updated_by: user.id })
      .eq('setting_key', key)
    if (error) return NextResponse.json({ error: `Could not save ${key}` }, { status: 500 })
  }
  return NextResponse.json({ settings: await readZelleSettings(db) })
}
