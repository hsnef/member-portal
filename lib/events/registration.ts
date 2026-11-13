/**
 * Registering a member for an event, free or paid. Server only, service role.
 *
 * A free event registers at once ('Confirmed'). A paid one holds the place as
 * 'Pending Payment' until settlePayment confirms it; asking again reuses that
 * hold instead of creating a second. Capacity counts every registration that
 * is not cancelled, so held places count.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Event, MembershipLevel } from '@/types/database'

type Client = SupabaseClient<Database>

export type RegistrationOutcome =
  | { ok: true; registrationId: string; status: 'Pending Payment' | 'Confirmed'; reused: boolean }
  | { ok: false; status: 400 | 404 | 409; error: string }

/** The price a member pays for an event: member price for Annual and Lifetime. */
export function eventPriceFor(event: Pick<Event, 'member_price' | 'non_member_price'>, level: MembershipLevel): number {
  const isPaidMember = level === 'Annual' || level === 'Lifetime'
  const price = isPaidMember ? event.member_price : event.non_member_price
  return Number(price ?? 0)
}

/** Why a member may not register for this event now, or null if they may. */
export function registrationClosedReason(
  event: Pick<Event, 'status' | 'registration_deadline' | 'event_date'>,
  now: Date = new Date(),
): string | null {
  if (event.status !== 'Published') return 'This event is not open for registration'
  if (event.registration_deadline && new Date(event.registration_deadline) < now) {
    return 'Registration for this event has closed'
  }
  // An event is open through the end of its own day.
  if (new Date(`${event.event_date}T23:59:59`) < now) return 'This event has already taken place'
  return null
}

export async function holdRegistration(
  db: Client,
  { eventId, memberId, paid }: { eventId: string; memberId: string; paid: boolean },
): Promise<RegistrationOutcome> {
  const { data: event } = await db.from('events').select('*').eq('id', eventId).single()
  if (!event) return { ok: false, status: 404, error: 'Event not found' }

  const closed = registrationClosedReason(event)
  if (closed) return { ok: false, status: 400, error: closed }

  const { data: existing } = await db
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .neq('status', 'Cancelled')
    .maybeSingle()

  if (existing?.status === 'Confirmed') {
    return { ok: false, status: 409, error: 'You are already registered for this event' }
  }
  if (existing?.status === 'Pending Payment') {
    return { ok: true, registrationId: existing.id, status: 'Pending Payment', reused: true }
  }

  if (event.max_capacity && event.max_capacity > 0) {
    const { count } = await db
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .neq('status', 'Cancelled')
    if ((count ?? 0) >= event.max_capacity) return { ok: false, status: 400, error: 'This event is full' }
  }

  const status = paid ? 'Pending Payment' : 'Confirmed'
  const { data: created, error } = await db
    .from('event_registrations')
    .insert({
      event_id: eventId,
      member_id: memberId,
      status,
      primary_attendee_count: 1,
      family_attendee_count: 0,
      guest_attendee_count: 0,
      payment_id: null,
      amount_paid: null,
      attended: null,
    })
    .select('id')
    .single()
  if (error || !created) {
    // Two requests at once: the unique index lets only one through.
    if (error?.code === '23505') return { ok: false, status: 409, error: 'You are already registered for this event' }
    console.error('[events] registration insert failed', error?.message)
    return { ok: false, status: 400, error: 'Could not register for this event' }
  }
  return { ok: true, registrationId: created.id, status, reused: false }
}
