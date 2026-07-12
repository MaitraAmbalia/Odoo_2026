import { PrismaClient, UserRole, UserStatus, AssetStatus, AssetCondition, AllocationStatus, TransferStatus, BookingStatus, MaintenanceStatus, MaintenancePriority, NotificationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with rich sample data...');

  // ── 1. Clear database in correct order ──
  console.log('  Cleaning existing database records...');
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditCycleAuditor.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.assetTransferRequest.deleteMany({});
  await prisma.assetAllocation.deleteMany({});
  await prisma.assetDocument.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  
  // Set headUserId to null on departments first to prevent circular dependency violation when deleting users/departments
  await prisma.department.updateMany({ data: { headUserId: null } });
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // ── 2. Create Departments ──
  const itDept = await prisma.department.create({
    data: { name: 'IT Operations', status: UserStatus.ACTIVE },
  });

  const financeDept = await prisma.department.create({
    data: { name: 'Finance', status: UserStatus.ACTIVE },
  });

  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', status: UserStatus.ACTIVE },
  });

  const salesDept = await prisma.department.create({
    data: { name: 'Sales & Marketing', status: UserStatus.ACTIVE },
  });

  console.log('  Created departments');

  // ── 3. Create Users ──
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@assetflow.local',
      passwordHash,
      role: UserRole.ADMIN,
      departmentId: itDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'manager@assetflow.local',
      passwordHash,
      role: UserRole.ASSET_MANAGER,
      departmentId: itDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  const financeHead = await prisma.user.create({
    data: {
      name: 'Raj Patel',
      email: 'finance.head@assetflow.local',
      passwordHash,
      role: UserRole.DEPARTMENT_HEAD,
      departmentId: financeDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  const hrHead = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'hr.head@assetflow.local',
      passwordHash,
      role: UserRole.DEPARTMENT_HEAD,
      departmentId: hrDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit@assetflow.local',
      passwordHash,
      role: UserRole.EMPLOYEE,
      departmentId: financeDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      name: 'Neha Gupta',
      email: 'neha@assetflow.local',
      passwordHash,
      role: UserRole.EMPLOYEE,
      departmentId: itDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul@assetflow.local',
      passwordHash,
      role: UserRole.EMPLOYEE,
      departmentId: salesDept.id,
      status: UserStatus.ACTIVE,
    },
  });

  // Link heads to departments
  await prisma.department.update({ where: { id: itDept.id }, data: { headUserId: admin.id } });
  await prisma.department.update({ where: { id: financeDept.id }, data: { headUserId: financeHead.id } });
  await prisma.department.update({ where: { id: hrDept.id }, data: { headUserId: hrHead.id } });

  console.log('  Created users and configured department relationships');

  // ── 4. Create Asset Categories ──
  const laptopCategory = await prisma.assetCategory.create({
    data: {
      name: 'Laptops',
      description: 'Portable computing devices for employees',
      customFieldsSchema: [
        { key: 'warrantyMonths', type: 'number', label: 'Warranty (months)' },
        { key: 'ram', type: 'string', label: 'RAM' },
        { key: 'storage', type: 'string', label: 'Storage' },
      ],
    },
  });

  const vehicleCategory = await prisma.assetCategory.create({
    data: {
      name: 'Vehicles',
      description: 'Company fleet vehicles for transit',
      customFieldsSchema: [
        { key: 'registrationNumber', type: 'string', label: 'Registration No.' },
        { key: 'fuelType', type: 'string', label: 'Fuel Type' },
      ],
    },
  });

  const conferenceCategory = await prisma.assetCategory.create({
    data: {
      name: 'Conference Rooms',
      description: 'Bookable meeting and presentation rooms',
      customFieldsSchema: [
        { key: 'capacity', type: 'number', label: 'Seating Capacity' },
        { key: 'hasProjector', type: 'boolean', label: 'Has Projector' },
      ],
    },
  });

  const furnitureCategory = await prisma.assetCategory.create({
    data: {
      name: 'Office Furniture',
      description: 'Desks, chairs, whiteboards',
      customFieldsSchema: [],
    },
  });

  console.log('  Created asset categories');

  // ── 5. Create Assets ──
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const fourYearsAgo = new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000); // Trigger near-retirement logic

  const laptop1 = await prisma.asset.create({
    data: {
      assetTag: 'AF-0001',
      name: 'ThinkPad T14 Gen 4',
      categoryId: laptopCategory.id,
      serialNumber: 'SN-THINK-10029',
      acquisitionDate: oneYearAgo,
      acquisitionCost: 1200.00,
      condition: AssetCondition.GOOD,
      location: 'HQ Bangalore',
      isBookable: false,
      status: AssetStatus.AVAILABLE,
      qrCodeUrl: '/uploads/assets/qr-AF-0001.png',
      registeredById: admin.id,
      customFieldValues: { warrantyMonths: 36, ram: '16GB', storage: '512GB SSD' },
    },
  });

  const laptop2 = await prisma.asset.create({
    data: {
      assetTag: 'AF-0002',
      name: 'MacBook Pro 16 M3',
      categoryId: laptopCategory.id,
      serialNumber: 'SN-MAC-88371',
      acquisitionDate: oneYearAgo,
      acquisitionCost: 2400.00,
      condition: AssetCondition.GOOD,
      location: 'HQ Bangalore',
      isBookable: false,
      status: AssetStatus.ALLOCATED,
      qrCodeUrl: '/uploads/assets/qr-AF-0002.png',
      registeredById: admin.id,
      customFieldValues: { warrantyMonths: 12, ram: '32GB', storage: '1TB SSD' },
    },
  });

  const laptop3 = await prisma.asset.create({
    data: {
      assetTag: 'AF-0003',
      name: 'Dell Latitude 5440',
      categoryId: laptopCategory.id,
      serialNumber: 'SN-DELL-55291',
      acquisitionDate: fourYearsAgo, // old asset
      acquisitionCost: 950.00,
      condition: AssetCondition.POOR, // poor condition + old => due for maintenance!
      location: 'Pune Office',
      isBookable: false,
      status: AssetStatus.UNDER_MAINTENANCE,
      qrCodeUrl: '/uploads/assets/qr-AF-0003.png',
      registeredById: manager.id,
      customFieldValues: { warrantyMonths: 36, ram: '8GB', storage: '256GB SSD' },
    },
  });

  const boardroom = await prisma.asset.create({
    data: {
      assetTag: 'AF-0004',
      name: 'Boardroom A (Main)',
      categoryId: conferenceCategory.id,
      serialNumber: 'SR-MEET-00A',
      acquisitionDate: oneYearAgo,
      acquisitionCost: 5000.00,
      condition: AssetCondition.GOOD,
      location: 'HQ Bangalore - 3rd Floor',
      isBookable: true, // Bookable resource!
      status: AssetStatus.AVAILABLE,
      qrCodeUrl: '/uploads/assets/qr-AF-0004.png',
      registeredById: admin.id,
      customFieldValues: { capacity: 20, hasProjector: true },
    },
  });

  const huddleRoom = await prisma.asset.create({
    data: {
      assetTag: 'AF-0005',
      name: 'Huddle Room C',
      categoryId: conferenceCategory.id,
      serialNumber: 'SR-MEET-00C',
      acquisitionDate: oneYearAgo,
      acquisitionCost: 1500.00,
      condition: AssetCondition.GOOD,
      location: 'HQ Bangalore - 2nd Floor',
      isBookable: true,
      status: AssetStatus.AVAILABLE,
      qrCodeUrl: '/uploads/assets/qr-AF-0005.png',
      registeredById: admin.id,
      customFieldValues: { capacity: 4, hasProjector: false },
    },
  });

  const tesla = await prisma.asset.create({
    data: {
      assetTag: 'AF-0006',
      name: 'Tesla Model Y',
      categoryId: vehicleCategory.id,
      serialNumber: 'SN-TESLA-88291',
      acquisitionDate: oneYearAgo,
      acquisitionCost: 45000.00,
      condition: AssetCondition.GOOD,
      location: 'HQ Bangalore - Garage',
      isBookable: false,
      status: AssetStatus.ALLOCATED,
      qrCodeUrl: '/uploads/assets/qr-AF-0006.png',
      registeredById: manager.id,
      customFieldValues: { registrationNumber: 'KA-01-MJ-9921', fuelType: 'Electric' },
    },
  });

  console.log('  Created assets');

  // ── 6. Create Allocations ──
  // Active allocation
  const alloc1 = await prisma.assetAllocation.create({
    data: {
      assetId: laptop2.id,
      allocatedToUserId: employee2.id, // Neha Gupta
      allocatedById: admin.id,
      status: AllocationStatus.ACTIVE,
      conditionNoteOut: 'Brand new out of the box',
      expectedReturnDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    },
  });

  // Overdue allocation (expected return was 5 days ago)
  const alloc2 = await prisma.assetAllocation.create({
    data: {
      assetId: tesla.id,
      allocatedToUserId: employee1.id, // Amit Kumar
      allocatedById: manager.id,
      status: AllocationStatus.OVERDUE,
      conditionNoteOut: 'Clean condition, battery 100%',
      expectedReturnDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  // Past returned allocation
  const alloc3 = await prisma.assetAllocation.create({
    data: {
      assetId: laptop1.id,
      allocatedToUserId: employee3.id, // Rahul Verma
      allocatedById: admin.id,
      status: AllocationStatus.RETURNED,
      conditionNoteOut: 'Perfect condition',
      expectedReturnDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      actualReturnDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      conditionNoteIn: 'Returned with minor scratches on case',
    },
  });

  console.log('  Created asset allocations (active, overdue, and past returned)');

  // ── 7. Create Bookings (using today's date dynamically to show up on timeline!) ──
  const todayStr = now.toISOString().split('T')[0];

  // Ongoing booking right now
  const booking1 = await prisma.booking.create({
    data: {
      assetId: boardroom.id,
      bookedById: employee1.id, // Amit Kumar
      departmentId: financeDept.id,
      startTime: new Date(`${todayStr}T09:00:00`),
      endTime: new Date(`${todayStr}T11:00:00`),
      status: BookingStatus.ONGOING,
    },
  });

  // Upcoming booking today
  const booking2 = await prisma.booking.create({
    data: {
      assetId: boardroom.id,
      bookedById: financeHead.id, // Raj Patel
      departmentId: financeDept.id,
      startTime: new Date(`${todayStr}T13:30:00`),
      endTime: new Date(`${todayStr}T15:30:00`),
      status: BookingStatus.UPCOMING,
    },
  });

  // Upcoming booking in the huddle room
  const booking3 = await prisma.booking.create({
    data: {
      assetId: huddleRoom.id,
      bookedById: employee2.id, // Neha Gupta
      departmentId: itDept.id,
      startTime: new Date(`${todayStr}T16:00:00`),
      endTime: new Date(`${todayStr}T17:00:00`),
      status: BookingStatus.UPCOMING,
    },
  });

  console.log('  Created booking slots for today');

  // ── 8. Create Maintenance Requests ──
  // Pending request
  const maint1 = await prisma.maintenanceRequest.create({
    data: {
      assetId: laptop3.id,
      raisedById: employee2.id,
      issueDescription: 'Laptop crashes constantly and battery dies within 30 minutes.',
      priority: MaintenancePriority.HIGH,
      status: MaintenanceStatus.PENDING,
    },
  });

  // In progress request
  const maint2 = await prisma.maintenanceRequest.create({
    data: {
      assetId: laptop1.id,
      raisedById: employee3.id,
      issueDescription: 'Keyboard keys "E" and "R" are not working.',
      priority: MaintenancePriority.MEDIUM,
      status: MaintenanceStatus.IN_PROGRESS,
      approvedById: manager.id,
      technicianName: 'QuickFix Electronics Ltd.',
    },
  });

  // Resolved request
  const maint3 = await prisma.maintenanceRequest.create({
    data: {
      assetId: tesla.id,
      raisedById: manager.id,
      issueDescription: 'Autopilot camera calibration required after minor bumper alignment.',
      priority: MaintenancePriority.LOW,
      status: MaintenanceStatus.RESOLVED,
      approvedById: admin.id,
      technicianName: 'Tesla Service Center',
      resolutionNotes: 'Calibrated all camera sensors, upgraded firmware to latest v12.',
      resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  Created maintenance requests (pending, in-progress, and resolved)');

  // ── 9. Create Activity Logs ──
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'ASSET_REGISTERED',
      entityType: 'Asset',
      entityId: laptop2.id,
      metadata: { name: laptop2.name, tag: laptop2.assetTag },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: manager.id,
      action: 'ASSET_ALLOCATED',
      entityType: 'AssetAllocation',
      entityId: alloc1.id,
      metadata: { assetName: laptop2.name, userName: employee2.name },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: employee1.id,
      action: 'RESOURCE_BOOKED',
      entityType: 'Booking',
      entityId: booking1.id,
      metadata: { resourceName: boardroom.name, timeslot: '09:00 AM - 11:00 AM' },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: employee2.id,
      action: 'MAINTENANCE_REQUESTED',
      entityType: 'MaintenanceRequest',
      entityId: maint1.id,
      metadata: { assetTag: laptop3.assetTag, problem: 'Battery dies' },
    },
  });

  console.log('  Created activity logs');

  // ── 10. Create Notifications ──
  await prisma.notification.create({
    data: {
      userId: employee2.id,
      type: NotificationType.ASSET_ASSIGNED,
      message: `A new MacBook Pro 16 M3 (Tag: ${laptop2.assetTag}) has been allocated to you. Expected return date: ${alloc1.expectedReturnDate?.toDateString()}.`,
      relatedEntityType: 'AssetAllocation',
      relatedEntityId: alloc1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: employee1.id,
      type: NotificationType.OVERDUE_RETURN,
      message: `Your allocation for Tesla Model Y (Tag: ${tesla.assetTag}) is OVERDUE. Please return it or contact the asset manager.`,
      relatedEntityType: 'AssetAllocation',
      relatedEntityId: alloc2.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.BOOKING_CONFIRMED,
      message: `${employee1.name} has booked Conference Room Boardroom A today from 09:00 AM to 11:00 AM.`,
      relatedEntityType: 'Booking',
      relatedEntityId: booking1.id,
      isRead: false,
    },
  });

  console.log('  Created notification alerts');

  console.log('\nSeeding successfully complete!');
  console.log('\nCredentials for exploration:');
  console.log('  Admin (IT Head):      admin@assetflow.local / Password@123');
  console.log('  Asset Manager:        manager@assetflow.local / Password@123');
  console.log('  Finance Head:         finance.head@assetflow.local / Password@123');
  console.log('  IT Employee (Neha):   neha@assetflow.local / Password@123');
  console.log('  Fin Employee (Amit):  amit@assetflow.local / Password@123');
  console.log('  Sales Employee:       rahul@assetflow.local / Password@123');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
