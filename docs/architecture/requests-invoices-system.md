# Requests & Invoices System

## Overview
Complete service request and invoicing system for HSNEF temple. Allows staff to create service requests/invoices for members, track payment status, and manage the entire request lifecycle.

## Features Implemented

### 1. **Admin Request Management** (`/admin/requests`)

**Request List Page:**
- View all requests with comprehensive dashboard
- Filter by status (All, Draft, Sent, Paid, Completed, Cancelled)
- Search by member name, type, or membership ID
- Statistics dashboard:
  - Total requests count
  - Total amount (all requests)
  - Paid amount
  - Pending payment amount
- Color-coded status badges
- Request type icons (🙏 Puja, 💝 Sponsorship, etc.)
- Quick actions: View Details, Edit, Record Payment

**Create Request** (`/admin/requests/new`):
- Member search and selection
- Request details:
  - Request type (Puja, Sponsorship, Donation Request, Service, Facility Rental, Other)
  - Service description
  - Requested date
  - Amount
- Additional information (notes)
- Status selection:
  - Draft (internal, not sent to member)
  - Sent (sent to member for payment)
- Optional: Send invoice email to member

**View Request Details** (`/admin/requests/[id]`):
- Complete request information
- Member details with link to profile
- Status update buttons (Draft → Sent → Paid → Completed)
- Download PDF invoice
- Edit request option
- Visual status indicator

### 2. **Member Request View** (`/member/requests`)

**Features:**
- View all personal service requests
- Filter by status
- Statistics:
  - Total requests
  - Paid amount
  - Pending payment amount
- Request details with description
- One-click payment (integrated with payment system)
- Download PDF invoice
- Color-coded status indicators
- Beautiful card-based layout

### 3. **PDF Invoice Generation**

**Invoice Features:**
- Professional temple-branded invoice
- Invoice number (auto-generated from request ID)
- Member information (name, ID, email, address)
- Service details table
- Invoice items breakdown
- Total amount highlighted
- Payment instructions (for unpaid invoices)
- Status badge (Draft, Sent, Paid, Completed, Cancelled)
- Notes section
- Download as PDF

**Invoice Includes:**
- Temple header with contact info
- Invoice date and due date
- Bill to section
- Service description
- Itemized charges
- Payment status
- Payment instructions
- Professional footer

### 4. **Request Types**

- 🙏 **Puja** - Religious ceremonies and pujas
- 💝 **Sponsorship** - Event/program sponsorships
- 🙌 **Donation Request** - Specific donation requests
- ⚙️ **Service** - Temple services
- 🏛️ **Facility Rental** - Hall/facility rental
- 📋 **Other** - Miscellaneous requests

### 5. **Request Status Lifecycle**

```
Draft → Sent → Paid → Completed
         ↓
    Cancelled (optional)
```

**Status Definitions:**
- **Draft**: Request created but not sent to member (internal tracking)
- **Sent**: Invoice sent to member, awaiting payment
- **Paid**: Payment received, service can be scheduled/completed
- **Completed**: Service delivered and completed
- **Cancelled**: Request cancelled (refund may be needed)

## User Flows

### Staff Creating a Service Request
1. Navigate to **Admin → Requests**
2. Click **+ Create Request**
3. Search and select member
4. Fill in request details (type, date, description, amount)
5. Add notes if needed
6. Choose status (Draft or Sent)
7. Optionally send invoice email
8. Click **Create Request**

### Member Viewing and Paying Request
1. Navigate to **Member Dashboard → Service Requests**
2. View all requests and status
3. For "Sent" requests, click **Pay Now**
4. Complete payment via Stripe checkout
5. Payment recorded automatically
6. Status updates to "Paid"
7. Download invoice PDF for records

### Staff Processing Request Payment
1. Member pays in person or online
2. Navigate to **Admin → Requests**
3. Find the request
4. Click **View Details**
5. Update status to "Paid"
6. Or click **Record Payment** to link to payment record
7. Update to "Completed" when service is delivered

## Integration Points

### Payment System Integration
- Requests can link to payment records
- Payment status tracked in requests table
- "Pay Now" button for members (Sent status)
- Auto-update status when payment received
- Payment history shows request payments

### Member Dashboard Integration
- Quick action card: "Service Requests" → `/member/requests`
- Shows pending invoices count (future enhancement)

### Admin Navigation
- "Requests" menu item → `/admin/requests`

## Database Schema

### requests Table
```sql
requests (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  membership_id TEXT,
  request_type TEXT,
  service_description TEXT,
  requested_date DATE,
  amount DECIMAL(10,2),
  status request_status_enum,
  payment_id UUID REFERENCES payments(id),
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Request Status Enum
- Draft
- Sent
- Paid
- Completed
- Cancelled

## Common Use Cases

### 1. Puja Service Request
**Scenario**: Member requests specific puja on certain date

1. Staff creates request:
   - Type: Puja
   - Description: "Satyanarayana Puja for family"
   - Date: 2024-12-15
   - Amount: $151.00
   - Status: Sent

2. Invoice sent to member

3. Member pays online through portal

4. Status updates to Paid

5. Puja performed on requested date

6. Status updated to Completed

### 2. Event Sponsorship
**Scenario**: Member wants to sponsor Diwali festival

1. Staff creates request:
   - Type: Sponsorship
   - Description: "Diwali Festival Sponsorship - Annadanam"
   - Date: 2024-11-01
   - Amount: $501.00
   - Status: Sent

2. Member receives invoice

3. Member pays

4. Sponsorship acknowledged at event

5. Status: Completed

### 3. Facility Rental
**Scenario**: Member rents temple hall for family function

1. Staff creates request:
   - Type: Facility Rental
   - Description: "Main Hall rental - Birthday celebration"
   - Date: 2024-12-20
   - Amount: $300.00
   - Notes: "3 PM - 7 PM, includes A/V equipment"
   - Status: Sent

2. Member pays deposit

3. Event takes place

4. Status: Completed

## Security Features

- ✅ RLS policies protect requests table
- ✅ Members can only view their own requests
- ✅ Admin/Office Staff roles required to create/edit
- ✅ Payment integration is secure (Stripe)
- ✅ Invoice PDFs generated on-demand (not stored)

## Future Enhancements

### Email Integration
- Send invoice email automatically when status = Sent
- Payment confirmation email
- Service completion notification
- Overdue invoice reminders

### Online Payments
- Direct "Pay Now" integration with Stripe
- Auto-update status when payment succeeds
- Receipt generation after payment
- Refund processing for cancellations

### Recurring Requests
- Monthly puja subscriptions
- Recurring facility rentals
- Auto-generate requests on schedule

### Service Catalog
- Pre-defined service templates
- Standard pricing
- Quick request creation from catalog
- Service descriptions and requirements

### Request Templates
- Save common requests as templates
- Quick create from template
- Bulk request creation

### Analytics
- Revenue by request type
- Most requested services
- Member engagement metrics
- Seasonal trends

### Calendar Integration
- Show requested dates on calendar
- Prevent double-booking
- Send calendar invites
- Automated reminders

## Testing Checklist

**Admin:**
- [ ] Create new request with member search
- [ ] Create request as Draft
- [ ] Create request as Sent
- [ ] View all requests with filters
- [ ] Search requests
- [ ] Update request status
- [ ] Download invoice PDF
- [ ] Edit existing request

**Member:**
- [ ] View personal requests
- [ ] Filter by status
- [ ] See pending payment amount
- [ ] Download invoice PDF
- [ ] Pay request online (when integrated)

**Integration:**
- [ ] Request appears in member dashboard
- [ ] Payment links to request
- [ ] Status updates correctly
- [ ] Invoice PDF generates correctly

## Troubleshooting

### Invoice not generating
1. Check browser console for errors
2. Verify jspdf package is installed
3. Check request data is complete

### Member can't see request
1. Verify request.member_id matches member.id
2. Check RLS policies on requests table
3. Ensure request is not in Draft status (future: hide drafts from members)

### Status not updating
1. Check user has correct role (Office Staff, Manager, Admin)
2. Verify database permissions
3. Check server logs for errors

## API Endpoints (Future)

For mobile app or external integrations:

```
GET    /api/requests           - List all requests (admin)
GET    /api/requests/:id       - Get request details
POST   /api/requests           - Create new request
PATCH  /api/requests/:id       - Update request
DELETE /api/requests/:id       - Cancel request
GET    /api/requests/invoice/:id - Generate invoice PDF
POST   /api/requests/:id/pay   - Initiate payment
```

## Support

For request management questions:
- Admin Guide: Available in admin dashboard
- Member Guide: Available in member portal
- Technical Support: [contact info]

## Related Documentation

- **`../guides/setup/payments-setup.md`** - Payment system integration
- **`events-system.md`** - Events management
- **`../architecture/architecture.md`** - Complete database structure (see Database Schema section)
