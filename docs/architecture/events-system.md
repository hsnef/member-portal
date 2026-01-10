# Events Management System

## Overview
Complete event management system for HSNEF temple with admin management, member registration, capacity tracking, and attendance management.

## Features Implemented

### 1. **Admin Event Management** (`/admin/events`)

**Event List Page:**
- View all events (upcoming, past, draft, published, cancelled)
- Filter by status (All, Published, Draft, Cancelled, Completed)
- Search by event name or category
- Dashboard statistics:
  - Total events
  - Published events
  - Upcoming events
  - Total registrations across all events
- Registration count for each event
- Capacity tracking (full/available)
- Quick actions: View Details, Edit, View Registrations

**Create Event** (`/admin/events/new`):
- Basic Information:
  - Event name
  - Event date and time
  - Location
  - Category (Festival, Puja, Educational, Social, Cultural, Fundraiser, Other)
  - Description
- Registration Details:
  - Max capacity (0 = unlimited)
  - Member price
  - Non-member price
  - Registration deadline (optional)
- Contact & Additional Info:
  - Contact email
  - Contact phone
  - Event image URL
- Publication Status:
  - Draft (not visible to members)
  - Published (visible to members)

**Event Categories:**
- 🎉 Festival
- 🙏 Puja
- 📚 Educational
- 👥 Social
- 🎭 Cultural
- 💰 Fundraiser
- 📅 Other

### 2. **Member Event Browsing** (`/member/events`)

**Features:**
- Browse all published upcoming events
- Filter by category
- View event details:
  - Event name, date, time, location
  - Description and category
  - Member price
  - Capacity (spots available)
  - Event image/icon
- One-click registration
- Registration status indicator (✓ Registered)
- Cancel registration option
- Smart registration state:
  - Show "Register Now" if not registered and space available
  - Show "Event Full" if capacity reached
  - Show "Registration Closed" if deadline passed
  - Show "Cancel Registration" if already registered

### 3. **Event Registrations Management** (`/admin/events/[id]/registrations`)

**Features:**
- View all registrations for an event
- Registration statistics:
  - Total registrations (vs capacity)
  - Confirmed registrations
  - Attendance count
  - Attendance rate percentage
- Search registrations by:
  - Member name
  - Membership ID
  - Email
- Mark attendance (checkbox per registration)
- Cancel individual registrations
- Export options (coming soon):
  - Export to CSV
  - Print attendance list

**Registration Details Displayed:**
- Member name and membership ID
- Contact information (email, phone)
- Registration date
- Registration status (Confirmed, Waitlist, Cancelled)
- Attendance status (Present/Absent)

### 4. **Registration System**

**Database Schema:**
```sql
event_registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  member_id UUID REFERENCES members(id),
  membership_id TEXT,
  registration_date TIMESTAMPTZ,
  registration_status registration_status_enum,
  attended BOOLEAN DEFAULT FALSE,
  payment_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(event_id, member_id) -- Prevent duplicate registrations
)
```

**Registration Status:**
- Confirmed - Member successfully registered
- Waitlist - Event full, on waiting list
- Cancelled - Registration cancelled

**Event Status:**
- Draft - Not visible to members
- Published - Visible and open for registration
- Cancelled - Event cancelled
- Completed - Event has occurred

## User Flows

### Admin Creating an Event
1. Navigate to **Admin → Events**
2. Click **+ Create Event**
3. Fill in event details
4. Choose status (Draft or Published)
5. Click **Create Event**
6. Event appears in events list

### Member Registering for Event
1. Navigate to **Member Dashboard → Events**
2. Browse upcoming events
3. Click **Register Now** on desired event
4. Confirmation message appears
5. Event shows "✓ Registered" badge
6. Registration confirmation (can add email notification)

### Staff Managing Attendance
1. Navigate to **Admin → Events**
2. Click **Registrations (#)** for the event
3. View all registered members
4. Check attendance boxes as members arrive
5. Attendance count updates in real-time
6. Export attendance list if needed

## Integration Points

### Linked from Member Dashboard:
- Quick action card: "Events" → `/member/events`

### Linked from Admin Navigation:
- "Events" menu item → `/admin/events`

### Future Payment Integration:
- Events with non-zero prices can integrate with payment system
- Payment required before registration confirmation
- Payment status tracking in registrations table

## Capacity Management

**How it Works:**
1. Admin sets `max_capacity` (0 = unlimited)
2. System counts registrations for event
3. When `registration_count >= max_capacity`:
   - Event shows "FULL" badge
   - "Register Now" button disabled
   - Shows "Event Full" message to members

**Waitlist Feature (Future Enhancement):**
- When event is full, allow waitlist registrations
- If someone cancels, promote from waitlist
- Send notification to waitlist members

## Event Lifecycle

```
Draft → Published → [Registrations Open] → [Registration Deadline] → Event Date → Completed
             ↓
         Cancelled (optional)
```

1. **Draft**: Staff creates event, not visible to members
2. **Published**: Event goes live, members can register
3. **Registration Deadline**: Cutoff for new registrations
4. **Event Date**: Event occurs, attendance tracked
5. **Completed**: Event finished, attendance finalized

## Testing Checklist

**Admin:**
- [ ] Create new event with all fields
- [ ] Create event as Draft (not visible to members)
- [ ] Create event as Published (visible to members)
- [ ] Edit existing event
- [ ] View event registrations
- [ ] Mark attendance for registered members
- [ ] Search registrations
- [ ] Cancel a registration

**Member:**
- [ ] Browse upcoming events
- [ ] Filter events by category
- [ ] Register for an event
- [ ] View registered events (badge shows)
- [ ] Cancel registration
- [ ] Try to register for full event (should be blocked)
- [ ] Try to register after deadline (should be blocked)

## Database Tables Used

### events
- All event details
- Pricing, capacity, dates
- Status and category

### event_registrations
- Links members to events
- Tracks registration status
- Attendance tracking
- Payment status (for paid events)

## Future Enhancements

1. **Email Notifications:**
   - Registration confirmation
   - Event reminders (1 day before)
   - Event updates/cancellations
   - Waitlist promotions

2. **Payment Integration:**
   - Require payment for paid events
   - Payment at registration time
   - Automatic receipt generation
   - Refund processing for cancellations

3. **Calendar Integration:**
   - Add to Google Calendar
   - iCal export
   - Sync with temple calendar

4. **Recurring Events:**
   - Weekly pujas
   - Monthly programs
   - Auto-create instances

5. **Event Images:**
   - Upload event posters
   - Image gallery
   - Social media sharing

6. **Check-in System:**
   - QR code check-in at event
   - Scan membership QR to mark attendance
   - Mobile check-in app for staff

7. **Analytics:**
   - Event attendance trends
   - Popular event categories
   - Member engagement metrics
   - Revenue from paid events

## Security

- ✅ RLS policies protect event_registrations table
- ✅ Only authenticated members can register
- ✅ Unique constraint prevents duplicate registrations
- ✅ Admin roles required to create/edit events
- ✅ Members can only cancel their own registrations

## Support

For event management questions:
- Admin Guide: Available in admin dashboard
- Member Guide: Available in member dashboard
- Technical Support: [contact info]
