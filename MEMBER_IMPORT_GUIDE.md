# Member Import Guide

**Last Updated:** 2026-01-09

## Overview

The member import system allows you to bulk import member data from CSV files with full rollback capabilities. Every import is tracked, and you can revert (delete) any import batch with one click.

---

## 🛡️ Safety First - Can I Undo an Import?

### ✅ YES! Full Rollback Capability

Every import can be **completely reverted** (deleted) from the Import History page:

**What happens when you revert:**
- All members from that specific import batch are **permanently deleted**
- Other members (manual or from other imports) are **not affected**
- The import record is marked as "Reverted" for audit trail
- **This action cannot be undone** - data is permanently removed

**Protection measures:**
1. ✅ Confirmation dialog shows exact number of members to be deleted
2. ✅ Clear warning that deletion is permanent
3. ✅ Only affects the specific import batch
4. ✅ Manually added members are never touched
5. ✅ Cannot revert the same batch twice

---

## 📋 Import Process Step-by-Step

### Step 1: Prepare Your CSV File

**Required Columns:**
- `First Name` (required for Personal members)
- `Email` (required)
- `Membership Level` (Community, Annual, or Lifetime)
- `Member Class` (Personal or Business)

**Optional Columns:**
- `Last Name`
- `Phone`
- `Address` (format: "Street, City, State ZipCode")
- `Member Since` (date)
- `Is Founding Member` (Yes/No)
- `Gothram`
- `Nakshatra`
- `Business Name` (required for Business members)
- `EIN`
- `Secondary First Name`
- `Secondary Last Name`
- `Secondary Email`
- `Secondary Phone`

**Example CSV:**
```csv
First Name,Last Name,Email,Phone,Address,Member Since,Membership Level,Member Class,Is Founding Member,Gothram,Nakshatra
John,Doe,john.doe@example.com,904-555-0123,"123 Main St, Jacksonville, FL 32256",2020-01-15,Lifetime,Personal,Yes,Bharadwaja,Rohini
```

### Step 2: Upload and Preview

1. Go to **Dashboard → Members → Import CSV** (`/admin/members/import`)
2. Click **"Choose File"** and select your CSV
3. System automatically parses and validates the file
4. **Review the preview table:**
   - ✅ Green checkmark = Valid row (will be imported)
   - ✗ Red X = Invalid row (will be skipped)
   - Red background = Row has validation errors
   - Errors column shows what needs fixing

**Preview shows:**
- Status (✓ valid or ✗ invalid)
- Parsed name, email, address
- Membership level
- Any validation errors

### Step 3: Review Validation Results

**At the top of preview:**
- **✓ X Valid** - Number of rows that will be imported
- **✗ X Invalid** - Number of rows with errors (will be skipped)

**Common validation errors:**
- Invalid email format
- Missing required fields (First Name, Email)
- Missing Business Name for Business members

**What happens to invalid rows:**
- They are **skipped automatically**
- Not imported into the database
- Listed in the errors section after import

### Step 4: Confirm and Import

1. Click **"Import X Valid Members"** button
2. Confirmation dialog: "Import X valid members? (Y will be skipped due to errors)"
3. Click **OK** to proceed
4. System creates a unique **Batch ID** (e.g., `IMP-20260109-A3F2`)
5. Imports valid members one by one
6. Shows real-time progress

### Step 5: Review Import Results

**After import completes:**

**Success Summary:**
- Batch ID (save this for reference!)
- Number of successful imports
- Number of failed imports
- Link to Import History

**If there are errors:**
- Detailed error list shown
- Format: "email@example.com: error message"
- Common errors: duplicate emails, database constraints

**Next Steps:**
- Click **"View Import History"** to see the batch
- Click **"View Members"** to see imported members
- Click **"Import Another File"** to import more

---

## 🔄 Reverting an Import (Rollback)

### When to Revert:

- Imported wrong file
- Data has errors that need fixing
- Need to re-import with corrections
- Testing the import process

### How to Revert:

1. **Go to Import History**
   - Dashboard → Settings → Import History
   - Or: `/admin/members/import-history`

2. **Find the import batch**
   - Listed from newest to oldest
   - Shows Batch ID, filename, date
   - Shows success/failed counts

3. **Click "Revert" button**
   - Only available for "Completed" imports
   - Grayed out for already-reverted imports

4. **Confirm deletion**
   - Dialog shows:
     - Batch number
     - Number of members to delete
     - "This action CANNOT be undone!"
   - Click **OK** to proceed

5. **Deletion happens instantly**
   - All members from that batch are deleted
   - Batch status changes to "Reverted"
   - Shows who reverted and when

**After Revert:**
- Members are **permanently deleted** from database
- Import record remains (marked as "Reverted")
- Can import a corrected file if needed

---

## 📊 Import History Page

### What You See:

**Batch Information:**
- **Batch ID** - Unique identifier (e.g., IMP-20260109-A3F2)
- **File Name** - Original CSV filename
- **Imported By** - Staff member who ran the import
- **Date** - When import was run
- **Records** - Success/failed counts
- **Status** - Completed or Reverted

**Status Indicators:**
- 🟢 **Completed** - Import successful, members in database
- 🔴 **Reverted** - Import was rolled back, members deleted

**For Reverted Batches:**
- Shows who reverted
- Shows when reverted
- "Revert" button is disabled (can't revert twice)

---

## ⚠️ Important Warnings

### What Revert DOES:
- ✅ Deletes ALL members from that specific import batch
- ✅ Permanent deletion - cannot be recovered
- ✅ Only affects members from that batch

### What Revert DOES NOT Do:
- ❌ Does NOT delete manually added members
- ❌ Does NOT delete members from other imports
- ❌ Does NOT delete test accounts
- ❌ Does NOT affect payments, bookings, or other data

### Critical Notes:
1. **Revert is permanent** - There's no "undo" button
2. **Make backups** - If you're unsure, export member list first
3. **Test with small files first** - Import 5-10 records to test
4. **Cannot revert twice** - Once reverted, batch status is final
5. **Related data** - If members have payments/bookings, consider carefully

---

## 🧪 Testing Your Import (Recommended First-Time Process)

### Safe Testing Process:

**1. Test with Small File First**
- Create a CSV with 3-5 test members
- Use test.import@example.com type emails
- Import and verify everything looks good

**2. Review Imported Data**
- Go to Members list
- Check that data parsed correctly
- Verify addresses, phones, levels are correct

**3. Practice Reverting**
- Go to Import History
- Revert the test import
- Verify members are deleted
- Confirms rollback works!

**4. Import Real Data**
- Now import your real member list
- You know the process works
- You know you can revert if needed

**5. Verify Real Import**
- Check member count is correct
- Spot-check a few member records
- Verify membership levels are assigned correctly

**6. Keep Batch ID**
- Save the Batch ID somewhere safe
- You'll need it if you need to revert later

---

## 📝 Best Practices

### Before Import:
- ✅ Clean your CSV data (remove duplicates, fix emails)
- ✅ Test with a small file first (5-10 records)
- ✅ Backup existing member list (export to CSV)
- ✅ Make sure addresses follow format: "Street, City, State ZIP"
- ✅ Verify email addresses are valid
- ✅ Check membership levels are spelled correctly

### During Import:
- ✅ Review the preview carefully
- ✅ Check validation errors before proceeding
- ✅ Fix errors in CSV and re-upload if many invalid rows
- ✅ Note the Batch ID after import completes
- ✅ Review import results before navigating away

### After Import:
- ✅ Spot-check imported members in Members list
- ✅ Verify counts match expected (minus invalid rows)
- ✅ Check that membership levels are correct
- ✅ Review import history page to confirm batch exists
- ✅ Keep a record of Batch ID for future reference

### If Something Goes Wrong:
- ✅ Don't panic - you can revert!
- ✅ Go to Import History immediately
- ✅ Click "Revert" to delete the import
- ✅ Fix your CSV file
- ✅ Import again with corrected data

---

## 🔍 Common Issues & Solutions

### Issue: "Invalid email format" errors
**Solution:**
- Check emails have proper format: name@domain.com
- Remove spaces before/after emails
- Fix typos (e.g., .cm instead of .com)

### Issue: "Missing name" errors
**Solution:**
- For Personal members: Provide First Name
- For Business members: Provide Business Name
- Check Member Class column is correct

### Issue: Members not appearing after import
**Solution:**
1. Check import results - were they successful?
2. Check Members list with search/filters
3. Verify import batch in Import History shows success count
4. Check test data toggle (if testing) - see TEST_ACCOUNTS_GUIDE.md

### Issue: Wrong membership levels assigned
**Solution:**
1. Revert the import immediately
2. Fix "Membership Level" column in CSV
3. Use: Community, Annual, or Lifetime (case-insensitive)
4. Re-import corrected file

### Issue: Addresses not parsing correctly
**Solution:**
1. Use format: "Street Address, City, State ZipCode"
2. Example: "123 Main Street, Jacksonville, FL 32256"
3. System auto-parses into separate fields
4. If still issues, revert and fix CSV

### Issue: Duplicate members
**Solution:**
- System rejects duplicate emails (unique constraint)
- These will show as "failed" in import results
- Check errors list for "duplicate key" messages
- Remove duplicates from CSV before importing

### Issue: Can't revert an import
**Solution:**
- Check batch status - already reverted?
- Only "Completed" imports can be reverted
- "Reverted" imports cannot be reverted again
- If urgent, contact database admin

---

## 🎯 Quick Reference

### Import Location:
```
Dashboard → Members → Import CSV
OR
/admin/members/import
```

### Import History Location:
```
Dashboard → Settings → Import History
OR
/admin/members/import-history
```

### CSV Format:
```csv
First Name,Last Name,Email,Phone,Address,Member Since,Membership Level,Member Class,Is Founding Member,Gothram,Nakshatra
John,Doe,john@example.com,904-555-0123,"123 Main St, Jacksonville, FL 32256",2020-01-15,Lifetime,Personal,Yes,Bharadwaja,Rohini
```

### Revert Process:
```
1. Import History → Find batch → Click "Revert"
2. Confirm deletion (PERMANENT!)
3. Members deleted instantly
4. Batch marked as "Reverted"
```

---

## 📞 Support

If you encounter issues:
1. Check Import History for batch status
2. Review import results for specific errors
3. Try reverting and re-importing with fixes
4. Check this guide for common issues
5. Verify CSV format matches requirements

**Emergency Rollback:**
- Go to Import History immediately
- Click "Revert" next to the import
- Confirm deletion
- All imported members will be removed

---

## ✅ Summary - You're Protected!

**Don't worry!** The import system has full rollback capability:

1. ✅ **Every import is tracked** with unique Batch ID
2. ✅ **One-click revert** from Import History page
3. ✅ **Permanent deletion** of import batch (not other data)
4. ✅ **Full audit trail** of who imported/reverted and when
5. ✅ **Preview before import** so you see what will happen
6. ✅ **Validation** catches errors before import
7. ✅ **Test-friendly** - import test data, verify, then revert

**You can confidently import knowing you can always revert if needed!**

---

**First-time import checklist:**
- [ ] Test with 3-5 test members first
- [ ] Verify test import looks good
- [ ] Practice reverting the test import
- [ ] Import real data
- [ ] Spot-check a few imported members
- [ ] Save the Batch ID for your records
- [ ] Celebrate - you did it! 🎉
