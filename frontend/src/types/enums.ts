export type UserRole = 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AssetStatus = 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED';
export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';
export type AllocationStatus = 'ACTIVE' | 'RETURNED' | 'TRANSFERRED' | 'OVERDUE';
export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED';
export type BookingStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type MaintenanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'TECHNICIAN_ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditCycleStatus = 'PLANNED' | 'IN_PROGRESS' | 'CLOSED';
export type AuditItemResult = 'PENDING' | 'VERIFIED' | 'MISSING' | 'DAMAGED';
export type NotificationType =
  | 'ASSET_ASSIGNED' | 'MAINTENANCE_APPROVED' | 'MAINTENANCE_REJECTED'
  | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_REMINDER'
  | 'TRANSFER_APPROVED' | 'OVERDUE_RETURN' | 'AUDIT_DISCREPANCY' | 'ROLE_CHANGED';
