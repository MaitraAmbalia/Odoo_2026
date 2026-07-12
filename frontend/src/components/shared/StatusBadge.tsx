import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  let variantClass = 'bg-muted text-muted-foreground border-border'; // Neutral default

  const successStatuses = ['AVAILABLE', 'VERIFIED', 'RESOLVED', 'ACTIVE'];
  const infoStatuses = ['ALLOCATED', 'ONGOING', 'IN_PROGRESS'];
  const warningStatuses = ['RESERVED', 'PENDING', 'TECHNICIAN_ASSIGNED', 'UPCOMING'];
  const destructiveStatuses = ['UNDER_MAINTENANCE', 'MISSING', 'DAMAGED', 'OVERDUE', 'REJECTED', 'CANCELLED', 'LOST'];
  const neutralStatuses = ['RETIRED', 'DISPOSED', 'INACTIVE'];

  if (successStatuses.includes(status)) {
    variantClass = 'bg-success text-success-foreground hover:bg-success/90 border-transparent';
  } else if (infoStatuses.includes(status)) {
    variantClass = 'bg-info text-info-foreground hover:bg-info/90 border-transparent';
  } else if (warningStatuses.includes(status)) {
    variantClass = 'bg-warning text-warning-foreground hover:bg-warning/90 border-transparent';
  } else if (destructiveStatuses.includes(status)) {
    variantClass = 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent';
  } else if (neutralStatuses.includes(status)) {
    variantClass = 'bg-transparent text-muted-foreground border-border';
  }

  const formatLabel = (val: string) => {
    return val.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  return (
    <Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', variantClass, className)}>
      {formatLabel(status)}
    </Badge>
  );
};
