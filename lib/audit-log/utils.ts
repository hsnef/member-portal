// ============================================================================
// Member Audit Log Utility Functions (Client-Safe)
// ============================================================================

import type { MemberAuditLog, MemberAuditLogActionType, CreationSource } from '@/types/database'

/**
 * Format field name for display
 */
export function formatFieldName(fieldName: string): string {
  const fieldNameMap: Record<string, string> = {
    member_class: 'Member Class',
    current_level: 'Membership Level',
    is_founding_member: 'Founding Member',
    profile_name: 'Profile Name',
    nakshatra: 'Nakshatra',
    family_gotra: 'Gotra',
    secondary_first_name: 'Secondary First Name',
    secondary_last_name: 'Secondary Last Name',
    secondary_nakshatra: 'Secondary Nakshatra',
    secondary_email: 'Secondary Email',
    secondary_phone: 'Secondary Phone',
    business_name: 'Business Name',
    business_ein: 'Business EIN',
    primary_email: 'Primary Email',
    primary_phone: 'Primary Phone',
    primary_phone_2: 'Secondary Phone',
    address_line_1: 'Address Line 1',
    address_line_2: 'Address Line 2',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
    country: 'Country',
    mailing_address: 'Mailing Address',
    member_since: 'Member Since',
  }

  return fieldNameMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Format action type for display
 */
export function formatActionType(actionType: MemberAuditLogActionType): string {
  const actionTypeMap: Record<MemberAuditLogActionType, string> = {
    CREATED: 'Created',
    MEMBERSHIP_ID_CHANGED: 'Membership ID Changed',
    FIELD_UPDATED: 'Updated',
    BULK_UPDATE: 'Bulk Update',
  }

  return actionTypeMap[actionType] || actionType
}

/**
 * Format creation source for display
 */
export function formatCreationSource(source: CreationSource | null): string {
  if (!source) return 'Unknown'

  const sourceMap: Record<CreationSource, string> = {
    AUTO_IMPORT: 'Auto Import',
    SELF_REGISTRATION: 'Self Registration',
    OFFICE_STAFF: 'Office Staff',
    OFFICE_MANAGER: 'Office Manager',
    ADMIN: 'Admin',
  }

  return sourceMap[source] || source
}

/**
 * Export audit log to CSV format
 */
export function exportAuditLogToCSV(auditLogs: MemberAuditLog[]): string {
  const headers = [
    'Date',
    'Action',
    'Changed By',
    'Role',
    'Creation Source',
    'Fields Changed',
    'Old Membership ID',
    'New Membership ID',
    'Reason',
  ]

  const rows = auditLogs.map(log => {
    const fieldsChanged = log.field_names?.join(', ') || ''
    const date = new Date(log.changed_at).toLocaleString()

    return [
      date,
      formatActionType(log.action_type),
      log.changed_by_name || 'System',
      log.changed_by_role || 'System',
      formatCreationSource(log.creation_source),
      fieldsChanged,
      log.old_membership_id || '',
      log.new_membership_id || '',
      log.change_reason || '',
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}
