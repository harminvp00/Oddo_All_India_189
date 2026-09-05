import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from './config/database';

async function main() {
  console.log('🌱 Starting comprehensive database seed for PeoplePay 360...\n');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Departments (6)
  console.log('🏢 Seeding Departments...');
  const departmentsData = [
    { name: 'Engineering', code: 'ENG', is_active: true },
    { name: 'Human Resources', code: 'HR', is_active: true },
    { name: 'Finance & Accounts', code: 'FIN', is_active: true },
    { name: 'Product & Design', code: 'PD', is_active: true },
    { name: 'Sales & Business Dev', code: 'SAL', is_active: true },
    { name: 'Marketing & Growth', code: 'MKT', is_active: true },
  ];

  const depts: Record<string, any> = {};
  for (const dept of departmentsData) {
    depts[dept.code] = await prisma.departments.upsert({
      where: { code: dept.code },
      update: { name: dept.name, is_active: dept.is_active },
      create: dept,
    });
  }
  console.log(`✓ Seeded ${departmentsData.length} departments.`);

  // 2. Seed Job Positions (6)
  console.log('💼 Seeding Job Positions...');
  const positionsData = [
    { title: 'Lead Full Stack Architect', description: 'Architects enterprise distributed cloud systems.', is_active: true },
    { title: 'Senior Backend Engineer', description: 'Builds core payroll computation & database engines.', is_active: true },
    { title: 'HR Operations Lead', description: 'Directs talent lifecycle, payroll compliance, and benefits.', is_active: true },
    { title: 'Financial Controller', description: 'Oversees statutory auditing, tax returns, and disbursements.', is_active: true },
    { title: 'Principal UI/UX Designer', description: 'Designs cutting-edge enterprise SaaS interfaces.', is_active: true },
    { title: 'Enterprise Account Executive', description: 'Drives high-value SaaS contracts and enterprise sales.', is_active: true },
  ];

  const positions: Record<string, any> = {};
  for (const pos of positionsData) {
    positions[pos.title] = await prisma.job_positions.upsert({
      where: { title: pos.title },
      update: { description: pos.description, is_active: pos.is_active },
      create: pos,
    });
  }
  console.log(`✓ Seeded ${positionsData.length} job positions.`);

  // 3. Seed Working Schedules & Schedule Days (4)
  console.log('⏰ Seeding Working Schedules...');
  const schedulesData = [
    { name: 'Standard 40h (Mon-Fri 09:00 - 18:00)', schedule_type: 'FIXED' as const, weekly_hours: 40.0, days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00', breakMin: 60 },
    { name: 'Engineering Flexible 37.5h (Mon-Fri)', schedule_type: 'FLEXIBLE' as const, weekly_hours: 37.5, days: [1, 2, 3, 4, 5], start: '10:00', end: '18:30', breakMin: 60 },
    { name: 'Shift Operations 42h (Mon-Sat)', schedule_type: 'FIXED' as const, weekly_hours: 42.0, days: [1, 2, 3, 4, 5, 6], start: '09:00', end: '17:00', breakMin: 60 },
    { name: 'Part-Time Executive 20h', schedule_type: 'FIXED' as const, weekly_hours: 20.0, days: [1, 2, 3, 4, 5], start: '09:00', end: '13:00', breakMin: 0 },
  ];

  const schedules: Record<string, any> = {};
  for (const s of schedulesData) {
    let existing = await prisma.working_schedules.findFirst({ where: { name: s.name } });
    if (!existing) {
      existing = await prisma.working_schedules.create({
        data: {
          name: s.name,
          schedule_type: s.schedule_type,
          weekly_hours: s.weekly_hours,
          is_active: true,
        },
      });

      for (const d of s.days) {
        const [startH, startM] = s.start.split(':').map(Number);
        const [endH, endM] = s.end.split(':').map(Number);
        await prisma.schedule_days.create({
          data: {
            schedule_id: existing.id,
            day_of_week: d,
            start_time: new Date(Date.UTC(1970, 0, 1, startH, startM, 0)),
            end_time: new Date(Date.UTC(1970, 0, 1, endH, endM, 0)),
            break_minutes: s.breakMin,
          },
        });
      }
    }
    schedules[s.name] = existing;
  }
  console.log(`✓ Seeded ${schedulesData.length} working schedules.`);

  // 4. Seed Users (6)
  console.log('👤 Seeding System Users...');
  const usersData = [
    { email: 'admin@peoplepay360.com', full_name: 'Krish Patel', role: 'ADMIN' as const, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { email: 'rahul.sharma@peoplepay360.com', full_name: 'Rahul Sharma', role: 'HR_PAYROLL_USER' as const, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { email: 'amit.patel@peoplepay360.com', full_name: 'Amit Patel', role: 'EMPLOYEE' as const, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { email: 'neha.shah@peoplepay360.com', full_name: 'Neha Shah', role: 'HR_MANAGER' as const, avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { email: 'priya.mehta@peoplepay360.com', full_name: 'Priya Mehta', role: 'HR_PAYROLL_MANAGER' as const, avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { email: 'sunil.verma@peoplepay360.com', full_name: 'Sunil Verma', role: 'EMPLOYEE' as const, avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    users[u.email] = await prisma.users.upsert({
      where: { email: u.email },
      update: { full_name: u.full_name, role: u.role, avatar_url: u.avatar_url, password_hash: passwordHash, status: 'ACTIVE' },
      create: {
        email: u.email,
        full_name: u.full_name,
        password_hash: passwordHash,
        role: u.role,
        status: 'ACTIVE',
        avatar_url: u.avatar_url,
      },
    });
  }
  console.log(`✓ Seeded ${usersData.length} system users.`);

  // 5. Seed Employees (6)
  console.log('👥 Seeding Employee Profiles with Bank Accounts & Avatars...');
  const employeesData = [
    {
      code: 'EMP0001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@peoplepay360.com',
      phone: '+91 98765 43210',
      dob: '1992-05-15',
      hireDate: '2023-01-10',
      deptCode: 'ENG',
      positionTitle: 'Lead Full Stack Architect',
      scheduleName: 'Standard 40h (Mon-Fri 09:00 - 18:00)',
      bankName: 'HDFC Bank',
      bankAccName: 'Rahul Sharma',
      bankAccNo: '5010049281923',
      ifsc: 'HDFC0001234',
    },
    {
      code: 'EMP0002',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit.patel@peoplepay360.com',
      phone: '+91 98765 43211',
      dob: '1994-08-22',
      hireDate: '2023-03-01',
      deptCode: 'ENG',
      positionTitle: 'Senior Backend Engineer',
      scheduleName: 'Engineering Flexible 37.5h (Mon-Fri)',
      bankName: 'ICICI Bank',
      bankAccName: 'Amit Patel',
      bankAccNo: '102938475612',
      ifsc: 'ICIC0000982',
    },
    {
      code: 'EMP0003',
      firstName: 'Neha',
      lastName: 'Shah',
      email: 'neha.shah@peoplepay360.com',
      phone: '+91 98765 43212',
      dob: '1993-11-04',
      hireDate: '2022-07-15',
      deptCode: 'HR',
      positionTitle: 'HR Operations Lead',
      scheduleName: 'Standard 40h (Mon-Fri 09:00 - 18:00)',
      bankName: 'State Bank of India',
      bankAccName: 'Neha Shah',
      bankAccNo: '309485726190',
      ifsc: 'SBIN0004521',
    },
    {
      code: 'EMP0004',
      firstName: 'Priya',
      lastName: 'Mehta',
      email: 'priya.mehta@peoplepay360.com',
      phone: '+91 98765 43213',
      dob: '1991-03-18',
      hireDate: '2022-04-01',
      deptCode: 'FIN',
      positionTitle: 'Financial Controller',
      scheduleName: 'Standard 40h (Mon-Fri 09:00 - 18:00)',
      bankName: 'Axis Bank',
      bankAccName: 'Priya Mehta',
      bankAccNo: '918273645019',
      ifsc: 'UTIB0001092',
    },
    {
      code: 'EMP0005',
      firstName: 'Sunil',
      lastName: 'Verma',
      email: 'sunil.verma@peoplepay360.com',
      phone: '+91 98765 43214',
      dob: '1995-12-30',
      hireDate: '2023-09-15',
      deptCode: 'SAL',
      positionTitle: 'Enterprise Account Executive',
      scheduleName: 'Shift Operations 42h (Mon-Sat)',
      bankName: 'Kotak Mahindra Bank',
      bankAccName: 'Sunil Verma',
      bankAccNo: '625184930271',
      ifsc: 'KKBK0000214',
    },
    {
      code: 'EMP0006',
      firstName: 'Deepa',
      lastName: 'Krishnan',
      email: 'deepa.k@peoplepay360.com',
      phone: '+91 98765 43215',
      dob: '1996-07-19',
      hireDate: '2024-02-01',
      deptCode: 'PD',
      positionTitle: 'Principal UI/UX Designer',
      scheduleName: 'Engineering Flexible 37.5h (Mon-Fri)',
      bankName: 'HDFC Bank',
      bankAccName: 'Deepa Krishnan',
      bankAccNo: '5010099887766',
      ifsc: 'HDFC0001234',
    },
  ];

  const employees: Record<string, any> = {};
  for (const emp of employeesData) {
    const user = users[emp.email];
    const dept = depts[emp.deptCode];
    const pos = positions[emp.positionTitle];
    const sched = schedules[emp.scheduleName];

    let existingEmp = await prisma.employees.findUnique({ where: { employee_code: emp.code } });
    if (!existingEmp) {
      existingEmp = await prisma.employees.create({
        data: {
          employee_code: emp.code,
          first_name: emp.firstName,
          last_name: emp.lastName,
          phone: emp.phone,
          date_of_birth: new Date(emp.dob),
          hire_date: new Date(emp.hireDate),
          employee_type: 'FULL_TIME',
          employment_status: 'ACTIVE',
          department_id: dept?.id,
          position_id: pos?.id,
          schedule_id: sched?.id,
          user_id: user?.id,
          bank_name: emp.bankName,
          bank_account_name: emp.bankAccName,
          bank_account_number: emp.bankAccNo,
          ifsc_code: emp.ifsc,
        },
      });
    } else {
      existingEmp = await prisma.employees.update({
        where: { id: existingEmp.id },
        data: {
          first_name: emp.firstName,
          last_name: emp.lastName,
          phone: emp.phone,
          department_id: dept?.id,
          position_id: pos?.id,
          schedule_id: sched?.id,
          user_id: user?.id,
          bank_name: emp.bankName,
          bank_account_name: emp.bankAccName,
          bank_account_number: emp.bankAccNo,
          ifsc_code: emp.ifsc,
        },
      });
    }
    employees[emp.code] = existingEmp;
  }
  console.log(`✓ Seeded ${employeesData.length} employee profiles.`);

  // 6. Seed Salary Structures & Rules
  console.log('📊 Seeding Salary Structures & Computation Rules...');
  const structuresData = [
    { name: 'Standard Engineering CTC Structure', description: 'CTC breakdown with 50% Basic, HRA, Transport, PF & PT for engineers.' },
    { name: 'Management & Operations CTC Structure', description: 'Executive structure with medical & performance allowance.' },
    { name: 'Sales Incentive & Commission Structure', description: 'Variable bonus and high incentive base.' },
  ];

  const structures: Record<string, any> = {};
  for (const st of structuresData) {
    structures[st.name] = await prisma.salary_structures.upsert({
      where: { name: st.name },
      update: { description: st.description },
      create: { name: st.name, description: st.description, is_active: true },
    });
  }

  const rulesData = [
    { name: 'Basic Salary', code: 'BASIC', category: 'BASIC' as const, method: 'PERCENTAGE' as const, percentage: 0.5000 },
    { name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'ALLOWANCE' as const, method: 'PERCENTAGE' as const, percentage: 0.2500 },
    { name: 'Special Allowance', code: 'SPECIAL', category: 'ALLOWANCE' as const, method: 'PERCENTAGE' as const, percentage: 0.2000 },
    { name: 'Transport Allowance', code: 'TRANSPORT', category: 'ALLOWANCE' as const, method: 'FIXED' as const, fixed_amount: 5000.00 },
    { name: 'Provident Fund (PF Employee)', code: 'PF_EMP', category: 'DEDUCTION' as const, method: 'PERCENTAGE' as const, percentage: 0.1200 },
    { name: 'Professional Tax (PT)', code: 'PT', category: 'DEDUCTION' as const, method: 'FIXED' as const, fixed_amount: 200.00 },
    { name: 'Income Tax (TDS)', code: 'TDS', category: 'DEDUCTION' as const, method: 'PERCENTAGE' as const, percentage: 0.0500 },
  ];

  const rules: Record<string, any> = {};
  for (const r of rulesData) {
    rules[r.code] = await prisma.salary_rules.upsert({
      where: { code: r.code },
      update: { name: r.name, category: r.category, method: r.method, percentage: r.percentage, fixed_amount: r.fixed_amount },
      create: { name: r.name, code: r.code, category: r.category, method: r.method, percentage: r.percentage, fixed_amount: r.fixed_amount, is_active: true },
    });
  }

  // Link rules to structures
  const defaultStructure = structures['Standard Engineering CTC Structure'];
  if (defaultStructure) {
    let order = 1;
    for (const rCode of ['BASIC', 'HRA', 'SPECIAL', 'TRANSPORT', 'PF_EMP', 'PT', 'TDS']) {
      const rule = rules[rCode];
      if (rule) {
        await prisma.salary_structure_rules.upsert({
          where: { structure_id_rule_id: { structure_id: defaultStructure.id, rule_id: rule.id } },
          update: { execution_order: order },
          create: { structure_id: defaultStructure.id, rule_id: rule.id, execution_order: order },
        });
        order++;
      }
    }
  }
  console.log(`✓ Seeded ${structuresData.length} salary structures and ${rulesData.length} rules.`);

  // 7. Seed In-Force Employment Contracts (6)
  console.log('📜 Seeding In-Force Employment Contracts...');
  const contractsData = [
    { empCode: 'EMP0001', contractNo: 'CNT-2023-001', wage: 185000.00, startDate: '2023-01-10', structure: 'Standard Engineering CTC Structure', dept: 'ENG', pos: 'Lead Full Stack Architect', sched: 'Standard 40h (Mon-Fri 09:00 - 18:00)' },
    { empCode: 'EMP0002', contractNo: 'CNT-2023-002', wage: 140000.00, startDate: '2023-03-01', structure: 'Standard Engineering CTC Structure', dept: 'ENG', pos: 'Senior Backend Engineer', sched: 'Engineering Flexible 37.5h (Mon-Fri)' },
    { empCode: 'EMP0003', contractNo: 'CNT-2022-003', wage: 95000.00, startDate: '2022-07-15', structure: 'Management & Operations CTC Structure', dept: 'HR', pos: 'HR Operations Lead', sched: 'Standard 40h (Mon-Fri 09:00 - 18:00)' },
    { empCode: 'EMP0004', contractNo: 'CNT-2022-004', wage: 125000.00, startDate: '2022-04-01', structure: 'Management & Operations CTC Structure', dept: 'FIN', pos: 'Financial Controller', sched: 'Standard 40h (Mon-Fri 09:00 - 18:00)' },
    { empCode: 'EMP0005', contractNo: 'CNT-2023-005', wage: 85000.00, startDate: '2023-09-15', structure: 'Sales Incentive & Commission Structure', dept: 'SAL', pos: 'Enterprise Account Executive', sched: 'Shift Operations 42h (Mon-Sat)' },
    { empCode: 'EMP0006', contractNo: 'CNT-2024-006', wage: 110000.00, startDate: '2024-02-01', structure: 'Standard Engineering CTC Structure', dept: 'PD', pos: 'Principal UI/UX Designer', sched: 'Engineering Flexible 37.5h (Mon-Fri)' },
  ];

  for (const c of contractsData) {
    const emp = employees[c.empCode];
    const struct = structures[c.structure] || defaultStructure;
    const dept = depts[c.dept];
    const pos = positions[c.pos];
    const sched = schedules[c.sched];

    if (emp) {
      const existingCnt = await prisma.contracts.findUnique({ where: { contract_number: c.contractNo } });
      if (!existingCnt) {
        await prisma.contracts.create({
          data: {
            employee_id: emp.id,
            contract_number: c.contractNo,
            start_date: new Date(c.startDate),
            wage: c.wage,
            status: 'ACTIVE',
            salary_structure_id: struct.id,
            department_id: dept?.id,
            position_id: pos?.id,
            schedule_id: sched?.id,
            currency_code: 'INR',
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${contractsData.length} active contracts.`);

  // 8. Seed Leave Types & Allocations (5 Types)
  console.log('🏖️ Seeding Time Off Leave Types & Employee Allocations...');
  const leaveTypesData = [
    { name: 'Paid Privilege Leave (PL)', code: 'PL', unit: 'DAY' as const, requires_allocation: true, max_consecutive_units: 14.0 },
    { name: 'Sick & Medical Leave (SL)', code: 'SL', unit: 'DAY' as const, requires_allocation: true, max_consecutive_units: 7.0 },
    { name: 'Casual Leave (CL)', code: 'CL', unit: 'DAY' as const, requires_allocation: true, max_consecutive_units: 3.0 },
    { name: 'Compensatory Off (Comp-Off)', code: 'COMP', unit: 'DAY' as const, requires_allocation: false, max_consecutive_units: 2.0 },
    { name: 'Unpaid Leave of Absence', code: 'UNPAID', unit: 'DAY' as const, requires_allocation: false, payroll_deductible: true },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of leaveTypesData) {
    leaveTypes[lt.code] = await prisma.leave_types.upsert({
      where: { code: lt.code },
      update: { name: lt.name, unit: lt.unit },
      create: { name: lt.name, code: lt.code, unit: lt.unit, is_active: true },
    });
  }

  // Allocate 20 PL and 10 SL to each employee
  const plType = leaveTypes['PL'];
  const slType = leaveTypes['SL'];
  const clType = leaveTypes['CL'];

  for (const empCode of Object.keys(employees)) {
    const emp = employees[empCode];
    if (emp && plType) {
      await prisma.leave_allocations.upsert({
        where: {
          employee_id_leave_type_id_valid_from_valid_to: {
            employee_id: emp.id,
            leave_type_id: plType.id,
            valid_from: new Date('2026-01-01'),
            valid_to: new Date('2026-12-31'),
          },
        },
        update: { allocated_units: 20.0, status: 'APPROVED' },
        create: {
          employee_id: emp.id,
          leave_type_id: plType.id,
          valid_from: new Date('2026-01-01'),
          valid_to: new Date('2026-12-31'),
          allocated_units: 20.0,
          used_units: 2.0,
          status: 'APPROVED',
        },
      });
    }

    if (emp && slType) {
      await prisma.leave_allocations.upsert({
        where: {
          employee_id_leave_type_id_valid_from_valid_to: {
            employee_id: emp.id,
            leave_type_id: slType.id,
            valid_from: new Date('2026-01-01'),
            valid_to: new Date('2026-12-31'),
          },
        },
        update: { allocated_units: 10.0, status: 'APPROVED' },
        create: {
          employee_id: emp.id,
          leave_type_id: slType.id,
          valid_from: new Date('2026-01-01'),
          valid_to: new Date('2026-12-31'),
          allocated_units: 10.0,
          used_units: 1.0,
          status: 'APPROVED',
        },
      });
    }
  }
  console.log(`✓ Seeded leave types & allocations for all employees.`);

  // 9. Seed Leave Requests (6)
  console.log('📝 Seeding Sample Leave Requests...');
  const sampleLeaves = [
    { empCode: 'EMP0001', ltCode: 'PL', start: '2026-09-10', end: '2026-09-12', units: 3, reason: 'Annual Family Vacation', status: 'APPROVED' as const },
    { empCode: 'EMP0002', ltCode: 'SL', start: '2026-09-02', end: '2026-09-02', units: 1, reason: 'Viral Fever & Medical Rest', status: 'APPROVED' as const },
    { empCode: 'EMP0003', ltCode: 'CL', start: '2026-09-18', end: '2026-09-19', units: 2, reason: 'Personal Family Event', status: 'PENDING' as const },
    { empCode: 'EMP0004', ltCode: 'PL', start: '2026-09-25', end: '2026-09-26', units: 2, reason: 'Conference & Workshop', status: 'APPROVED' as const },
    { empCode: 'EMP0005', ltCode: 'PL', start: '2026-09-28', end: '2026-09-29', units: 2, reason: 'Out of town wedding', status: 'PENDING' as const },
  ];

  for (const lr of sampleLeaves) {
    const emp = employees[lr.empCode];
    const lt = leaveTypes[lr.ltCode];
    if (emp && lt) {
      const existing = await prisma.leave_requests.findFirst({
        where: { employee_id: emp.id, start_date: new Date(lr.start) },
      });
      if (!existing) {
        await prisma.leave_requests.create({
          data: {
            employee_id: emp.id,
            leave_type_id: lt.id,
            start_date: new Date(lr.start),
            end_date: new Date(lr.end),
            requested_units: lr.units,
            reason: lr.reason,
            status: lr.status,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${sampleLeaves.length} leave requests.`);

  // 10. Seed Attendance Records (Today & Recent Days)
  console.log('🕒 Seeding Real-time Attendance Logs...');
  const todayStr = '2026-09-05';
  for (const empCode of Object.keys(employees)) {
    const emp = employees[empCode];
    if (emp) {
      const existing = await prisma.attendance.findUnique({
        where: { employee_id_attendance_date: { employee_id: emp.id, attendance_date: new Date(todayStr) } },
      });

      if (!existing) {
        await prisma.attendance.create({
          data: {
            employee_id: emp.id,
            attendance_date: new Date(todayStr),
            check_in: new Date(`${todayStr}T09:05:00Z`),
            check_out: new Date(`${todayStr}T18:10:00Z`),
            worked_hours: 8.5,
            overtime_hours: 0.5,
            status: 'PRESENT',
          },
        });
      }
    }
  }
  console.log('✓ Seeded daily attendance punches for all staff.\n');

  console.log('🎉 COMPLETE DATABASE SEEDING FINISHED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log('Login credentials:');
  console.log('Admin Email: admin@peoplepay360.com');
  console.log('User Email:  rahul.sharma@peoplepay360.com');
  console.log('Password:    Password123!');
  console.log('----------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seed script execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
