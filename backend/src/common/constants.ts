// ── Enum mirrors from Prisma for use in application logic ──
// These are re-exported so services/controllers don't need to import from @prisma/client directly.

export const UserRoles = {
  ADMIN: 'ADMIN',
  ASSET_MANAGER: 'ASSET_MANAGER',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const AssetStatuses = {
  AVAILABLE: 'AVAILABLE',
  ALLOCATED: 'ALLOCATED',
  RESERVED: 'RESERVED',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
  LOST: 'LOST',
  RETIRED: 'RETIRED',
  DISPOSED: 'DISPOSED',
} as const;

export type AssetStatus = (typeof AssetStatuses)[keyof typeof AssetStatuses];

export const AllocationStatuses = {
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED',
  TRANSFERRED: 'TRANSFERRED',
  OVERDUE: 'OVERDUE',
} as const;

export const TransferStatuses = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const BookingStatuses = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const MaintenanceStatuses = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  TECHNICIAN_ASSIGNED: 'TECHNICIAN_ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
} as const;

export const AuditCycleStatuses = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
} as const;

export const AuditItemResults = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  MISSING: 'MISSING',
  DAMAGED: 'DAMAGED',
} as const;

export const NotificationTypes = {
  ASSET_ASSIGNED: 'ASSET_ASSIGNED',
  MAINTENANCE_APPROVED: 'MAINTENANCE_APPROVED',
  MAINTENANCE_REJECTED: 'MAINTENANCE_REJECTED',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  TRANSFER_APPROVED: 'TRANSFER_APPROVED',
  OVERDUE_RETURN: 'OVERDUE_RETURN',
  AUDIT_DISCREPANCY: 'AUDIT_DISCREPANCY',
  ROLE_CHANGED: 'ROLE_CHANGED',
} as const;

/**
 * Allowed asset status transitions.
 * Key = current status, Value = array of valid target statuses.
 */
export const ASSET_STATUS_TRANSITIONS: Record<string, string[]> = {
  AVAILABLE: ['ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST'],
  ALLOCATED: ['AVAILABLE', 'UNDER_MAINTENANCE', 'LOST'],
  RESERVED: ['AVAILABLE', 'ALLOCATED'],
  UNDER_MAINTENANCE: ['AVAILABLE'],
  LOST: ['AVAILABLE', 'DISPOSED'],
  RETIRED: ['DISPOSED'],
  DISPOSED: [], // terminal state
};
