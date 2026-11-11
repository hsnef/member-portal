import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'
import { exactIlike } from '@/lib/auth/memberEmail'
import { parseJoinPayload, toMemberRow, toPendingRow } from '@/lib/registration/joinPayload'
import { sendEmail } from '@/lib/email/mailer'
import { welcomeEmail } from '@/lib/email/templates'

/**
 * `POST /api/join` — a membership application from the public `/join` page.
 *
 * The office decides what happens with the `require_member_approval` portal
 * setting (Office Manager / Admin, `/admin/portal-settings`):
 *
 *   - ON  → the application goes to `pending_member_registrations` and shows in
 *           `/admin/pending-registrations` for the office to approve.
 *   - OFF → the member is created at once. The DB trigger assigns
 *           `membership_id`, and a welcome email links to `/login`.
 *
 * The browser never writes `members` itself; this route does, with the
 * service client, after validating the payload (`lib/registration/joinPayload`).
 *
 * If the setting cannot be read, the route treats approval as ON: an
 * application waiting for the office is recoverable; a member created by
 * mistake is not.
 *
 * Like `/api/auth/check-member-email`, it tells the caller when an address
 * already has a membership. That is the same accepted trade-off: the applicant
 * needs to be told to sign in instead.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = parseJoinPayload(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }
  const application = parsed.value

  try {
    const service = createServiceClient()

    // One membership per primary address: the login is keyed on it.
    const { data: existing } = await service
      .from('members')
      .select('id')
      .ilike('primary_email', exactIlike(application.primaryEmail))
      .limit(1)
    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error:
            'There is already a membership for this email address. Sign in with it instead.',
          code: 'already-member',
        },
        { status: 409 }
      )
    }

    const { data: setting } = await service
      .from('portal_settings')
      .select('setting_value')
      .eq('setting_key', 'require_member_approval')
      .maybeSingle()
    const value = (setting as { setting_value?: { enabled?: unknown } } | null)?.setting_value
    const approvalRequired = value?.enabled !== false

    if (approvalRequired) {
      const { error } = await service
        .from('pending_member_registrations')
        .insert(toPendingRow(application) as never)
      if (error) {
        console.error('[join] pending registration insert failed:', error)
        return NextResponse.json(
          { error: 'We could not submit your application. Please try again.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ status: 'pending' }, { status: 201 })
    }

    const { data: member, error: memberError } = await service
      .from('members')
      .insert(toMemberRow(application) as never)
      .select('*')
      .single()
    if (memberError || !member) {
      console.error('[join] member insert failed:', memberError)
      return NextResponse.json(
        { error: 'We could not create your membership. Please try again.' },
        { status: 500 }
      )
    }
    const created = member as { id: string; membership_id: string; primary_email: string }

    // Terms and the welcome email are follow-ups: the member exists either way,
    // so a failure here is logged, not returned. Terms are asked for again on
    // first sign-in if no acceptance is on file (TermsAcceptanceModal).
    if (application.termsVersion && application.termsContentId) {
      const { error: termsError } = await service.from('terms_acceptances').insert({
        member_id: created.id,
        auth_user_id: null,
        terms_version: application.termsVersion,
        terms_content_id: application.termsContentId,
        ip_address: null,
        user_agent: request.headers.get('user-agent'),
        acceptance_method: 'registration',
      } as never)
      if (termsError) console.error('[join] terms acceptance insert failed:', termsError)
    }

    const email = welcomeEmail(member as never)
    const sent = await sendEmail({
      to: created.primary_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        { name: 'category', value: 'welcome' },
        { name: 'member_id', value: created.id },
      ],
    })
    if (!sent.success) console.error('[join] welcome email failed:', sent.error)

    return NextResponse.json(
      { status: 'created', membershipId: created.membership_id },
      { status: 201 }
    )
  } catch (error) {
    console.error('[join] failed:', error)
    return NextResponse.json(
      { error: 'We could not submit your application. Please try again.' },
      { status: 500 }
    )
  }
}
