// ============================================================================
// Member Audit Log Server Helper Functions
// Server-side only - uses next/headers
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

// Note: Client-safe utility functions (formatFieldName, formatActionType, etc.)
// have been moved to @/lib/audit-log/utils for use in client components
