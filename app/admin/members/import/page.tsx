'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { parseAddress, parsePhone, isValidEmail, parseDate } from '@/lib/utils/addressParser'

interface CSVRow {
  'First Name': string
  'Last Name': string
  'Email': string
  'Phone': string
  'Address': string
  'Member Since': string
  'Membership Level': string
  'Member Class': string
  'Is Founding Member': string
  'Gothram': string
  'Nakshatra': string
  'Business Name'?: string
  'EIN'?: string
  'Secondary First Name'?: string
  'Secondary Last Name'?: string
  'Secondary Email'?: string
  'Secondary Phone'?: string
}

interface ParsedMember {
  // Original data
  original: CSVRow
  // Parsed data
  first_name: string
  last_name: string
  primary_email: string
  primary_phone: string
  address_line_1: string
  city: string
  state: string
  zip: string
  member_since: string | null
  current_level: 'Community' | 'Annual' | 'Lifetime'
  member_class: 'Personal' | 'Business'
  is_founding_member: boolean
  family_gothram: string
  nakshatra: string
  business_name?: string
  business_ein?: string
  secondary_first_name?: string
  secondary_last_name?: string
  secondary_email?: string
  secondary_phone?: string
  // Validation
  isValid: boolean
  errors: string[]
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
        const parsed = results.data.map((row: any) => parseCSVRow(row as CSVRow))
        setParsedMembers(parsed)
      },
      error: (error) => {
        alert(`CSV Parse Error: ${error.message}`)
      },
    })
  }

  const parseCSVRow = (row: CSVRow): ParsedMember => {
    const errors: string[] = []

    // Parse address
    const address = parseAddress(row['Address'] || '')

    // Validate email
    const email = row['Email']?.trim() || ''
    if (!isValidEmail(email)) {
      errors.push('Invalid email format')
    }

    // Parse member level
    let memberLevel: 'Community' | 'Annual' | 'Lifetime' = 'Community'
    const levelStr = row['Membership Level']?.trim().toLowerCase() || 'community'
    if (levelStr.includes('lifetime')) {
      memberLevel = 'Lifetime'
    } else if (levelStr.includes('annual')) {
      memberLevel = 'Annual'
    }

    // Parse member class
    let memberClass: 'Personal' | 'Business' = 'Personal'
    const classStr = row['Member Class']?.trim().toLowerCase() || 'personal'
    if (classStr.includes('business')) {
      memberClass = 'Business'
    }

    // Validate required fields
    if (!row['First Name'] && !row['Business Name']) {
      errors.push('Missing name (First Name or Business Name required)')
    }

    if (memberClass === 'Personal' && !row['First Name']) {
      errors.push('First Name required for Personal members')
    }

    if (memberClass === 'Business' && !row['Business Name']) {
      errors.push('Business Name required for Business members')
    }

    // Parse founding member
    const isFoundingStr = row['Is Founding Member']?.trim().toLowerCase() || 'no'
    const isFoundingMember = ['yes', 'true', '1', 'y'].includes(isFoundingStr)

    // Parse member since date
    const memberSince = parseDate(row['Member Since'] || '')

    const parsed: ParsedMember = {
      original: row,
      first_name: row['First Name']?.trim() || '',
      last_name: row['Last Name']?.trim() || '',
      primary_email: email,
      primary_phone: parsePhone(row['Phone'] || ''),
      address_line_1: address.address_line_1,
      city: address.city,
      state: address.state,
      zip: address.zip,
      member_since: memberSince,
      current_level: memberLevel,
      member_class: memberClass,
      is_founding_member: isFoundingMember,
      family_gothram: row['Gothram']?.trim() || '',
      nakshatra: row['Nakshatra']?.trim() || '',
      business_name: row['Business Name']?.trim() || '',
      business_ein: row['EIN']?.trim() || '',
      secondary_first_name: row['Secondary First Name']?.trim() || '',
      secondary_last_name: row['Secondary Last Name']?.trim() || '',
      secondary_email: row['Secondary Email']?.trim() || '',
      secondary_phone: parsePhone(row['Secondary Phone'] || ''),
      isValid: errors.length === 0,
      errors,
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
          const { error } = await supabase.from('members').insert({
            first_name: member.first_name || null,
            last_name: member.last_name || null,
            primary_email: member.primary_email,
            primary_phone: member.primary_phone || null,
            address_line_1: member.address_line_1 || null,
            city: member.city || null,
            state: member.state || null,
            zip: member.zip || null,
            member_since: member.member_since || null,
            current_level: member.current_level,
            member_class: member.member_class,
            is_founding_member: member.is_founding_member,
            family_gothram: member.family_gothram || null,
            nakshatra: member.nakshatra || null,
            business_name: member.business_name || null,
            business_ein: member.business_ein || null,
            secondary_first_name: member.secondary_first_name || null,
            secondary_last_name: member.secondary_last_name || null,
            secondary_email: member.secondary_email || null,
            secondary_phone: member.secondary_phone || null,
            import_batch_id: batchData.id,
          })

          if (error) {
            results.failed++
            results.errors.push(
              `${member.primary_email}: ${error.message}`
            )
          } else {
            results.success++
          }
        } catch (error: any) {
          results.failed++
          results.errors.push(
            `${member.primary_email}: ${error.message || 'Unknown error'}`
          )
        }
      }

      // Step 3: Update batch with final counts
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
              <li>• Required columns: First Name (or Business Name), Email, Membership Level, Member Class</li>
              <li>• Address format: "Street, City, State ZipCode" (will be auto-parsed)</li>
              <li>• Membership Level: Community, Annual, or Lifetime</li>
              <li>• Member Class: Personal or Business</li>
              <li>• Is Founding Member: Yes/No</li>
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
                file:bg-[#FF9933] file:text-white
                hover:file:bg-[#E68A2E]
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zip</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
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
                            {member.member_class === 'Personal'
                              ? `${member.first_name} ${member.last_name}`
                              : member.business_name}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">{member.primary_email}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{member.address_line_1}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{member.city}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{member.state}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{member.zip}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              member.current_level === 'Lifetime' ? 'bg-amber-100 text-amber-800' :
                              member.current_level === 'Annual' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {member.current_level}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-red-600">
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
                  className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
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
                  className="px-6 py-2 bg-[#FF9933] text-white rounded-md hover:bg-[#E68A2E] font-semibold"
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
