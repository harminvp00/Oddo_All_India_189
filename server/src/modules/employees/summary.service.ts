import prisma from '../../config/database';
import { AuthenticatedUser } from '../../middleware/auth';

export class EmployeeSummaryService {
  static async getEmployeeSummary(employeeId: bigint, user?: AuthenticatedUser) {
    // 1. RBAC Self-Service Check for EMPLOYEE role
    if (user && user.role === 'EMPLOYEE') {
      if (!user.employeeId || user.employeeId !== employeeId.toString()) {
        const error = new Error('You do not have permission to access another employee summary');
        (error as any).code = 'FORBIDDEN';
        throw error;
      }
    }

    // 2. Verify Employee Exists
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    });

    if (!employee) {
      const error = new Error('Employee not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const today = new Date();

    // 3. Parallel Query for All Required Metrics
    const [
      activeContract,
      contractCount,
      attendanceCount,
      approvedLeaveRequestsCount,
      allocations,
      payslipsCount,
    ] = await Promise.all([
      // A. Active Contract
      prisma.contracts.findFirst({
        where: {
          employee_id: employeeId,
          status: 'ACTIVE',
        },
        include: {
          salary_structures: {
            select: { name: true },
          },
        },
        orderBy: { start_date: 'desc' },
      }),

      // B. Total Contracts Count
      prisma.contracts.count({
        where: { employee_id: employeeId },
      }),

      // C. Total Attendance Days
      prisma.attendance.count({
        where: { employee_id: employeeId },
      }),

      // D. Approved Leave Requests Count
      prisma.leave_requests.count({
        where: {
          employee_id: employeeId,
          status: 'APPROVED',
        },
      }),

      // E. Leave Allocations for Remaining Days calculation
      prisma.leave_allocations.findMany({
        where: {
          employee_id: employeeId,
          status: 'APPROVED',
          valid_from: { lte: today },
          valid_to: { gte: today },
        },
        select: {
          allocated_units: true,
          used_units: true,
        },
      }),

      // F. Payslips Count
      prisma.payslips.count({
        where: { employee_id: employeeId },
      }),
    ]);

    // 4. Calculate Remaining Leave Days from Active Allocations
    let totalRemainingLeaveDays = 0;
    for (const alloc of allocations) {
      const allocated = Number(alloc.allocated_units);
      const used = Number(alloc.used_units);
      const remaining = allocated - used;
      if (remaining > 0) {
        totalRemainingLeaveDays += remaining;
      }
    }

    return {
      employeeId: employee.id.toString(),
      activeContract: activeContract
        ? {
            id: activeContract.id.toString(),
            contractNumber: activeContract.contract_number,
            wage: Number(activeContract.wage),
            salaryStructureName: activeContract.salary_structures.name,
          }
        : null,
      counts: {
        contracts: contractCount,
        attendanceDays: attendanceCount,
        approvedLeaves: approvedLeaveRequestsCount,
        remainingLeaveDays: Number(totalRemainingLeaveDays.toFixed(1)),
        payslips: payslipsCount,
      },
    };
  }
}
