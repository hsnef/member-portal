# Member Import Instructions for Office Staff

## Quick Start

### Step 1: Choose Your Template

**Two options available:**

1. **member-import-template.csv** - Has 5 example rows to show you the format
2. **member-import-template-blank.csv** - Just the headers, completely blank for you to fill in

**Recommendation:** Download the one WITH examples first, look at how the data is formatted, then use the blank one for your actual data.

---

## Step 2: Open in Excel or Google Sheets

### Excel:
1. Download the CSV file
2. Right-click → "Open with" → Microsoft Excel
3. The columns will automatically align properly

### Google Sheets:
1. Go to Google Sheets
2. File → Import → Upload
3. Select the CSV file
4. Click "Import data"

**IMPORTANT:** Once opened, you'll see 42 columns spread across from A to AP. This is normal!

---

## Step 3: Fill In Your Data

### ✅ REQUIRED Columns (Only 2!)

You **MUST** fill these in for every member:

| Column | Example | Notes |
|--------|---------|-------|
| **Member_First_Name** (Column G) | Rajesh | Required for everyone |
| **Member_Last_Name** (Column H) | Patel | Required for everyone |

**That's it! Everything else is optional.**

---

## 📝 Recommended Columns to Fill

### For Most Members:

| Column | Example | Can Leave Blank? |
|--------|---------|------------------|
| Member_Number (A) | Leave blank | YES - System auto-generates |
| Member_Class (B) | Personal | YES - Defaults to "Personal" |
| Member_Type (C) | Lifetime | YES - Defaults to "Community" |
| Member_Profile_Name (F) | Patel Family | YES - Auto-generates from name |
| Primary_Member_Email_Address (I) | rajesh@email.com | YES |
| Primary_Phone_Number_1 (J) | 904-555-1234 | YES |
| Address_1 (AE) | 123 Main St | YES |
| City (AG) | Jacksonville | YES |
| State (AH) | FL | YES |
| Zip (AI) | 32256 | YES |

---

## 💡 Tips for Common Scenarios

### Family with Spouse:
Fill in:
- Member_First_Name & Member_Last_Name (Primary person)
- Secondary_First_Name & Secondary_Last_Name (Spouse)
- Secondary_Email & Secondary_Phone_Number (if different)

### Family with Children:
For each child, fill in:
- Child_1_First_Name & Child_1_Last_Name
- Child_1_Email (can be same as parent email)
- Repeat for Child_2, Child_3, Child_4 (if applicable)

### Business Member:
1. Set Member_Class (B) = "Business"
2. Fill in Business_Name (D)
3. Fill in Business_EIN (E) if you have it
4. Fill in Member_First_Name & Member_Last_Name (owner/contact person)

### International Phone Numbers:
Just enter the phone as-is:
- UK: +44-20-1234-5678
- India: +91-98765-43210
- US: 904-555-1234 (system adds +1 automatically)

---

## ⚠️ Important Notes

### Member_Number (Column A)
**LEAVE BLANK!** The system will auto-generate like: 11010001
- If you have existing member numbers, you can enter them
- Must be exactly 8 digits
- Format: XXYYZZZZ

### Member_Class (Column B)
Two options:
- **Personal** - Regular family membership (default)
- **Business** - Business membership

### Member_Type (Column C)
Three options:
- **Community** - Community member (default)
- **Annual** - Annual member
- **Lifetime** - Lifetime member

### Addresses
**Two ways to enter address:**

**Option 1:** Fill individual fields
- Address_1 (AE): 123 Main St
- Address_2 (AF): Apt 4B
- City (AG): Jacksonville
- State (AH): FL
- Zip (AI): 32256
- Country (AJ): USA

**Option 2:** Use Mailing_Address field (AK)
- Enter full address: "123 Main St, Jacksonville, FL 32256, USA"
- System will auto-parse into components

**Use one or the other, not both!**

---

## 🚫 Common Mistakes to Avoid

### ❌ DON'T:
- Leave Member_First_Name or Member_Last_Name blank
- Put "N/A" or "None" in fields - just leave them blank
- Fill Member_Number unless you have existing numbers
- Worry about all 42 columns - most are optional!

### ✅ DO:
- Fill at least First Name and Last Name
- Leave Member_Number blank (auto-generates)
- Delete the example rows before importing
- Save the file as CSV format
- Keep the header row (row 1)

---

## 📊 Column Reference

### Quick Column Finder:

| Columns A-L | Member Basic Info |
|-------------|-------------------|
| A | Member_Number (leave blank) |
| B | Member_Class (Personal/Business) |
| C | Member_Type (Community/Annual/Lifetime) |
| D | Business_Name (if Business member) |
| E | Business_EIN |
| F | Member_Profile_Name |
| **G** | **Member_First_Name (REQUIRED)** |
| **H** | **Member_Last_Name (REQUIRED)** |
| I | Primary_Member_Email_Address |
| J | Primary_Phone_Number_1 |
| K | Primary_Phone_Number_2 |
| L | Member_Nakshatra |

| Columns M-R | Spouse/Secondary |
|-------------|------------------|
| M | Family_Gotra |
| N | Secondary_First_Name |
| O | Secondary_Last_Name |
| P | Secondary_Nakshatra |
| Q | Secondary_Email |
| R | Secondary_Phone_Number |

| Columns S-AH | Children & Address |
|-------------|-------------------|
| S-V | Child_1 info |
| W-Z | Child_2 info |
| AA-AD | Child_3 info |
| AE-AH | Child_4 info |
| AI-AN | Address fields |
| AO | Mailing_Address (alternative) |
| AP | Member_Since (date) |

---

## ✅ Before You Import

### Checklist:
- [ ] Every row has Member_First_Name filled in
- [ ] Every row has Member_Last_Name filled in
- [ ] Deleted the example rows
- [ ] Saved file as .CSV format
- [ ] Kept the header row (row 1)

---

## 🆘 Need Help?

### If you see errors during import:
1. Check that First Name and Last Name are filled in
2. Check email format (must be name@domain.com)
3. Don't worry about warnings - invalid rows are skipped
4. You can always revert (undo) an import from Import History

### Quick validation:
- Emails should have @ and .com (or .org, etc.)
- Phone numbers can have any format - system cleans them up
- Dates should be YYYY-MM-DD format (e.g., 2020-03-15)
- Leave Member_Number blank unless you're sure

---

## 📥 Ready to Import?

1. Save your filled CSV file
2. Log into the member portal
3. Go to: **Dashboard → Members → Import CSV**
4. Upload your file
5. Review the preview (green checkmarks = good!)
6. Click "Import"

**The import guide (`member-import-guide.md`) has detailed step-by-step instructions.**

---

## 🎯 Quick Examples

### Minimal Member (Just Required Fields):
```
Member_First_Name: John
Member_Last_Name: Doe
(Leave everything else blank - system will default to Personal/Community)
```

### Complete Family:
```
Member_First_Name: Rajesh
Member_Last_Name: Patel
Member_Type: Lifetime
Primary_Member_Email_Address: rajesh@email.com
Primary_Phone_Number_1: 904-555-1234
Secondary_First_Name: Priya
Secondary_Last_Name: Patel
Secondary_Email: priya@email.com
Child_1_First_Name: Aarav
Child_1_Last_Name: Patel
Address_1: 123 Main St
City: Jacksonville
State: FL
Zip: 32256
```

### Business Member:
```
Member_Class: Business
Business_Name: Tech Solutions Inc
Member_First_Name: Suresh
Member_Last_Name: Kumar
Primary_Member_Email_Address: suresh@techsolutions.com
Primary_Phone_Number_1: 904-555-4567
```

---

**Good luck! The system is very forgiving - just make sure First Name and Last Name are filled in, and you'll be fine!** 🎉
