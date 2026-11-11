# Member import: the format we accept

_Last checked 2026-11-11. Rewritten to match the import as it now works; the earlier
version described a member-number format (`XXYYZZZZ`) the database never accepted._

**Who imports:** an Admin or Office Manager, at **Office → Members → Import**. Office Staff
cannot import or revert imports.

**The rule:** the temple team sends its membership data **in our template**. We do not adapt
to other layouts. A row that does not fit is not imported, and the preview says why, row by
row, before anything is saved.

## 1. Get the template

Download it from the import page (**Download the template**), or use
`public/member-import-template.csv`. Fill it in Excel or Google Sheets, then **save as CSV**.
Keep the header row exactly as it is.

**One row per membership (household).**

## 2. Required on every row

| Column | What to put |
|---|---|
| `Member_First_Name`, `Member_Last_Name` | The member's name |
| `Primary_Member_Email_Address` | The member's email. **This is how they sign in**, so it must be real and theirs |
| `Member_Type` | `Community`, `Annual` or `Lifetime` (any capitalisation). Nothing else is accepted |

A **Business** membership also needs `Business_Name`.

## 3. Membership numbers

**Every imported member gets a new membership number** from the portal
(`1…00` Lifetime, `2…00` Annual, `3…00` Community; see DEC-012 in `docs/PROJECT-HUB.md`).

Put the member's **old number**, if they have one, in `Member_Number`. It is kept as their
**legacy ID**, so the old number can still be found. Any format is fine there.

## 4. The household

| Who | Columns |
|---|---|
| The member | `Member_…`, `Primary_…`, `Member_Nakshatra`, `Family_Gotra` |
| Spouse or partner (optional, one) | `Secondary_First_Name`, `Secondary_Last_Name`, `Secondary_Email`, `Secondary_Phone_Number`, `Secondary_Nakshatra` |
| Children (optional, up to four) | `Child_1_…` to `Child_4_…`: first name, last name, Nakshatra, email |

Everyone in the row belongs to the one membership. Family members do not get their own
membership numbers. A spouse or child is only added when both first and last name are filled.

## 5. Other columns and accepted values

| Column | Accepted |
|---|---|
| `Member_Class` | `Personal` (also `Individual`, `Family`, or blank) or `Business` (also `Corporate`) |
| Any `…_Nakshatra` | One of the 27 Nakshatras (e.g. `Rohini`, `Purva Phalguni`), any capitalisation, or blank |
| `Member_Since` | A date, e.g. `2020-01-31` |
| Emails | A valid address, or blank (except the primary email, which is required) |
| Address | `Address_1`, `Address_2`, `City`, `State`, `Zip`, `Country`. If those are blank, `Mailing_Address` is read instead |
| Phones | Any common format |

## 6. Importing

1. Choose the CSV. Nothing is saved yet.
2. Read the preview. Each row shows **Ready** or the reasons it will be skipped, and the old
   number it will keep as legacy ID.
3. Fix skipped rows in the spreadsheet and choose the file again, or import the ready rows
   now and the rest later.
4. Confirm. The import is recorded as a **batch**. If a batch went wrong, revert the whole
   batch from **Past imports**.
