import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { AppError } from '../auth/service';
import { user_role, user_status } from '../../generated/prisma/client';

export async function listUsers(query: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { full_name: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.role) {
    where.role = query.role as user_role;
  }

  if (query.status) {
    where.status = query.status as user_status;
  }

  const [total, users] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        created_at: true,
        last_login_at: true,
        employees: {
          select: {
            id: true,
            employee_code: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  const formattedUsers = users.map((u) => ({
    id: u.id.toString(),
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    status: u.status,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
    employeeId: u.employees ? u.employees.id.toString() : null,
    employeeCode: u.employees ? u.employees.employee_code : null,
  }));

  return {
    users: formattedUsers,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getUserById(id: string) {
  const bigintId = BigInt(id);
  const user = await prisma.users.findUnique({
    where: { id: bigintId },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      status: true,
      created_at: true,
      last_login_at: true,
      employees: {
        select: {
          id: true,
          employee_code: true,
          department_id: true,
          position_id: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  return {
    id: user.id.toString(),
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    employee: user.employees
      ? {
          id: user.employees.id.toString(),
          employeeCode: user.employees.employee_code,
          departmentId: user.employees.department_id ? user.employees.department_id.toString() : null,
          positionId: user.employees.position_id ? user.employees.position_id.toString() : null,
        }
      : null,
  };
}

export async function createUser(data: {
  email: string;
  fullName: string;
  password: string;
  role: string;
  createdById?: string;
}) {
  const normalizedEmail = data.email.toLowerCase();

  const existingUser = await prisma.users.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('DUPLICATE_EMAIL', 'User with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const createdBy = data.createdById ? BigInt(data.createdById) : null;

  const newUser = await prisma.users.create({
    data: {
      email: normalizedEmail,
      full_name: data.fullName,
      password_hash: passwordHash,
      role: data.role as user_role,
      status: 'ACTIVE',
      created_by: createdBy,
    },
  });

  return {
    id: newUser.id.toString(),
    email: newUser.email,
    fullName: newUser.full_name,
    role: newUser.role,
    status: newUser.status,
    createdAt: newUser.created_at,
  };
}

export async function updateUser(
  id: string,
  data: { fullName?: string; role?: string; password?: string }
) {
  const bigintId = BigInt(id);

  const user = await prisma.users.findUnique({
    where: { id: bigintId },
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const updateData: any = {
    updated_at: new Date(),
  };

  if (data.fullName) {
    updateData.full_name = data.fullName;
  }

  if (data.role) {
    updateData.role = data.role as user_role;
  }

  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await prisma.users.update({
    where: { id: bigintId },
    data: updateData,
  });

  return {
    id: updatedUser.id.toString(),
    email: updatedUser.email,
    fullName: updatedUser.full_name,
    role: updatedUser.role,
    status: updatedUser.status,
    updatedAt: updatedUser.updated_at,
  };
}

export async function toggleUserStatus(id: string, status: string) {
  const bigintId = BigInt(id);

  const user = await prisma.users.findUnique({
    where: { id: bigintId },
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 'User not found', 404);
  }

  const updatedUser = await prisma.users.update({
    where: { id: bigintId },
    data: {
      status: status as user_status,
      updated_at: new Date(),
    },
  });

  return {
    id: updatedUser.id.toString(),
    email: updatedUser.email,
    fullName: updatedUser.full_name,
    role: updatedUser.role,
    status: updatedUser.status,
    updatedAt: updatedUser.updated_at,
  };
}
