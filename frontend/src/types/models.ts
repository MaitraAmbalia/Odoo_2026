import {
  UserRole,
  UserStatus,
  AssetStatus,
  AssetCondition,
  AllocationStatus,
  TransferStatus,
  BookingStatus,
  MaintenanceStatus,
  MaintenancePriority,
  AuditCycleStatus,
  AuditItemResult,
  NotificationType
} from './enums';

export interface Department {
  id: string;
  name: string;
  parentDepartmentId?: string | null;
  headUserId?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  head?: User | null;
  parentDepartment?: Department | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  department?: Department | null;
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string | null;
  customFieldsSchema?: any | null;
  createdAt: string;
}

export interface AssetDocument {
  id: string;
  assetId: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  serialNumber?: string | null;
  acquisitionDate?: string | null;
  acquisitionCost?: number | null;
  condition: AssetCondition;
  location?: string | null;
  isBookable: boolean;
  status: AssetStatus;
  qrCodeUrl?: string | null;
  registeredById: string;
  customFieldValues?: any | null;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  documents?: AssetDocument[];
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  allocatedToUserId?: string | null;
  allocatedToDepartmentId?: string | null;
  allocatedById: string;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  status: AllocationStatus;
  conditionNoteOut?: string | null;
  conditionNoteIn?: string | null;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
  allocatedToUser?: User | null;
  allocatedToDepartment?: Department | null;
  allocatedBy?: User;
}

export interface AssetTransferRequest {
  id: string;
  assetId: string;
  fromAllocationId: string;
  requestedById: string;
  requestedToUserId?: string | null;
  requestedToDepartmentId?: string | null;
  sourceDepartmentId?: string | null;
  destinationDepartmentId?: string | null;
  requiresAssetManagerApproval: boolean;
  status: TransferStatus;
  approvedById?: string | null;
  notes?: string | null;
  requestedAt: string;
  resolvedAt?: string | null;
  asset?: Asset;
  fromAllocation?: AssetAllocation;
  requestedBy?: User;
  approvedBy?: User | null;
}

export interface Booking {
  id: string;
  assetId: string;
  bookedById: string;
  departmentId?: string | null;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  asset?: Asset;
  bookedBy?: User;
  department?: Department | null;
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  raisedById: string;
  issueDescription: string;
  priority: MaintenancePriority;
  photoUrl?: string | null;
  status: MaintenanceStatus;
  approvedById?: string | null;
  technicianName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
  raisedBy?: User;
  approvedBy?: User | null;
}

export interface AuditCycle {
  id: string;
  name: string;
  scopeDepartmentId?: string | null;
  scopeLocation?: string | null;
  startDate: string;
  endDate: string;
  status: AuditCycleStatus;
  createdById: string;
  closedAt?: string | null;
  createdAt: string;
  scopeDepartment?: Department | null;
  createdBy?: User;
}

export interface AuditItem {
  id: string;
  auditCycleId: string;
  assetId: string;
  result: AuditItemResult;
  notes?: string | null;
  verifiedById?: string | null;
  verifiedAt?: string | null;
  auditCycle?: AuditCycle;
  asset?: Asset;
  verifiedBy?: User | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
  user?: User;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any | null;
  createdAt: string;
  user?: User | null;
}
