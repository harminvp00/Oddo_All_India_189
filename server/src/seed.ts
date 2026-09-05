import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './config/database';

async function main() {
  console.log('Seeding initial system users...');

  const adminEmail = 'admin@peoplepay360.com';
  const existingAdmin = await prisma.users.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const adminUser = await prisma.users.create({
      data: {
        email: adminEmail,
        full_name: 'Admin User',
        password_hash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Created default Admin user: ${adminUser.email} (ID: ${adminUser.id})`);
  } else {
    console.log(`Admin user already exists: ${existingAdmin.email}`);
  }

  const hrEmail = 'sarah.connor@peoplepay360.com';
  const existingHr = await prisma.users.findUnique({
    where: { email: hrEmail },
  });

  if (!existingHr) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const hrUser = await prisma.users.create({
      data: {
        email: hrEmail,
        full_name: 'Sarah Connor',
        password_hash: passwordHash,
        role: 'HR_MANAGER',
        status: 'ACTIVE',
      },
    });
    console.log(`Created default HR Manager user: ${hrUser.email}`);
  }

  const payrollUserEmail = 'krish.s@peoplepay360.com';
  const existingPayrollUser = await prisma.users.findUnique({
    where: { email: payrollUserEmail },
  });

  if (!existingPayrollUser) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const payrollUser = await prisma.users.create({
      data: {
        email: payrollUserEmail,
        full_name: 'Krish Solanki',
        password_hash: passwordHash,
        role: 'HR_PAYROLL_USER',
        status: 'ACTIVE',
      },
    });
    console.log(`Created default HR Payroll User: ${payrollUser.email}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
