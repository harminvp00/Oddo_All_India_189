import prisma from '../../config/database';
import { ContractRepository } from './repository';
import {
  CreateContractInput,
  UpdateContractInput,
  ContractFilterInput,
} from './validation';
import { AuthenticatedUser } from '../../middleware/auth';
import { Prisma } from '../../generated/prisma/client';

function formatDateString(date?: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

function formatContract(contract: any) {
  if (!contract) return null;

  return {
    id: contract.id.toString(),
    employeeId: contract.employee_id.toString(),
    employee: contract.employees
      ? {
          id: contract.employees.id.toString(),
          employeeCode: contract.employees.employee_code,
          fullName: `${contract.employees.first_name} ${contract.employees.last_name}`.trim(),
        }
      : null,
    contractNumber: contract.contract_number,
    startDate: formatDateString(contract.start_date),
    endDate: formatDateString(contract.end_date),
    status: contract.status,
    wage: Number(contract.wage),
    currencyCode: contract.currency_code,
    salaryStructureId: contract.salary_structure_id.toString(),
    salaryStructure: contract.salary_structures
      ? {
          id: contract.salary_structures.id.toString(),
          name: contract.salary_structures.name,
        }
      : null,
    departmentId: contract.department_id ? contract.department_id.toString() : null,
    department: contract.departments
      ? {
          id: contract.departments.id.toString(),
          name: contract.departments.name,
          code: contract.departments.code,
        }
      : null,
    positionId: contract.position_id ? contract.position_id.toString() : null,
    position: contract.job_positions
      ? {
          id: contract.job_positions.id.toString(),
          title: contract.job_positions.title,
        }
      : null,
    scheduleId: contract.schedule_id ? contract.schedule_id.toString() : null,
    workingSchedule: contract.working_schedules
      ? {
          id: contract.working_schedules.id.toString(),
          name: contract.working_schedules.name,
          weeklyHours: Number(contract.working_schedules.weekly_hours),
        }
      : null,
    payslipCount: contract._count?.payslips ?? 0,
    createdAt: contract.created_at,
    updatedAt: contract.updated_at,
  };
}

export function checkDateOverlap(
  newStart: Date,
  newEnd: Date | null | undefined,
  existingContracts: { id: bigint; start_date: Date; end_date: Date | null; contract_number: string }[]
): { hasOverlap: boolean; conflictingContract?: string } {
  for (const existing of existingContracts) {
    const existingStart = existing.start_date;
    const existingEnd = existing.end_date;

    // Overlap condition:
    // newStart <= (existingEnd || Infinity) AND (newEnd || Infinity) >= existingStart
    const startCondition = existingEnd === null || newStart <= existingEnd;
    const endCondition = newEnd === null || newEnd === undefined || newEnd >= existingStart;

    if (startCondition && endCondition) {
      return { hasOverlap: true, conflictingContract: existing.contract_number };
    }
  }
  return { hasOverlap: false };
}

export class ContractService {
  static async listSalaryStructures() {
    let structures = await prisma.salary_structures.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });

    if (structures.length === 0) {
      await prisma.salary_structures.createMany({
        data: [
          { name: 'Standard Full-Time CTC Structure', description: 'Base + HRA + Allowances + PF + ESI' },
          { name: 'Executive Salary Structure', description: 'Executive CTC with Performance Bonus' },
          { name: 'Contract / Consultant Structure', description: 'Fixed Monthly Professional Fee' },
        ],
      });
      structures = await prisma.salary_structures.findMany({
        where: { is_active: true },
        orderBy: { name: 'asc' },
      });
    }

    return structures.map((s) => ({
      id: s.id.toString(),
      name: s.name,
      description: s.description,
      isActive: s.is_active,
    }));
  }

  static async listContracts(filters: ContractFilterInput, user?: AuthenticatedUser) {
    const { page = 1, limit = 20, employeeId, status, search } = filters;

    let targetEmployeeId: bigint | undefined;

    // RBAC Self-Service Restriction for EMPLOYEE role
    if (user && user.role === 'EMPLOYEE') {
      if (!user.employeeId) {
        return {
          items: [],
          meta: { page: 1, limit, total: 0, totalPages: 0 },
        };
      }
      targetEmployeeId = BigInt(user.employeeId);
    } else if (employeeId) {
      targetEmployeeId = BigInt(employeeId);
    }

    const { total, items } = await ContractRepository.findMany({
      employeeId: targetEmployeeId,
      status,
      search,
      page,
      limit,
    });

    return {
      items: items.map(formatContract),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getContractById(id: bigint, user?: AuthenticatedUser) {
    const contract = await ContractRepository.findById(id);
    if (!contract) {
      return null;
    }

    // RBAC Self-Service Restriction for EMPLOYEE role
    if (user && user.role === 'EMPLOYEE') {
      if (!user.employeeId || user.employeeId !== contract.employee_id.toString()) {
        const error = new Error('You do not have permission to access another employee contract');
        (error as any).code = 'FORBIDDEN';
        throw error;
      }
    }

    return formatContract(contract);
  }

  static async validateForeignKeys(data: {
    employeeId?: string;
    salaryStructureId?: string;
    departmentId?: string | null;
    positionId?: string | null;
    scheduleId?: string | null;
  }) {
    if (data.employeeId) {
      const emp = await prisma.employees.findUnique({ where: { id: BigInt(data.employeeId) } });
      if (!emp) {
        const error = new Error(`Employee with ID ${data.employeeId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.salaryStructureId) {
      const struct = await prisma.salary_structures.findUnique({
        where: { id: BigInt(data.salaryStructureId) },
      });
      if (!struct) {
        const error = new Error(`Salary Structure with ID ${data.salaryStructureId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.departmentId) {
      const dept = await prisma.departments.findUnique({ where: { id: BigInt(data.departmentId) } });
      if (!dept) {
        const error = new Error(`Department with ID ${data.departmentId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.positionId) {
      const pos = await prisma.job_positions.findUnique({ where: { id: BigInt(data.positionId) } });
      if (!pos) {
        const error = new Error(`Job Position with ID ${data.positionId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.scheduleId) {
      const sched = await prisma.working_schedules.findUnique({
        where: { id: BigInt(data.scheduleId) },
      });
      if (!sched) {
        const error = new Error(`Working Schedule with ID ${data.scheduleId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }
  }

  static async createContract(input: CreateContractInput) {
    // 1. Contract number uniqueness check
    const existingNumber = await ContractRepository.findByContractNumber(input.contractNumber);
    if (existingNumber) {
      const error = new Error(`Contract with number ${input.contractNumber} already exists`);
      (error as any).code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    // 2. Validate foreign keys
    await this.validateForeignKeys({
      employeeId: input.employeeId,
      salaryStructureId: input.salaryStructureId,
      departmentId: input.departmentId,
      positionId: input.positionId,
      scheduleId: input.scheduleId,
    });

    const empId = BigInt(input.employeeId);

    // 3. Overlap check if status is ACTIVE
    if (input.status === 'ACTIVE') {
      const activeContracts = await ContractRepository.findActiveContractsByEmployee(empId);
      const overlap = checkDateOverlap(input.startDate, input.endDate, activeContracts);
      if (overlap.hasOverlap) {
        const error = new Error(
          `Contract dates overlap with an existing ACTIVE contract (${overlap.conflictingContract}) for this employee.`
        );
        (error as any).code = 'CONTRACT_OVERLAP';
        throw error;
      }
    }

    const created = await ContractRepository.create({
      employee_id: empId,
      contract_number: input.contractNumber,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      wage: new Prisma.Decimal(input.wage),
      currency_code: input.currencyCode ?? 'INR',
      salary_structure_id: BigInt(input.salaryStructureId),
      department_id: input.departmentId ? BigInt(input.departmentId) : null,
      position_id: input.positionId ? BigInt(input.positionId) : null,
      schedule_id: input.scheduleId ? BigInt(input.scheduleId) : null,
      status: input.status ?? 'DRAFT',
    });

    return formatContract(created);
  }

  static async updateContract(id: bigint, input: UpdateContractInput) {
    const existing = await ContractRepository.findById(id);
    if (!existing) {
      const error = new Error('Contract not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    // 1. Unique number check
    if (input.contractNumber) {
      const conflict = await ContractRepository.findByContractNumber(input.contractNumber, id);
      if (conflict) {
        const error = new Error(`Another contract with number ${input.contractNumber} already exists`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    // 2. Validate foreign keys
    await this.validateForeignKeys({
      salaryStructureId: input.salaryStructureId,
      departmentId: input.departmentId,
      positionId: input.positionId,
      scheduleId: input.scheduleId,
    });

    const targetStatus = input.status ?? existing.status;
    const targetStart = input.startDate ?? existing.start_date;
    const targetEnd = input.endDate !== undefined ? input.endDate : existing.end_date;

    // 3. Check overlap if updating to ACTIVE or updating dates on an ACTIVE contract
    if (targetStatus === 'ACTIVE') {
      const otherActiveContracts = await ContractRepository.findActiveContractsByEmployee(
        existing.employee_id,
        id
      );
      const overlap = checkDateOverlap(targetStart, targetEnd, otherActiveContracts);
      if (overlap.hasOverlap) {
        const error = new Error(
          `Contract dates overlap with an existing ACTIVE contract (${overlap.conflictingContract}) for this employee.`
        );
        (error as any).code = 'CONTRACT_OVERLAP';
        throw error;
      }
    }

    const updateData: any = {};
    if (input.contractNumber !== undefined) updateData.contract_number = input.contractNumber;
    if (input.startDate !== undefined) updateData.start_date = input.startDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;
    if (input.wage !== undefined) updateData.wage = new Prisma.Decimal(input.wage);
    if (input.currencyCode !== undefined) updateData.currency_code = input.currencyCode;
    if (input.salaryStructureId !== undefined) updateData.salary_structure_id = BigInt(input.salaryStructureId);
    if (input.departmentId !== undefined) updateData.department_id = input.departmentId ? BigInt(input.departmentId) : null;
    if (input.positionId !== undefined) updateData.position_id = input.positionId ? BigInt(input.positionId) : null;
    if (input.scheduleId !== undefined) updateData.schedule_id = input.scheduleId ? BigInt(input.scheduleId) : null;
    if (input.status !== undefined) updateData.status = input.status;

    const updated = await ContractRepository.update(id, updateData);
    return formatContract(updated);
  }

  static async deleteContract(id: bigint) {
    const existing = await ContractRepository.findById(id);
    if (!existing) {
      const error = new Error('Contract not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasPayslips = existing._count.payslips > 0;

    if (hasPayslips) {
      const terminated = await ContractRepository.update(id, {
        status: 'TERMINATED',
      });

      return {
        id: terminated.id.toString(),
        contractNumber: terminated.contract_number,
        status: 'TERMINATED',
        action: 'DEACTIVATED',
        message: 'Contract has associated historical payslips and was terminated instead of deleted.',
      };
    }

    await ContractRepository.delete(id);

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Contract deleted successfully.',
    };
  }

  /**
   * Reusable helper for Payroll and Attendance modules to find the active contract in force for a period.
   */
  static async findApplicableContract(employeeId: bigint, periodStart: Date, periodEnd: Date) {
    const contract = await ContractRepository.findApplicableContract(employeeId, periodStart, periodEnd);
    return contract;
  }
}
