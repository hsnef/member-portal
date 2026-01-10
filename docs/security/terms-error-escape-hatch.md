# Terms Acceptance - Error Escape Hatch

## Overview

The error escape hatch provides a safety mechanism when users encounter technical difficulties accepting terms. After **3 failed attempts**, users can bypass the requirement temporarily while:
- The incident is logged for admin review
- Users are re-prompted on their next login
- No one gets permanently blocked due to technical errors

---

## How It Works

### User Experience

1. **Attempt 1-2:** Normal retry with error message
   ```
   "Failed to record acceptance. Please try again. (Attempt 1/3)"
   ```

2. **Attempt 3:** Escape hatch appears
   ```
   "We're experiencing technical difficulties. After 3 failed attempts,
    you can continue anyway or contact support."

   [Continue Anyway] button appears
   ```

3. **After Bypass:**
   - User can access the portal
   - Incident logged in database
   - User will be re-prompted on next login

### Admin Visibility

All bypass incidents are recorded in the `terms_acceptance_bypasses` table:

```sql
SELECT
  m.membership_id,
  m.primary_email,
  tab.terms_version,
  tab.retry_count,
  tab.error_message,
  tab.bypassed_at,
  tab.ip_address,
  tab.resolved
FROM terms_acceptance_bypasses tab
JOIN members m ON tab.member_id = m.id
WHERE tab.resolved = false
ORDER BY tab.bypassed_at DESC;
```

---

## Database Schema

### `terms_acceptance_bypasses` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `member_id` | UUID | Reference to member |
| `auth_user_id` | UUID | Reference to auth user |
| `terms_version` | VARCHAR(20) | Version bypassed |
| `terms_content_id` | UUID | Terms content ID |
| `bypassed_at` | TIMESTAMPTZ | When bypass occurred |
| `error_message` | TEXT | Error that caused bypass |
| `retry_count` | INTEGER | Number of failed attempts |
| `ip_address` | TEXT | User's IP address |
| `user_agent` | TEXT | User's browser info |
| `resolved` | BOOLEAN | Admin reviewed? |
| `resolved_at` | TIMESTAMPTZ | When admin resolved |
| `resolved_by` | UUID | Which admin resolved |
| `resolution_notes` | TEXT | Admin notes |
| `should_reprompt` | BOOLEAN | Re-prompt on next login? |
| `reprompted_at` | TIMESTAMPTZ | When re-prompted |

---

## Admin Queries

### View Unresolved Bypasses

```sql
-- All unresolved bypasses
SELECT
  m.membership_id,
  m.first_name,
  m.last_name,
  m.primary_email,
  tab.terms_version,
  tab.retry_count,
  tab.error_message,
  tab.bypassed_at,
  tab.should_reprompt
FROM terms_acceptance_bypasses tab
JOIN members m ON tab.member_id = m.id
WHERE tab.resolved = false
ORDER BY tab.bypassed_at DESC;
```

### View Bypass Statistics

```sql
-- Bypass counts by day
SELECT
  DATE(bypassed_at) as bypass_date,
  COUNT(*) as bypass_count,
  COUNT(DISTINCT member_id) as unique_members
FROM terms_acceptance_bypasses
WHERE bypassed_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(bypassed_at)
ORDER BY bypass_date DESC;

-- Most common error messages
SELECT
  error_message,
  COUNT(*) as occurrence_count
FROM terms_acceptance_bypasses
WHERE bypassed_at > NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY occurrence_count DESC
LIMIT 10;
```

### Mark Bypass as Resolved

```sql
-- After investigating and fixing the issue
UPDATE terms_acceptance_bypasses
SET
  resolved = true,
  resolved_at = NOW(),
  resolved_by = 'YOUR_ADMIN_USER_ID',
  resolution_notes = 'Database connection issue resolved. User accepted terms successfully after fix.',
  should_reprompt = false
WHERE id = 'BYPASS_ID';
```

### Manually Record Terms Acceptance

If a user bypassed due to error and you want to manually record their acceptance:

```sql
-- Insert acceptance record
INSERT INTO terms_acceptances (
  member_id,
  auth_user_id,
  terms_version,
  terms_content_id,
  ip_address,
  user_agent,
  acceptance_method
)
SELECT
  member_id,
  auth_user_id,
  terms_version,
  terms_content_id,
  ip_address,
  user_agent,
  'admin_override'
FROM terms_acceptance_bypasses
WHERE id = 'BYPASS_ID';

-- Then mark bypass as resolved
UPDATE terms_acceptance_bypasses
SET
  resolved = true,
  resolved_at = NOW(),
  resolved_by = auth.uid(),
  resolution_notes = 'Manually recorded acceptance on behalf of user',
  should_reprompt = false
WHERE id = 'BYPASS_ID';
```

---

## Monitoring & Alerts

### Create Alert for High Bypass Rate

If you see many bypasses, investigate:

```sql
-- Alert: More than 5 bypasses in last hour
SELECT COUNT(*) as recent_bypasses
FROM terms_acceptance_bypasses
WHERE bypassed_at > NOW() - INTERVAL '1 hour';
```

### Common Issues

1. **Database connectivity issues**
   - Check Supabase status
   - Review API error logs

2. **RLS policy problems**
   - Verify user roles
   - Check policy permissions

3. **Network/timeout issues**
   - Check client-side network logs
   - Verify API response times

---

## Configuration

### Adjust Retry Limit

Edit `MAX_RETRY_ATTEMPTS` in `components/TermsAcceptanceModal.tsx`:

```typescript
const MAX_RETRY_ATTEMPTS = 3  // Change this value
```

**Recommended:** Keep at 3 to balance user experience with enforcement

---

## Testing the Escape Hatch

### Simulate Failure (for testing)

Temporarily modify `app/api/accept-terms/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // FOR TESTING ONLY - Remove after testing
  return NextResponse.json(
    { error: 'Simulated failure for testing' },
    { status: 500 }
  )

  // ... rest of code
}
```

Then:
1. Login to portal
2. Try to accept terms
3. After 3 attempts, "Continue Anyway" button appears
4. Click it to bypass
5. Check database for bypass record
6. **Remove the test code**

---

## Security Considerations

✅ **What's Protected:**
- All bypasses are logged with IP, timestamp, user agent
- Admin can review all bypass incidents
- Users are re-prompted on next login
- No permanent bypass (always re-checks)

⚠️ **Limitations:**
- Users can access portal temporarily without acceptance
- Malicious users could repeatedly bypass (but it's logged)

💡 **Mitigation:**
- Monitor bypass frequency per user
- Set up alerts for high bypass rates
- Review bypass logs weekly
- Consider rate limiting after investigation

---

## Future Enhancements

### 1. Admin Dashboard Widget

Create `/admin/terms-bypasses` page showing:
- Recent bypasses
- Unresolved count
- Trending error messages
- Quick resolve actions

### 2. Email Notifications

Send email to admins when:
- User bypasses terms (immediate)
- More than 10 bypasses in 1 hour (alert)

### 3. Auto-Resolution

Automatically mark bypass as resolved when user successfully accepts terms on next login.

### 4. Rate Limiting

Block users who bypass more than X times in Y days.

---

## Deployment Checklist

Before deploying to production:

- [ ] Run migration `20260109000001_terms_bypass_tracking.sql`
- [ ] Verify bypass tracking table exists
- [ ] Test escape hatch appears after 3 failures
- [ ] Test bypass records in database
- [ ] Test re-prompting on next login
- [ ] Set up admin monitoring query
- [ ] Document bypass review process for team
- [ ] Remove any test/simulation code

---

**Last Updated:** 2026-01-09
**Status:** ✅ Production Ready
