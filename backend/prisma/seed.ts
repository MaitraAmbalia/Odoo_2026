import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ── 1. Create Admin user (departmentId = null initially) ──
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.local' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@assetflow.local',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      departmentId: null,
    },
  });
  console.log(`  Admin user: ${admin.email}`);

  // ── 2. Create Departments ──
  const itDept = await prisma.department.upsert({
    where: { name: 'IT Operations' },
    update: {},
    create: {
      name: 'IT Operations',
      headUserId: admin.id,
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { name: 'Finance' },
    update: {},
    create: {
      name: 'Finance',
    },
  });

  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
    },
  });

  console.log(`  Departments: IT Operations, Finance, Human Resources`);

  // ── 3. Link Admin to IT department (closing the circular ref) ──
  await prisma.user.update({
    where: { id: admin.id },
    data: { departmentId: itDept.id },
  });

  // ── 4. Create sample users ──
  const assetManagerHash = await bcrypt.hash('Manager@123', 10);
  const assetManager = await prisma.user.upsert({
    where: { email: 'manager@assetflow.local' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'manager@assetflow.local',
      passwordHash: assetManagerHash,
      role: UserRole.ASSET_MANAGER,
      departmentId: itDept.id,
    },
  });

  const deptHeadHash = await bcrypt.hash('DeptHead@123', 10);
  const financeHead = await prisma.user.upsert({
    where: { email: 'finance.head@assetflow.local' },
    update: {},
    create: {
      name: 'Raj Patel',
      email: 'finance.head@assetflow.local',
      passwordHash: deptHeadHash,
      role: UserRole.DEPARTMENT_HEAD,
      departmentId: financeDept.id,
    },
  });

  // Set Raj as Finance department head
  await prisma.department.update({
    where: { id: financeDept.id },
    data: { headUserId: financeHead.id },
  });

  const employeeHash = await bcrypt.hash('Employee@123', 10);
  const employee1 = await prisma.user.upsert({
    where: { email: 'amit@assetflow.local' },
    update: {},
    create: {
      name: 'Amit Kumar',
      email: 'amit@assetflow.local',
      passwordHash: employeeHash,
      role: UserRole.EMPLOYEE,
      departmentId: financeDept.id,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'neha@assetflow.local' },
    update: {},
    create: {
      name: 'Neha Gupta',
      email: 'neha@assetflow.local',
      passwordHash: employeeHash,
      role: UserRole.EMPLOYEE,
      departmentId: itDept.id,
    },
  });

  console.log(`  Users: ${assetManager.name}, ${financeHead.name}, ${employee1.name}, ${employee2.name}`);

  // ── 5. Create Asset Categories ──
  const laptopCategory = await prisma.assetCategory.upsert({
    where: { name: 'Laptops' },
    update: {},
    create: {
      name: 'Laptops',
      description: 'Portable computing devices',
      customFieldsSchema: [
        { key: 'warrantyMonths', type: 'number', label: 'Warranty (months)' },
        { key: 'ram', type: 'string', label: 'RAM' },
        { key: 'storage', type: 'string', label: 'Storage' },
      ],
    },
  });

  const vehicleCategory = await prisma.assetCategory.upsert({
    where: { name: 'Vehicles' },
    update: {},
    create: {
      name: 'Vehicles',
      description: 'Company fleet vehicles',
      customFieldsSchema: [
        { key: 'registrationNumber', type: 'string', label: 'Registration No.' },
        { key: 'fuelType', type: 'string', label: 'Fuel Type' },
      ],
    },
  });

  const conferenceCategory = await prisma.assetCategory.upsert({
    where: { name: 'Conference Rooms' },
    update: {},
    create: {
      name: 'Conference Rooms',
      description: 'Bookable meeting spaces',
      customFieldsSchema: [
        { key: 'capacity', type: 'number', label: 'Seating Capacity' },
        { key: 'hasProjector', type: 'boolean', label: 'Has Projector' },
      ],
    },
  });

  const furnitureCategory = await prisma.assetCategory.upsert({
    where: { name: 'Office Furniture' },
    update: {},
    create: {
      name: 'Office Furniture',
      description: 'Desks, chairs, and other furniture',
      customFieldsSchema: Prisma.JsonNull,
    },
  });

  console.log(`  Categories: Laptops, Vehicles, Conference Rooms, Office Furniture`);

  console.log('\nSeeding complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:          admin@assetflow.local / Admin@123');
  console.log('  Asset Manager:  manager@assetflow.local / Manager@123');
  console.log('  Dept Head:      finance.head@assetflow.local / DeptHead@123');
  console.log('  Employee:       amit@assetflow.local / Employee@123');
  console.log('  Employee:       neha@assetflow.local / Employee@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
