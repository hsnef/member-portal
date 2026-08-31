import React from 'react';
import { Badge, type BadgeTone } from './Badge';
import type { RequestStatus } from '@/types/design-system';

const statusTone: Record<RequestStatus, BadgeTone> = {
  'Pending Approval': 'marigold',
  Approved: 'saffron',
  'Awaiting Payment': 'danger',
  Paid: 'tulsi',
  Completed: 'sandal',
  Cancelled: 'neutral'
};

const animated: RequestStatus[] = ['Pending Approval', 'Awaiting Payment', 'Approved'];

export function StatusBadge({ status }: {status: RequestStatus;}) {
  return (
    <Badge tone={statusTone[status]} dot={animated.includes(status)}>
      {status}
    </Badge>);

}