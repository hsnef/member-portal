// ============================================================================
// Member Audit Log Helper Functions
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { MemberAuditLog, MemberAuditLogActionType, CreationSource } from '@/types/database'

/**
 * Get audit log for a specific member
 */
export async function getMemberAuditLog(
  memberId: string,
  options?: {
    actionType?: MemberAuditLogActionType
    limit?: number
    offset?: number
    fromDate?: Date
    toDate?: Date
  }
): Promise<{ data: MemberAuditLog[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('member_audit_log')
      .select('*')
      .eq('member_id', memberId)
      .order('changed_at', { ascending: false })
    
    if (options?.actionType) {
      query = query.eq('action_type', options.actionType)
    }
    
    if (options?.fromDate) {
      query = query.gte('changed_at', options.fromDate.toISOString())
    }
    
    if (options?.toDate) {
      query = query.lte('changed_at', options.toDate.toISOString())
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { data: null, error: new Error(error.message) }
    }
    
    return { data: data as MemberAuditLog[], error: null }
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Failed to fetch audit log') 
    }
  }
}

/**
 * Get global audit log (for Manager/Admin)
 */
export async function getGlobalAuditLog(
  options?: {
    memberId?: string
    actionType?: MemberAuditLogActionType
    creationSource?: CreationSource
    changedBy?: string
    limit?: number
    offset?: number
    fromDate?: Date
    toDate?: Date
  }
): Promise<{ data: MemberAuditLog[] | null; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('member_audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
    
    if (options?.memberId) {
      query = query.eq('member_id', options.memberId)
    }
    
    if (options?.actionType) {
      query = query.eq('action_type', options.actionType)
    }
    
    if (options?.creationSource) {
      query = query.eq('creation_source', options.creationSource)
    }
    
    if (options?.changedBy) {
      query = query.eq('changed_by', options.changedBy)
    }
    
    if (options?.fromDate) {
      query = query.gte('changed_at', options.fromDate.toISOString())
    }
    
    if (options?.toDate) {
      query = query.lte('changed_at', options.toDate.toISOString())
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      return { data: null, error: new Error(error.message) }
    }
    
    return { data: data as MemberAuditLog[], error: null }
  } catch (err) {
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Failed to fetch audit log') 
    }
  }
}

/**
 * Get audit log count for a member
 */
export async function getMemberAuditLogCount(
  memberId: string,
  options?: {
    actionType?: MemberAuditLogActionType
    fromDate?: Date
    toDate?: Date
  }
): Promise<{ count: number; error: Error | null }> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('member_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', memberId)
    
    if (options?.actionType) {
      query = query.eq('action_type', options.actionType)
    }
    
    if (options?.fromDate) {
      query = query.gte('changed_at', options.fromDate.toISOString())
    }
    
    if (options?.toDate) {
      query = query.lte('changed_at', options.toDate.toISOString())
    }
    
    const { count, error } = await query
    
    if (error) {
      return { count: 0, error: new Error(error.message) }
    }
    
    return { count: count || 0, error: null }
  } catch (err) {
    return { 
      count: 0, 
      error: err instanceof Error ? err : new Error('Failed to fetch audit log count') 
    }
  }
}

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
