# Test Accounts Membership ID Design Discussion

## Current Constraint Analysis

### Existing Constraints:
1. **Format Constraint:** `^[1-3][0-9]{5}00$`
   - Must start with 1, 2, or 3
   - Must be 8 digits
   - Must end with 00

2. **Prefix-Level Matching Constraint:**
   - Lifetime → prefix must be 1
   - Annual → prefix must be 2
   - Community → prefix must be 3

3. **Trigger:** `trigger_validate_membership_id_level`
   - Validates prefix matches level when level changes
   - Prevents mismatched IDs

---

## Option Analysis

### Option A: Modify Constraints to Allow Prefix 9 (Test Accounts Bypass)

**Changes Required:**
1. Update format constraint: `^[1-3,9][0-9]{5}00$` → allows 9 prefix
2. Update prefix-level constraint to exclude test accounts:
   ```sql
   CONSTRAINT chk_membership_id_prefix CHECK (
     is_test_account = TRUE OR (
       (current_level = 'Lifetime' AND LEFT(membership_id, 1) = '1') OR
       (current_level = 'Annual' AND LEFT(membership_id, 1) = '2') OR
       (current_level = 'Community' AND LEFT(membership_id, 1) = '3')
     )
   )
   ```
3. Update trigger to skip validation for test accounts

**Test Account IDs:**
- Test Manager (Lifetime): `99991000`
- Test Staff (Lifetime): `99992000`
- Test Lifetime Member: `99993000` (or `99991000` if we want level indication)
- Test Annual Member: `99994000`
- Test Community Member: `99995000`

**Pros:**
- ✅ Clearly identifies test accounts (9 prefix)
- ✅ Test accounts bypass level matching
- ✅ Regular accounts still enforced strictly
- ✅ Easy to filter: `WHERE membership_id LIKE '9%'`

**Cons:**
- ⚠️ Requires modifying existing constraints (migration needed)
- ⚠️ Need to update trigger logic

**Impact:**
- **Low Risk:** Only affects test accounts
- **No Impact on Production:** Regular accounts unchanged
- **Easy to Filter:** Can easily exclude test accounts from reports

---

### Option B: Use High-Numbered Valid Format (No Constraint Changes)

**No Changes Required:**
- Use valid format but high numbers
- Test accounts: `19999000`, `19999100`, `29999000`, `39999000`

**Pros:**
- ✅ No constraint changes needed
- ✅ Works immediately

**Cons:**
- ❌ Not visually distinct (looks like real accounts)
- ❌ Could conflict if real members reach these numbers
- ❌ Harder to filter (need to check specific ranges)

**Impact:**
- **Medium Risk:** Could conflict with real accounts in future
- **Harder to Maintain:** Need to track which ranges are test

---

## Recommended Solution: Option A with Level Indication

### Proposed Format:

**For Staff Accounts (no level indication needed):**
- Test Manager: `99991000` (prefix 9, staff indicator 1)
- Test Staff: `99992000` (prefix 9, staff indicator 2)

**For Member Accounts (with level indication in middle digits):**
- Test Lifetime: `99993000` (prefix 9, level indicator 3 = Lifetime)
- Test Annual: `99994000` (prefix 9, level indicator 4 = Annual)
- Test Community: `99995000` (prefix 9, level indicator 5 = Community)

**Pattern:** `9[staff/level][sequence]00`
- First digit: 9 (test account)
- Second digit: 1-2 (staff), 3-5 (member levels)
- Next 3 digits: sequence (000-999)
- Last 2 digits: 00

---

## Implementation Plan

### Step 1: Modify Constraints

```sql
-- Drop old constraint
ALTER TABLE members DROP CONSTRAINT IF EXISTS chk_membership_id_format;
ALTER TABLE members DROP CONSTRAINT IF EXISTS chk_membership_id_prefix;

-- Add new format constraint (allows 9 prefix)
ALTER TABLE members ADD CONSTRAINT chk_membership_id_format CHECK (
  membership_id ~ '^[1-3,9][0-9]{5}00$'
);

-- Add new prefix constraint (test accounts bypass level matching)
ALTER TABLE members ADD CONSTRAINT chk_membership_id_prefix CHECK (
  is_test_account = TRUE OR (
    (current_level = 'Lifetime' AND LEFT(membership_id, 1) = '1') OR
    (current_level = 'Annual' AND LEFT(membership_id, 1) = '2') OR
    (current_level = 'Community' AND LEFT(membership_id, 1) = '3')
  )
);
```

### Step 2: Update Trigger

```sql
-- Modify trigger to skip validation for test accounts
CREATE OR REPLACE FUNCTION validate_membership_id_on_level_change()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_prefix CHAR(1);
  v_actual_prefix CHAR(1);
BEGIN
  -- Skip validation for test accounts
  IF NEW.is_test_account = TRUE THEN
    RETURN NEW;
  END IF;

  -- Rest of validation logic...
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Update Test Accounts Migration

Use the new format:
- `99991000` - Test Manager
- `99992000` - Test Staff
- `99993000` - Test Lifetime
- `99994000` - Test Annual
- `99995000` - Test Community

---

## Impact Analysis

### If Test Accounts Bypass Constraint (Option A):

**✅ Benefits:**
- Test accounts can have any level with prefix 9
- No validation errors when creating test accounts
- Clear visual distinction (9 prefix)
- Easy filtering: `WHERE membership_id NOT LIKE '9%'`

**⚠️ Considerations:**
- Need to ensure `is_test_account` flag is set correctly
- Trigger needs to check `is_test_account` flag
- Constraint becomes slightly more complex

**🔒 Safety:**
- Regular accounts still fully protected
- Test accounts clearly marked
- Can't accidentally create real accounts with prefix 9 (constraint prevents it unless `is_test_account = TRUE`)

---

## Questions for You:

1. **Level Indication:** For the 3 member test accounts, do you want:
   - **Option A:** Use middle digits to indicate level (`99993000` = Lifetime, `99994000` = Annual, `99995000` = Community)
   - **Option B:** Just use sequential numbers (`99991000`, `99992000`, `99993000`)

2. **Constraint Modification:** Are you comfortable modifying the existing constraint? It's safe but requires a migration.

3. **Future Test Accounts:** If you create more test accounts later, should they:
   - Use prefix 9 with sequential numbers?
   - Follow the same pattern?

---

## My Recommendation:

**Use Option A with level indication:**
- `99991000` - Test Manager (Lifetime level, but prefix 9)
- `99992000` - Test Staff (Lifetime level, but prefix 9)
- `99993000` - Test Lifetime Member (prefix 9, middle digit 3 = Lifetime)
- `99994000` - Test Annual Member (prefix 9, middle digit 4 = Annual)
- `99995000` - Test Community Member (prefix 9, middle digit 5 = Community)

This gives you:
- ✅ Clear test account identification (9 prefix)
- ✅ Level indication for member accounts
- ✅ Easy filtering and reporting
- ✅ No impact on regular accounts

**What do you think?**
