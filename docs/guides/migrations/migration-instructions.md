# Database Migration Instructions

> **Historical — these migrations are already applied.**
> A one-off instruction sheet from when the migrations were new. Both databases are migrated; running these again is not needed. Note the filenames here are also out of date.
> It is kept for background and is deliberately NOT updated as the code changes,
> so expect stale filenames, routes, component names, colours and URLs.
> For current state see [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) and
> [`docs/PRIORITY-ROADMAP.md`](../../PRIORITY-ROADMAP.md).

## Running Migrations

To apply the latest database migrations, you need to execute the SQL files in your Supabase dashboard.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to **SQL Editor**

2. **Run Migration Files**
   Execute the following migration files in order:

   **Import Batch Tracking (Required for CSV Import feature):**
   - File: `supabase/migrations/20260108000001_import_batch_tracking.sql`
   - Copy the entire contents and paste into SQL Editor
   - Click "Run" to execute

   **Service Booking System (Coming next):**
   - File: `supabase/migrations/20260108000002_service_booking_system.sql`
   - (Will be created next)

### Verify Migration Success

After running each migration, verify it was successful:

```sql
-- Check if import_batches table exists
SELECT * FROM import_batches LIMIT 1;

-- Check if import_batch_id column was added to members
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'members' AND column_name = 'import_batch_id';
```

### Rollback (If Needed)

If you need to rollback the import batch tracking migration:

```sql
-- Remove the column from members table
ALTER TABLE members DROP COLUMN IF EXISTS import_batch_id;

-- Drop the import_batches table
DROP TABLE IF EXISTS import_batches CASCADE;
```

## Current Migrations

- ✅ `20260104000001_initial_schema.sql` - Initial database schema
- ✅ `20260104000002_rls_policies.sql` - Row Level Security policies
- ✅ `20260108000001_import_batch_tracking.sql` - Import batch tracking
- ✅ `20260108000002_service_booking_system.sql` - Service booking system
- ✅ `20260108000003_initial_services_data.sql` - Initial services data
- 🆕 `20260108000004_member_audit_log.sql` - Member audit log system

---

## 🆕 Latest Migration: Member Audit Log System

**File:** `supabase/migrations/20260108000004_member_audit_log.sql`

**What it does:**
- Creates `member_audit_log` table to track all member creation and changes
- Adds triggers to automatically log member creation and field changes
- Sets up RLS policies for role-based access
- Tracks creation source (Auto Import, Self-Registration, Office Staff, etc.)
- Logs all field changes except `first_name`, `last_name`, and `membership_id`

**How to Run:**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Open the file: `supabase/migrations/20260108000004_member_audit_log.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** to execute

3. **Verify Migration Success**

   ```sql
   -- Check if member_audit_log table exists
   SELECT * FROM member_audit_log LIMIT 1;
   
   -- Check if triggers exist
   SELECT trigger_name, event_manipulation, event_object_table
   FROM information_schema.triggers
   WHERE event_object_table = 'members'
   AND trigger_name LIKE '%audit%';
   
   -- Should show:
   -- trigger_log_member_creation
   -- trigger_log_member_changes
   ```

**What Happens After Migration:**
- All new member creations will be automatically logged
- All member field changes will be automatically logged
- You can query audit logs via the API routes we created
- UI components can now display audit history

**Note:** Existing members won't have creation logs (only new ones going forward), but all future changes will be tracked.
