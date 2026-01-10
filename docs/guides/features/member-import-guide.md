# Member Import Guide

**Last Updated:** 2026-01-09

## Overview

The member import system allows you to bulk import member data from CSV files with full rollback capabilities. The new enhanced import system supports:

- ✅ **Auto-generated Member Numbers** with format validation
- ✅ **Family Member Management** - Primary, Secondary, and up to 4 children per membership
- ✅ **Business Member Support** with EIN tracking
- ✅ **International Phone Numbers** with country code support
- ✅ **Smart Address Parsing** from Mailing_Address format
- ✅ **Full Rollback Capability** - revert any import with one click

---

## 📥 Download CSV Template

Download the ready-to-use CSV template with examples:
- **Location:** `public/member-import-template.csv`
- **Direct Link:** [member-import-template.csv](/member-import-template.csv)

The template includes 5 example rows showing:
1. Personal Lifetime member with 2 children
2. Personal Annual member with pre-filled Member_Number
3. Business member
4. International member with UK phone numbers
5. Family with 4 children (maximum supported)

---

## 🛡️ Safety First - Can I Undo an Import?

### ✅ YES! Full Rollback Capability

Every import can be **completely reverted** (deleted) from the Import History page:

**What happens when you revert:**
- All members from that specific import batch are **permanently deleted**
- All family members associated with those memberships are deleted
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

## 📋 CSV Column Reference

### Required Columns (Only 2!)

| Column | Required | Description |
|--------|----------|-------------|
| `Member_First_Name` | **YES** | First name of primary member |
| `Member_Last_Name` | **YES** | Last name of primary member |

**All other columns are optional!**

### Member Information Columns

| Column | Format | Description |
|--------|--------|-------------|
| `Member_Number` | 8 digits: XXYYZZZZ | Leave blank to auto-generate, or provide in format XXYYZZZZ |
| `Member_Class` | Personal \| Business | Defaults to "Personal" |
| `Member_Type` | Community \| Annual \| Lifetime | Defaults to "Community" |
| `Member_Profile_Name` | Text | Display name for member profile (auto-generated from First_Name + Last_Name if blank) |
| `Member_Since` | Date (YYYY-MM-DD) | Membership start date |
| `Family_Gotra` | Text | Family gotra/gothram |

### Business Member Columns

| Column | Format | Description |
|--------|--------|-------------|
| `Business_Name` | Text | Business name (auto-defaults to First_Name + Last_Name if blank for Business class) |
| `Business_EIN` | Text | Employer Identification Number |

### Primary Member Contact Columns

| Column | Format | Description |
|--------|--------|-------------|
| `Primary_Member_Email_Address` | email@domain.com | Primary member's email address |
| `Primary_Phone_Number_1` | Phone | Primary phone (will be normalized with country code) |
| `Primary_Phone_Number_2` | Phone | Alternate phone (will be normalized with country code) |
| `Member_Nakshatra` | Text | Primary member's nakshatra |

### Secondary Member Columns

| Column | Format | Description |
|--------|--------|-------------|
| `Secondary_First_Name` | Text | Secondary member first name |
| `Secondary_Last_Name` | Text | Secondary member last name |
| `Secondary_Email` | email@domain.com | Secondary member email |
| `Secondary_Phone_Number` | Phone | Secondary member phone |
| `Secondary_Nakshatra` | Text | Secondary member nakshatra |

### Children Columns (Repeat for Child_1, Child_2, Child_3, Child_4)

| Column | Format | Description |
|--------|--------|-------------|
| `Child_1_First_Name` | Text | Child 1 first name |
| `Child_1_Last_Name` | Text | Child 1 last name |
| `Child_1_Email` | email@domain.com | Child 1 email (can be same as parent email) |
| `Child_1_Nakshatra` | Text | Child 1 nakshatra |

*Repeat for Child_2, Child_3, Child_4*

### Address Columns (Two Options)

**Option 1: Individual Fields**
| Column | Format | Description |
|--------|--------|-------------|
| `Address_1` | Text | Street address line 1 |
| `Address_2` | Text | Street address line 2 (Apt, Suite, etc.) |
| `City` | Text | City |
| `State` | Text | State/Province |
| `Zip` | Text | ZIP/Postal code |
| `Country` | Text | Country |

**Option 2: Mailing_Address Field**
| Column | Format | Description |
|--------|--------|-------------|
| `Mailing_Address` | Full address string | "Street, City, State Zip, Country" - will be auto-parsed |

**Smart Parsing Logic:**
- If individual address fields (Address_1, City, State, Zip) are provided, use those
- If all address fields are empty, parse Mailing_Address into components
- Example Mailing_Address: `"123 Main St, Jacksonville, FL 32256, USA"`

---

## 🔢 Member_Number Format

### Auto-Generation (Recommended)

Leave `Member_Number` blank and the system will auto-generate:
- Format: `XXYYZZZZ` (8 digits)
- XX = Member_Class prefix (11=Personal, 21=Business)
- YY = Member_Type prefix (00=Community, 01=Annual, 02=Lifetime)
- ZZZZ = Sequential number (auto-incremented)

**Examples:**
- `11010001` = Personal, Annual, #0001
- `21020015` = Business, Lifetime, #0015

### Manual Entry

If you provide a Member_Number, the system will:
1. ✅ Validate it's exactly 8 digits
2. ✅ Validate class prefix matches Member_Class
3. ✅ Validate type prefix matches Member_Type
4. ✅ Check for duplicates in database
5. ❌ Reject if invalid or duplicate

**Validation Rules:**
- Must be exactly 8 digits
- First 2 digits: 11 (Personal) or 21 (Business)
- Next 2 digits: 00 (Community), 01 (Annual), 02 (Lifetime)
- Must match Member_Class and Member_Type columns

---

## 📞 Phone Number Handling

### International Support

The system automatically normalizes phone numbers:

**Auto-Detection:**
- If starts with `+`, keeps the country code as-is
- If starts with `1` and has 11 digits, adds `+` prefix
- Otherwise, defaults to US `+1` country code

**Examples:**
| Input | Normalized Output |
|-------|-------------------|
| `904-555-1234` | `+19045551234` |
| `(904) 555-1234` | `+19045551234` |
| `+44 20 1234 5678` | `+442012345678` |
| `+91 98765 43210` | `+919876543210` |
| `19045551234` | `+19045551234` |

**All non-digit characters (except leading +) are removed automatically**

---

## 👨‍👩‍👧‍👦 Family Members

### How It Works

Each membership imports:
- **1 Primary Member** - From Member_First_Name, Member_Last_Name columns
- **1 Secondary Member** (optional) - From Secondary_First_Name, Secondary_Last_Name
- **Up to 4 Children** (optional) - From Child_1 through Child_4 columns

**What's Created:**
1. Main `members` record (the membership)
2. Separate `family_members` records for each person
   - Primary member entry
   - Secondary member entry (if provided)
   - Child entries (if provided)

### Searching by Family Members

You can search for members by:
- Primary member name
- Secondary member name
- Children names
- Any family member email

All family data is stored relationally and fully searchable!

---

## 🏢 Business Members

### Business-Specific Fields

| Field | Required? | Description |
|-------|-----------|-------------|
| `Member_Class` | Set to "Business" | Identifies this as a business membership |
| `Business_Name` | Recommended | Business name (auto-defaults to First_Name + Last_Name if blank) |
| `Business_EIN` | Optional | Employer Identification Number |

### Auto-Defaulting Logic

If `Member_Class` = "Business" and `Business_Name` is blank:
- System automatically sets `Business_Name` = `Member_First_Name` + `Member_Last_Name`
- Useful when business owner's name is the business name

**Example:**
```csv
Member_Class,Business_Name,Member_First_Name,Member_Last_Name
Business,,Kumar,Tech Solutions
```
↓ **Auto-defaults to:**
```
Business_Name: "Kumar Tech Solutions"
```

---

## 📋 Import Process Step-by-Step

### Step 1: Prepare Your CSV File

**Download the Template:**
1. Go to `/public/member-import-template.csv`
2. Open in Excel, Google Sheets, or text editor
3. Study the example rows
4. Replace with your actual member data

**CSV Tips:**
- Keep the header row exactly as-is (column names matter!)
- Delete the example rows before importing
- Use UTF-8 encoding for special characters
- Save as `.csv` format

### Step 2: Upload and Preview

1. Go to **Dashboard → Members → Import CSV** (`/admin/members/import`)
2. Click **"Choose File"** and select your CSV
3. System automatically:
   - Filters out empty rows
   - Validates all data
   - Parses addresses and phone numbers
   - Generates Member_Numbers if needed
4. **Review the preview table:**
   - ✅ Green checkmark = Valid row (will be imported)
   - ✗ Red X = Invalid row (will be skipped)
   - Red background = Row has validation errors
   - Errors column shows what needs fixing

**Preview Columns:**
- **Status** - ✓ valid or ✗ invalid
- **Member #** - Generated or provided number (shows "Auto-gen" if blank)
- **Profile Name** - Member_Profile_Name or Business_Name
- **Type** - Membership level badge
- **Class** - Personal or Business badge
- **Family** - Count of family members (e.g., "3 members: P+S+1C")
- **City/State** - Parsed location
- **Errors** - Validation error messages

### Step 3: Review Validation Results

**At the top of preview:**
- **✓ X Valid** - Number of rows that will be imported
- **✗ X Invalid** - Number of rows with errors (will be skipped)

**Common validation errors:**
- `Member_First_Name is required`
- `Member_Last_Name is required`
- `Invalid Primary_Member_Email_Address format`
- `Member_Number: Invalid format` (must be 8 digits)
- `Member_Number: Already exists in database`
- `Member_Number: Doesn't match Member_Class`

**What happens to invalid rows:**
- They are **skipped automatically**
- Not imported into the database
- Listed in the errors section after import
- You can fix the CSV and re-import

### Step 4: Confirm and Import

1. Click **"Import X Valid Members"** button
2. Confirmation dialog: "Import X valid members? (Y will be skipped due to errors)"
3. Click **OK** to proceed
4. System creates a unique **Batch ID** (e.g., `IMP-20260109-A3F2`)
5. For each valid row:
   - Generates Member_Number if blank
   - Checks Member_Number uniqueness
   - Creates member record
   - Creates family_members records
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
- Format: "member_email@example.com: error message"
- Common errors:
  - Duplicate Member_Number during batch
  - Database constraint violations
  - Family member insertion failures

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
- Member_Numbers were auto-generated incorrectly

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
   - All family_members are deleted (CASCADE)
   - Batch status changes to "Reverted"
   - Shows who reverted and when

**After Revert:**
- Members are **permanently deleted** from database
- Import record remains (marked as "Reverted")
- Can import a corrected file if needed

---

## 🔍 Common Issues & Solutions

### Issue: "Member_First_Name is required" or "Member_Last_Name is required"

**Solution:**
- These are the only 2 required fields
- Check CSV has values in these columns
- Remove completely empty rows
- Ensure no accidental spaces instead of names

### Issue: "Invalid Primary_Member_Email_Address format"

**Solution:**
- Check email format: `name@domain.com`
- Remove spaces before/after email
- Fix typos (`.cm` → `.com`)
- Emails are optional - can be blank

### Issue: "Member_Number: Invalid format"

**Solution:**
- Must be exactly 8 digits: `XXYYZZZZ`
- First 2 digits must be `11` (Personal) or `21` (Business)
- Next 2 digits must be `00`, `01`, or `02`
- Leave blank to auto-generate (recommended)

### Issue: "Member_Number: Already exists in database"

**Solution:**
- Member_Numbers must be unique
- Check if member already imported
- Leave Member_Number blank to auto-generate new one
- Or provide a different unique number

### Issue: "Member_Number: Doesn't match Member_Class"

**Solution:**
- Personal members must start with `11`
- Business members must start with `21`
- Fix Member_Class or Member_Number
- Or leave Member_Number blank to auto-generate

### Issue: Members imported but can't find them

**Solution:**
1. Check import results - were they successful?
2. Search by Member_Number in members list
3. Check family member names (might be searching wrong name)
4. Verify import batch in Import History shows success count

### Issue: Phone numbers look weird

**Solution:**
- All phones normalized with country code (e.g., `+19045551234`)
- This is correct - enables international support
- Display formatting can be added in UI later

### Issue: Address not parsing from Mailing_Address

**Solution:**
- Check format: "Street, City, State Zip, Country"
- Example: "123 Main St, Jacksonville, FL 32256, USA"
- Commas are important!
- Or use individual Address_1, City, State, Zip columns instead

### Issue: 999 empty rows imported

**Solution:**
- This is fixed! Empty rows are now automatically filtered
- CSV files with trailing empty rows are handled correctly
- Only rows with actual data are imported

### Issue: Business_Name is blank for Business member

**Solution:**
- If blank, system auto-defaults to First_Name + Last_Name
- To avoid this, provide explicit Business_Name in CSV
- Example: Leave blank for "Kumar Tech" → auto-fills "Kumar Tech"

---

## 🧪 Testing Your Import (Recommended First-Time Process)

### Safe Testing Process:

**1. Test with Small File First**
- Copy 3-5 rows from template
- Use test emails like `test1@example.com`
- Leave Member_Number blank to test auto-generation
- Import and verify everything looks good

**2. Review Imported Data**
- Go to Members list
- Check that Member_Numbers were generated correctly
- Search for family member names
- Verify addresses, phones, levels are correct

**3. Practice Reverting**
- Go to Import History
- Revert the test import
- Verify members AND family members are deleted
- Confirms rollback works!

**4. Import Real Data**
- Now import your real member list
- You know the process works
- You know you can revert if needed

**5. Verify Real Import**
- Check member count is correct
- Spot-check a few member records
- Check family members are linked correctly
- Verify Member_Numbers follow correct format

**6. Keep Batch ID**
- Save the Batch ID somewhere safe
- You'll need it if you need to revert later

---

## 📝 Best Practices

### Before Import:

- ✅ Download and use the provided CSV template
- ✅ Keep all 42 column headers (even if some are blank)
- ✅ Leave Member_Number blank for auto-generation (recommended)
- ✅ Use individual address fields OR Mailing_Address (not both)
- ✅ Provide at least Member_First_Name and Member_Last_Name
- ✅ Test with a small file first (5-10 records)
- ✅ Backup existing member list (export to CSV)

### During Import:

- ✅ Review the preview table carefully
- ✅ Check Member_Number shows "Auto-gen" if left blank
- ✅ Verify family member count is correct (e.g., "3 members: P+S+1C")
- ✅ Fix errors in CSV and re-upload if many invalid rows
- ✅ Note the Batch ID after import completes
- ✅ Review import results before navigating away

### After Import:

- ✅ Spot-check imported members in Members list
- ✅ Search for family member names to verify they're searchable
- ✅ Check Member_Numbers follow format XXYYZZZZ
- ✅ Verify membership types are correct
- ✅ Review import history page to confirm batch exists
- ✅ Keep a record of Batch ID for future reference

### If Something Goes Wrong:

- ✅ Don't panic - you can revert!
- ✅ Go to Import History immediately
- ✅ Click "Revert" to delete the entire batch
- ✅ Fix your CSV file (check validation errors)
- ✅ Import again with corrected data

---

## 🎯 Quick Reference

### Template Location:
```
public/member-import-template.csv
```

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

### Member_Number Format:
```
XXYYZZZZ (8 digits)
XX: 11=Personal, 21=Business
YY: 00=Community, 01=Annual, 02=Lifetime
ZZZZ: Sequential (auto-generated)

Examples:
11010001 = Personal, Annual, #0001
21020015 = Business, Lifetime, #0015
```

### Family Members:
```
Primary: Member_First_Name + Member_Last_Name
Secondary: Secondary_First_Name + Secondary_Last_Name
Children: Child_1 through Child_4 (up to 4)
```

### Revert Process:
```
1. Import History → Find batch → Click "Revert"
2. Confirm deletion (PERMANENT!)
3. Members + family members deleted instantly
4. Batch marked as "Reverted"
```

---

## ✅ Summary - You're Protected!

**Don't worry!** The import system has full rollback capability:

1. ✅ **Every import is tracked** with unique Batch ID
2. ✅ **Auto-generated Member_Numbers** with format validation
3. ✅ **Family member support** - unlimited searchable family data
4. ✅ **Smart address parsing** from Mailing_Address format
5. ✅ **International phone support** with auto-normalization
6. ✅ **One-click revert** from Import History page
7. ✅ **Preview before import** so you see what will happen
8. ✅ **Validation** catches errors before import
9. ✅ **Empty row filtering** prevents junk data
10. ✅ **Full audit trail** of who imported/reverted and when

**You can confidently import knowing you can always revert if needed!**

---

**First-time import checklist:**
- [ ] Download CSV template from `public/member-import-template.csv`
- [ ] Study the 5 example rows
- [ ] Test with 3-5 test members first
- [ ] Verify test import looks good (check family members!)
- [ ] Check Member_Numbers were auto-generated correctly
- [ ] Practice reverting the test import
- [ ] Import real data
- [ ] Spot-check a few imported members
- [ ] Search for family member names
- [ ] Save the Batch ID for your records
- [ ] Celebrate - you did it! 🎉
