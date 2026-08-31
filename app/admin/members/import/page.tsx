'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { parseAddress, parsePhone, isValidEmail, parseDate } from '@/lib/utils/addressParser'
import {
  validateMemberNumberFormat,
  isMemberNumberUnique,
  generateMemberNumber,
  parseMailingAddress,
  isRowEmpty,
} from '@/lib/utils/memberImportValidation'

// New 42-column CSV structure
interface CSVRow {
  Member_Number: string
  Member_Class: string
  Member_Type: string
  Business_Name: string
  Business_EIN: string
  Member_Profile_Name: string
  Member_First_Name: string
  Member_Last_Name: string
  Primary_Member_Email_Address: string
  Primary_Phone_Number_1: string
  Primary_Phone_Number_2: string
  Member_Nakshatra: string
  Family_Gotra: string
  Secondary_First_Name: string
  Secondary_Last_Name: string
  Secondary_Nakshatra: string
  Secondary_Email: string
  Secondary_Phone_Number: string
  Child_1_First_Name: string
  Child_1_Last_Name: string
  Child_1_Nakshatra: string
  Child_1_Email: string
  Child_2_First_Name: string
  Child_2_Last_Name: string
  Child_2_Nakshatra: string
  Child_2_Email: string
  Child_3_First_Name: string
  Child_3_Last_Name: string
  Child_3_Nakshatra: string
  Child_3_Email: string
  Child_4_First_Name: string
  Child_4_Last_Name: string
  Child_4_Nakshatra: string
  Child_4_Email: string
  Address_1: string
  Address_2: string
  City: string
  State: string
  Zip: string
  Country: string
  Mailing_Address: string
  Member_Since: string
}

interface FamilyMemberData {
  relationship: 'Primary' | 'Secondary' | 'Child'
  first_name: string
  last_name: string
  email?: string
  phone?: string
  nakshatra?: string
  child_order?: number
}

interface ParsedMember {
  // Original data
  original: CSVRow
  // Member data
  membership_id: string // Member_Number (auto-generated if blank)
  member_class: 'Personal' | 'Business'
  current_level: 'Community' | 'Annual' | 'Lifetime'
  business_name?: string
  business_ein?: string
  member_profile_name: string
  member_since: string | null
  family_gotra: string
  // Primary member contact info
  first_name: string
  last_name: string
  primary_email: string
  primary_phone?: string
  primary_phone_2?: string
  nakshatra?: string
  // Secondary member info
  secondary_first_name?: string
  secondary_last_name?: string
  secondary_email?: string
  secondary_phone?: string
  secondary_nakshatra?: string
  // Address
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  country: string
  // Family members
  family_members: FamilyMemberData[]
  // Validation
  isValid: boolean
  errors: string[]
  memberNumberGenerated: boolean
}

export default function ImportMembersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [file, setFile] = useState<File | null>(null)
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([])
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
    batchId?: string
    batchNumber?: string
  } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setImportResults(null)

    // Parse CSV
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out truly empty rows (where all values are blank)
        const filteredData = results.data.filter((row: any) => !isRowEmpty(row))

        const parsed = filteredData.map((row: any) => parseCSVRow(row as CSVRow))
        setParsedMembers(parsed)
      },
      error: (error) => {
        alert(`CSV Parse Error: ${error.message}`)
      },
    })
  }

  const parseCSVRow = (row: CSVRow): ParsedMember => {
    const errors: string[] = []
    let memberNumberGenerated = false

    // 1. VALIDATE REQUIRED FIELDS (only First_Name and Last_Name are required)
    const firstName = row.Member_First_Name?.trim() || ''
    const lastName = row.Member_Last_Name?.trim() || ''

    if (!firstName) {
      errors.push('Member_First_Name is required')
    }
    if (!lastName) {
      errors.push('Member_Last_Name is required')
    }

    // 2. PARSE MEMBER CLASS (default to Personal)
    let memberClass: 'Personal' | 'Business' = 'Personal'
    const classStr = row.Member_Class?.trim().toLowerCase() || 'personal'
    if (classStr.includes('business')) {
      memberClass = 'Business'
    }

    // 3. PARSE MEMBER TYPE/LEVEL (default to Community)
    let memberLevel: 'Community' | 'Annual' | 'Lifetime' = 'Community'
    const typeStr = row.Member_Type?.trim().toLowerCase() || 'community'
    if (typeStr.includes('lifetime')) {
      memberLevel = 'Lifetime'
    } else if (typeStr.includes('annual')) {
      memberLevel = 'Annual'
    }

    // 4. VALIDATE/GENERATE MEMBER_NUMBER
    let memberNumber = row.Member_Number?.trim() || ''

    if (memberNumber) {
      // Validate existing Member_Number
      const validation = validateMemberNumberFormat(memberNumber, memberClass, row.Member_Type)
      if (!validation.isValid) {
        errors.push(`Member_Number: ${validation.error}`)
      }
      // Note: Uniqueness will be checked during import (async operation)
    } else {
      // Will be auto-generated during import
      memberNumberGenerated = true
    }

    // 5. PARSE BUSINESS FIELDS
    let businessName = row.Business_Name?.trim() || ''
    const businessEIN = row.Business_EIN?.trim() || ''

    // If Business class and no Business_Name, default to First_Name + Last_Name
    if (memberClass === 'Business' && !businessName && firstName && lastName) {
      businessName = `${firstName} ${lastName}`.trim()
    }

    // 6. PARSE MEMBER_PROFILE_NAME (defaults to First_Name + Last_Name if blank)
    let memberProfileName = row.Member_Profile_Name?.trim() || ''
    if (!memberProfileName && firstName && lastName) {
      memberProfileName = `${firstName} ${lastName}`.trim()
    }

    // 7. PARSE ADDRESS - use individual fields first, fallback to Mailing_Address
    let addressLine1 = row.Address_1?.trim() || ''
    let addressLine2 = row.Address_2?.trim() || ''
    let city = row.City?.trim() || ''
    let state = row.State?.trim() || ''
    let zip = row.Zip?.trim() || ''
    let country = row.Country?.trim() || ''

    // If all address fields are empty, try parsing Mailing_Address
    if (!addressLine1 && !city && !state && !zip && row.Mailing_Address?.trim()) {
      const parsed = parseMailingAddress(row.Mailing_Address)
      addressLine1 = parsed.address_line_1
      addressLine2 = parsed.address_line_2
      city = parsed.city
      state = parsed.state
      zip = parsed.zip
      country = parsed.country
    }

    // 8. PARSE MEMBER_SINCE DATE
    const memberSince = parseDate(row.Member_Since || '')

    // 9. BUILD FAMILY MEMBERS ARRAY
    const familyMembers: FamilyMemberData[] = []

    // Primary member (from main columns)
    const primaryEmail = row.Primary_Member_Email_Address?.trim() || ''
    const primaryPhone1 = parsePhone(row.Primary_Phone_Number_1 || '')
    const primaryPhone2 = parsePhone(row.Primary_Phone_Number_2 || '')
    const memberNakshatra = row.Member_Nakshatra?.trim() || ''

    // Only validate primary email if provided
    if (primaryEmail && !isValidEmail(primaryEmail)) {
      errors.push('Invalid Primary_Member_Email_Address format')
    }

    if (firstName && lastName) {
      familyMembers.push({
        relationship: 'Primary',
        first_name: firstName,
        last_name: lastName,
        email: primaryEmail || undefined,
        phone: primaryPhone1 || primaryPhone2 || undefined,
        nakshatra: memberNakshatra || undefined,
      })
    }

    // Secondary member
    const secondaryFirstName = row.Secondary_First_Name?.trim() || ''
    const secondaryLastName = row.Secondary_Last_Name?.trim() || ''
    const secondaryEmail = row.Secondary_Email?.trim() || ''
    const secondaryPhone = parsePhone(row.Secondary_Phone_Number || '')
    const secondaryNakshatra = row.Secondary_Nakshatra?.trim() || ''

    // Validate secondary email if provided
    if (secondaryEmail && !isValidEmail(secondaryEmail)) {
      errors.push('Invalid Secondary_Email format')
    }

    if (secondaryFirstName && secondaryLastName) {
      familyMembers.push({
        relationship: 'Secondary',
        first_name: secondaryFirstName,
        last_name: secondaryLastName,
        email: secondaryEmail || undefined,
        phone: secondaryPhone || undefined,
        nakshatra: secondaryNakshatra || undefined,
      })
    }

    // Children (4 children supported)
    const children = [
      {
        firstName: row.Child_1_First_Name?.trim() || '',
        lastName: row.Child_1_Last_Name?.trim() || '',
        nakshatra: row.Child_1_Nakshatra?.trim() || '',
        email: row.Child_1_Email?.trim() || '',
        order: 1,
      },
      {
        firstName: row.Child_2_First_Name?.trim() || '',
        lastName: row.Child_2_Last_Name?.trim() || '',
        nakshatra: row.Child_2_Nakshatra?.trim() || '',
        email: row.Child_2_Email?.trim() || '',
        order: 2,
      },
      {
        firstName: row.Child_3_First_Name?.trim() || '',
        lastName: row.Child_3_Last_Name?.trim() || '',
        nakshatra: row.Child_3_Nakshatra?.trim() || '',
        email: row.Child_3_Email?.trim() || '',
        order: 3,
      },
      {
        firstName: row.Child_4_First_Name?.trim() || '',
        lastName: row.Child_4_Last_Name?.trim() || '',
        nakshatra: row.Child_4_Nakshatra?.trim() || '',
        email: row.Child_4_Email?.trim() || '',
        order: 4,
      },
    ]

    for (const child of children) {
      // Only add child if they have both first and last name
      if (child.firstName && child.lastName) {
        // Validate child email if provided (children can share parent emails)
        if (child.email && !isValidEmail(child.email)) {
          errors.push(`Invalid Child_${child.order}_Email format`)
        }

        familyMembers.push({
          relationship: 'Child',
          first_name: child.firstName,
          last_name: child.lastName,
          email: child.email || undefined,
          nakshatra: child.nakshatra || undefined,
          child_order: child.order,
        })
      }
    }

    const parsed: ParsedMember = {
      original: row,
      membership_id: memberNumber, // May be empty if auto-generated
      member_class: memberClass,
      current_level: memberLevel,
      business_name: businessName || undefined,
      business_ein: businessEIN || undefined,
      member_profile_name: memberProfileName,
      member_since: memberSince,
      family_gotra: row.Family_Gotra?.trim() || '',
      // Primary member contact info
      first_name: firstName,
      last_name: lastName,
      primary_email: primaryEmail,
      primary_phone: primaryPhone1 || undefined,
      primary_phone_2: primaryPhone2 || undefined,
      nakshatra: memberNakshatra || undefined,
      // Secondary member info
      secondary_first_name: secondaryFirstName || undefined,
      secondary_last_name: secondaryLastName || undefined,
      secondary_email: secondaryEmail || undefined,
      secondary_phone: secondaryPhone || undefined,
      secondary_nakshatra: secondaryNakshatra || undefined,
      // Address
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city: city,
      state: state,
      zip: zip,
      country: country,
      family_members: familyMembers,
      isValid: errors.length === 0,
      errors,
      memberNumberGenerated,
    }

    return parsed
  }

  const handleImport = async () => {
    if (parsedMembers.length === 0) return

    const validMembers = parsedMembers.filter((m) => m.isValid)

    if (validMembers.length === 0) {
      alert('No valid members to import. Please fix validation errors.')
      return
    }

    if (!confirm(`Import ${validMembers.length} valid members? (${parsedMembers.length - validMembers.length} will be skipped due to errors)`)) {
      return
    }

    setImporting(true)
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      batchId: undefined as string | undefined,
      batchNumber: undefined as string | undefined,
    }

    try {
      // Step 1: Create import batch record
      const batchNumber = `IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      const { data: userData } = await supabase.auth.getUser()
      const { data: memberData } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('auth_user_id', userData?.user?.id)
        .single()

      const importerName = memberData
        ? `${memberData.first_name} ${memberData.last_name}`.trim()
        : userData?.user?.email || 'Unknown'

      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          batch_number: batchNumber,
          file_name: file?.name || 'Unknown',
          imported_by: userData?.user?.id,
          imported_by_name: importerName,
          total_records: parsedMembers.length,
          successful_records: 0,
          failed_records: 0,
          status: 'Completed',
        })
        .select()
        .single()

      if (batchError) {
        console.error('Failed to create import batch:', batchError)
        alert('Failed to create import batch. Please try again.')
        setImporting(false)
        return
      }

      results.batchId = batchData.id
      results.batchNumber = batchNumber

      // Step 2: Import members with batch_id
      for (const member of validMembers) {
        try {
          // Generate or validate Member_Number
          let finalMemberNumber = member.membership_id

          if (member.memberNumberGenerated) {
            // Auto-generate Member_Number
            finalMemberNumber = await generateMemberNumber(member.member_class, member.current_level)
          } else if (finalMemberNumber) {
            // Check uniqueness of provided Member_Number
            const isUnique = await isMemberNumberUnique(finalMemberNumber)
            if (!isUnique) {
              results.failed++
              results.errors.push(
                `Row with Member_Number ${finalMemberNumber}: Member_Number already exists in database`
              )
              continue // Skip this member
            }
          }

          // Get primary member's email for display name
          const primaryMember = member.family_members.find((fm) => fm.relationship === 'Primary')
          const displayEmail = primaryMember?.email || 'No email'

          // Insert member record
          const { data: insertedMember, error: memberError } = await supabase
            .from('members')
            .insert({
              membership_id: finalMemberNumber || null,
              member_class: member.member_class,
              current_level: member.current_level,
              // Primary member info
              first_name: member.first_name || null,
              last_name: member.last_name || null,
              primary_email: member.primary_email, // Required field
              primary_phone: member.primary_phone || null,
              primary_phone_2: member.primary_phone_2 || null,
              nakshatra: member.nakshatra || null,
              // Secondary member info
              secondary_first_name: member.secondary_first_name || null,
              secondary_last_name: member.secondary_last_name || null,
              secondary_email: member.secondary_email || null,
              secondary_phone: member.secondary_phone || null,
              secondary_nakshatra: member.secondary_nakshatra || null,
              // Business info
              business_name: member.business_name || null,
              business_ein: member.business_ein || null,
              member_profile_name: member.member_profile_name || null,
              member_since: member.member_since || null,
              family_gotra: member.family_gotra || null,
              // Address
              address_line_1: member.address_line_1 || null,
              address_line_2: member.address_line_2 || null,
              city: member.city || null,
              state: member.state || null,
              zip: member.zip || null,
              country: member.country || null,
              import_batch_id: batchData.id,
            })
            .select()
            .single()

          if (memberError) {
            results.failed++
            results.errors.push(`${displayEmail}: ${memberError.message}`)
            continue
          }

          // Step 3: Insert family members
          if (member.family_members.length > 0) {
            const familyMemberInserts = member.family_members.map((fm) => ({
              member_id: insertedMember.id,
              relationship: fm.relationship,
              first_name: fm.first_name,
              last_name: fm.last_name,
              email: fm.email || null,
              phone: fm.phone || null,
              nakshatra: fm.nakshatra || null,
              child_order: fm.child_order || null,
            }))

            const { error: familyError } = await supabase
              .from('family_members')
              .insert(familyMemberInserts)

            if (familyError) {
              // Log error but don't fail the whole import
              console.error(`Failed to insert family members for ${displayEmail}:`, familyError)
              results.errors.push(
                `${displayEmail}: Member imported but family members failed: ${familyError.message}`
              )
            }
          }

          results.success++
        } catch (error: any) {
          results.failed++
          const primaryMember = member.family_members.find((fm) => fm.relationship === 'Primary')
          const displayEmail = primaryMember?.email || 'Unknown'
          results.errors.push(`${displayEmail}: ${error.message || 'Unknown error'}`)
        }
      }

      // Step 4: Update batch with final counts
      await supabase
        .from('import_batches')
        .update({
          successful_records: results.success,
          failed_records: results.failed,
        })
        .eq('id', batchData.id)

    } catch (error: any) {
      console.error('Import error:', error)
      alert(`Import failed: ${error.message}`)
    }

    setImporting(false)
    setImportResults(results)
  }

  const validCount = parsedMembers.filter((m) => m.isValid).length
  const invalidCount = parsedMembers.length - validCount

  return (
    <ProtectedRoute requiredRoles={['Office Staff', 'Office Manager', 'Admin']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Import Members from CSV</h1>
              <p className="mt-1 text-sm text-gray-600">
                Upload a CSV file to bulk import member data
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/members/import-history')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
              >
                Import History
              </button>
              <button
                onClick={() => router.push('/admin/members')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Members
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Required columns:</strong> Member_First_Name, Member_Last_Name</li>
              <li>• <strong>Member_Number:</strong> Leave blank to auto-generate, or provide 8-digit format XXYYZZZZ</li>
              <li>• <strong>Member_Type:</strong> Community, Annual, or Lifetime (defaults to Community)</li>
              <li>• <strong>Member_Class:</strong> Personal or Business (defaults to Personal)</li>
              <li>• <strong>Address:</strong> Provide individual fields (Address_1, City, State, Zip) OR use Mailing_Address (will be auto-parsed)</li>
              <li>• <strong>Family Members:</strong> Include Primary, Secondary, and up to 4 children with their details</li>
              <li>• <strong>Business_Name:</strong> For Business class, defaults to First_Name + Last_Name if blank</li>
            </ul>
          </div>

          {/* File Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-saffron file:text-white
                hover:file:bg-saffron-hover
                cursor-pointer"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>

          {/* Preview */}
          {parsedMembers.length > 0 && !importResults && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Preview ({parsedMembers.length} members)
                  </h2>
                  <div className="flex gap-4">
                    <span className="text-sm text-green-600 font-medium">
                      ✓ {validCount} Valid
                    </span>
                    {invalidCount > 0 && (
                      <span className="text-sm text-red-600 font-medium">
                        ✗ {invalidCount} Invalid
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profile Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Family</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City/State</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedMembers.map((member, idx) => (
                        <tr key={idx} className={member.isValid ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 text-sm">
                            {member.isValid ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {member.membership_id || (
                              <span className="text-gray-400 text-xs">Auto-gen</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {member.member_profile_name || (
                              member.business_name ? member.business_name : 'N/A'
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.current_level === 'Lifetime' ? 'bg-amber-100 text-amber-800' :
                              member.current_level === 'Annual' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {member.current_level}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.member_class === 'Business' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {member.member_class}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {member.family_members.length} member{member.family_members.length !== 1 ? 's' : ''}
                            {member.family_members.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {member.family_members.filter(fm => fm.relationship === 'Primary').length > 0 && 'P'}
                                {member.family_members.filter(fm => fm.relationship === 'Secondary').length > 0 && '+S'}
                                {member.family_members.filter(fm => fm.relationship === 'Child').length > 0 && ` +${member.family_members.filter(fm => fm.relationship === 'Child').length}C`}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">
                            {member.city && member.state ? `${member.city}, ${member.state}` : member.city || member.state || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sm text-red-600 max-w-xs">
                            {member.errors.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setFile(null)
                    setParsedMembers([])
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validCount === 0}
                  className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                >
                  {importing ? 'Importing...' : `Import ${validCount} Valid Members`}
                </button>
              </div>
            </>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>

              {importResults.batchNumber && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Batch ID:</strong> {importResults.batchNumber}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You can revert this import from the Import History page if needed.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Successful</p>
                  <p className="text-3xl font-bold text-green-900">{importResults.success}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-3xl font-bold text-red-900">{importResults.failed}</p>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">Errors:</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {importResults.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-800 mb-1">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => router.push('/admin/members/import-history')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  View Import History
                </button>
                <button
                  onClick={() => router.push('/admin/members')}
                  className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
                >
                  View Members
                </button>
                <button
                  onClick={() => {
                    setFile(null)
                    setParsedMembers([])
                    setImportResults(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
