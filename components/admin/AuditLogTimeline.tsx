'use client'

import { useState } from 'react'
import { formatActionType, formatCreationSource, formatFieldName } from '@/lib/audit-log/utils'
import type { MemberAuditLog } from '@/types/database'

interface AuditLogTimelineProps {
  auditLogs: (MemberAuditLog & { memberName?: string; membershipId?: string })[]
  showMemberName?: boolean
  onExport?: () => void
}

export function AuditLogTimeline({ auditLogs, showMemberName = false, onExport }: AuditLogTimelineProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATED':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      case 'MEMBERSHIP_ID_CHANGED':
        return (
          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      case 'FIELD_UPDATED':
        return (
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      case 'BULK_UPDATE':
        return (
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      default:
        return (
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATED':
        return 'bg-green-100'
      case 'MEMBERSHIP_ID_CHANGED':
        return 'bg-purple-100'
      case 'FIELD_UPDATED':
        return 'bg-blue-100'
      case 'BULK_UPDATE':
        return 'bg-orange-100'
      default:
        return 'bg-gray-100'
    }
  }

  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No changes have been recorded yet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {auditLogs.map((log, index) => (
        <div key={log.id} className="relative">
          {/* Connecting Line */}
          {index < auditLogs.length - 1 && (
            <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
          )}

          <div className="relative flex gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
            {/* Icon */}
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getActionColor(log.action_type)}`}>
              {getActionIcon(log.action_type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Action Badge and Member Name (if global view) */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {formatActionType(log.action_type)}
                    </span>
                    {showMemberName && log.memberName && (
                      <span className="text-sm text-gray-600">
                        {log.memberName} ({log.membershipId})
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(log.changed_at).toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Changed By */}
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Changed by:</span>{' '}
                    {log.changed_by_name || 'System'}{' '}
                    {log.changed_by_role && (
                      <span className="text-xs text-gray-500">({log.changed_by_role})</span>
                    )}
                  </p>

                  {/* Creation Source (for CREATED action) */}
                  {log.action_type === 'CREATED' && log.creation_source && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Source:</span> {formatCreationSource(log.creation_source)}
                    </p>
                  )}

                  {/* Membership ID Change */}
                  {log.action_type === 'MEMBERSHIP_ID_CHANGED' && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-700">ID Changed:</span>{' '}
                      <span className="text-red-600 line-through">{log.old_membership_id}</span>
                      {' → '}
                      <span className="text-green-600 font-semibold">{log.new_membership_id}</span>
                    </div>
                  )}

                  {/* Field Changes Summary */}
                  {log.action_type === 'FIELD_UPDATED' && log.field_names && log.field_names.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Fields changed:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.field_names.slice(0, 5).map((field) => (
                          <span
                            key={field}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                          >
                            {formatFieldName(field)}
                          </span>
                        ))}
                        {log.field_names.length > 5 && (
                          <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                            +{log.field_names.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Change Reason */}
                  {log.change_reason && (
                    <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Reason:</span> {log.change_reason}
                      </p>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedLog === log.id && log.changed_fields && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Field Changes:</p>
                      <div className="space-y-2">
                        {Object.entries(log.changed_fields as Record<string, any>).map(([field, value]) => (
                          <div key={field} className="text-sm">
                            <span className="font-medium text-gray-700">{formatFieldName(field)}:</span>
                            <div className="ml-4 mt-1">
                              {value.old !== undefined && (
                                <div className="text-red-600">
                                  <span className="text-xs text-gray-500">Old:</span> {String(value.old) || '(empty)'}
                                </div>
                              )}
                              {value.new !== undefined && (
                                <div className="text-green-600">
                                  <span className="text-xs text-gray-500">New:</span> {String(value.new) || '(empty)'}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expand/Collapse Button */}
                {log.changed_fields && Object.keys(log.changed_fields).length > 0 && (
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="ml-4 text-sm text-[#FF9933] hover:text-[#FF8800] font-medium"
                  >
                    {expandedLog === log.id ? 'Less' : 'Details'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
