import 'dotenv/config';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/database';
import { env } from '../src/config/env';

async function main() {
  console.log('Seeding database with default Admin, Departments, and Job Positions...');

  // 1. Create or Upsert Admin User
  let adminUser = await prisma.users.findUnique({
    where: { email: 'admin@peoplepay360.com' },
  });

  if (!adminUser) {
    adminUser = await prisma.users.create({
      data: {
        email: 'admin@peoplepay360.com',
        full_name: 'System Admin',
        password_hash: '$2b$10$sampleHashedPasswordForDevEnvironment1234567890',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('Created admin user:', adminUser.email, 'ID:', adminUser.id.toString());
  } else {
    console.log('Admin user exists:', adminUser.email, 'ID:', adminUser.id.toString());
  }

  // 2. Generate a valid dev token
  const devToken = jwt.sign(
    {
      id: adminUser.id.toString(),
      email: adminUser.email,
      role: adminUser.role,
    },
    env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  console.log('\n--- DEV AUTH TOKEN (Valid 30 days) ---');
  console.log(devToken);
  console.log('-------------------------------------\n');

  // 3. Seed initial departments
  const initialDepartments = [
    { name: 'Engineering', code: 'ENG', is_active: true },
    { name: 'Human Resources', code: 'HR', is_active: true },
    { name: 'Finance & Accounts', code: 'FIN', is_active: true },
    { name: 'Sales & BD', code: 'SAL', is_active: true },
    { name: 'Marketing & Growth', code: 'MKT', is_active: true },
    { name: 'Operations & Legal', code: 'OPS', is_active: true },
  ];

  for (const dept of initialDepartments) {
    await prisma.departments.upsert({
      where: { code: dept.code },
      update: { name: dept.name, is_active: dept.is_active },
      create: dept,
    });
  }
  console.log(`Seeded ${initialDepartments.length} departments.`);

  // 4. Seed initial job positions
  const initialPositions = [
    { title: 'Full Stack Engineer', description: 'Designs and implements frontend and backend features.', is_active: true },
    { title: 'HR Manager', description: 'Oversees employee onboarding, compliance, and culture.', is_active: true },
    { title: 'Finance Analyst', description: 'Handles financial modeling, payroll auditing, and invoicing.', is_active: true },
    { title: 'Sales Executive', description: 'Drives enterprise client acquisition and partnerships.', is_active: true },
    { title: 'UI/UX Product Designer', description: 'Creates state-of-the-art web and mobile product experiences.', is_active: true },
    { title: 'Operations Lead', description: 'Coordinates workflow efficiency and resource allocation.', is_active: true },
  ];

    for (const pos of initialPositions) {
    await prisma.job_positions.upsert({
      where: { title: pos.title },
      update: { description: pos.description, is_active: pos.is_active },
      create: pos,
    });
  }
  console.log(`Seeded ${initialPositions.length} job positions.`);

  // 5. Seed initial working schedules
  const existingSchedule = await prisma.working_schedules.findFirst({
    where: { name: 'Standard 40h (Mon-Fri 09:00 - 18:00)' },
  });

  if (!existingSchedule) {
    const s1 = await prisma.working_schedules.create({
      data: {
        name: 'Standard 40h (Mon-Fri 09:00 - 18:00)',
        schedule_type: 'FIXED',
        weekly_hours: 40.0,
        is_active: true,
      },
    });

    for (let day = 1; day <= 5; day++) {
      await prisma.schedule_days.create({
        data: {
          schedule_id: s1.id,
          day_of_week: day,
          start_time: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          end_time: new Date(Date.UTC(1970, 0, 1, 18, 0, 0)),
          break_minutes: 60,
        },
      });
    }

    const s2 = await prisma.working_schedules.create({
      data: {
        name: 'Flexible 35h (Mon-Fri)',
        schedule_type: 'FLEXIBLE',
        weekly_hours: 35.0,
        is_active: true,
      },
    });

    for (let day = 1; day <= 5; day++) {
      await prisma.schedule_days.create({
        data: {
          schedule_id: s2.id,
          day_of_week: day,
          start_time: new Date(Date.UTC(1970, 0, 1, 10, 0, 0)),
          end_time: new Date(Date.UTC(1970, 0, 1, 18, 0, 0)),
          break_minutes: 60,
        },
      });
    }

    const s3 = await prisma.working_schedules.create({
      data: {
        name: 'Part-Time 20h (Mon-Fri Mornings)',
        schedule_type: 'FIXED',
        weekly_hours: 20.0,
        is_active: true,
      },
    });

    for (let day = 1; day <= 5; day++) {
      await prisma.schedule_days.create({
        data: {
          schedule_id: s3.id,
          day_of_week: day,
          start_time: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
          end_time: new Date(Date.UTC(1970, 0, 1, 13, 0, 0)),
          break_minutes: 0,
        },
      });
    }

    console.log('Seeded 3 working schedules with days.');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
