import { PayrollDashboardQuery } from "./validation";

export class DashboardError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const n = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "object" && value && typeof (value as any).toNumber === "function") {
    const numberValue = Number((value as any).toNumber());
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};
const round = (value: number) => Number(value.toFixed(2));
const toDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export function serialize(value: any): any {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toNumber === "function") return value.toNumber();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function periodBounds(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end };
}

function previousMonth(period: string, offset: number) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 - offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthStart(month: string) {
  return toDate(`${month}-01`);
}

function monthEnd(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0));
}

export class DashboardService {
  constructor(private db: any) {
    if (!db) throw new Error("DashboardService requires the project's Prisma client");
  }

  async getPayrollDashboard(query: PayrollDashboardQuery) {
    const period = query.period ?? currentPeriod();
    const { start, end } = periodBounds(period);
    const departmentId = query.departmentId ? BigInt(query.departmentId) : undefined;

    const employeeFilter: any = {
      ...(departmentId !== undefined ? { departmentId } : {}),
      ...(query.employeeType ? { employeeType: query.employeeType } : {}),
    };

    const payslipEmployeeFilter = {
      employee: employeeFilter,
    };

    // The dashboard is based on database values only. No KPI is hard-coded.
    const [periodPayslips, paidPayslips, approvedLeave, attendance, activeEmployees, expiringContracts, trendPayslips] =
      await Promise.all([
        this.db.payslip.findMany({
          where: {
            periodStart: { lte: end },
            periodEnd: { gte: start },
            ...payslipEmployeeFilter,
          },
          select: { id: true, netAmount: true, employeeId: true },
        }),
        this.db.payslip.findMany({
          where: {
            status: "PAID",
            periodStart: { lte: end },
            periodEnd: { gte: start },
            ...payslipEmployeeFilter,
          },
          select: {
            id: true,
            netAmount: true,
            employeeId: true,
            employee: { select: { departmentId: true, department: { select: { name: true } } } },
          },
        }),
        this.db.leaveRequest.findMany({
          where: {
            status: "APPROVED",
            startDate: { lte: end },
            endDate: { gte: start },
            employee: employeeFilter,
          },
          select: { requestedUnits: true },
        }),
        this.db.attendance.findMany({
          where: {
            attendanceDate: { gte: start, lte: end },
            employee: employeeFilter,
          },
          select: { workedHours: true },
        }),
        this.db.employee.findMany({
          where: { employmentStatus: { in: ["ACTIVE", "ON_LEAVE"] }, ...employeeFilter },
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            employmentStatus: true,
            bankAccountNumber: true,
            departmentId: true,
            department: { select: { name: true } },
          },
        }),
        this.db.contract.findMany({
          where: {
            status: "ACTIVE",
            startDate: { lte: end },
            endDate: { gte: start, lte: new Date(end.getTime() + 15 * 86400000) },
            employee: employeeFilter,
          },
          select: { id: true, employeeId: true, endDate: true },
        }),
        this.db.payslip.findMany({
          where: {
            status: "PAID",
            periodStart: { gte: monthStart(previousMonth(period, 4)), lte: end },
            ...payslipEmployeeFilter,
          },
          select: { periodStart: true, netAmount: true, id: true },
        }),
      ]);

    const totalNetSalaryPaid = round(paidPayslips.reduce((sum: number, row: any) => sum + n(row.netAmount), 0));
    const payslipsGenerated = periodPayslips.length;
    const averageSalary = payslipsGenerated === 0 ? 0 : round(totalNetSalaryPaid / payslipsGenerated);
    const approvedTimeOffDays = round(approvedLeave.reduce((sum: number, row: any) => sum + n(row.requestedUnits), 0));

    // The source contract defines attendance health as fulfilled expected working hours,
    // but does not prescribe a separate denominator field. Attendance rows in the demo use
    // an 8-hour standard day, so the dashboard uses 8 expected hours per attendance row.
    const expectedHours = attendance.length * 8;
    const workedHours = attendance.reduce((sum: number, row: any) => sum + n(row.workedHours), 0);
    const attendanceHealthPercentage = expectedHours === 0
      ? 0
      : round(Math.min(100, Math.max(0, (workedHours / expectedHours) * 100)));

    const salaryByDepartment = new Map<string, { departmentId: string; departmentName: string; totalSalary: number; employeeIds: Set<string> }>();
    for (const row of paidPayslips) {
      const departmentIdValue = row.employee?.departmentId == null ? "unassigned" : String(row.employee.departmentId);
      const departmentName = row.employee?.department?.name ?? "Unassigned";
      const current = salaryByDepartment.get(departmentIdValue) ?? {
        departmentId: departmentIdValue,
        departmentName,
        totalSalary: 0,
        employeeIds: new Set<string>(),
      };
      current.totalSalary += n(row.netAmount);
      current.employeeIds.add(String(row.employeeId));
      salaryByDepartment.set(departmentIdValue, current);
    }

    const salaryCostByDepartment = [...salaryByDepartment.values()]
      .sort((a, b) => b.totalSalary - a.totalSalary)
      .map(row => ({
        departmentId: row.departmentId,
        departmentName: row.departmentName,
        totalSalary: round(row.totalSalary),
        employeeCount: row.employeeIds.size,
      }));

    const monthlyNetSalaryTrend = Array.from({ length: 5 }, (_, index) => previousMonth(period, 4 - index))
      .map(month => {
        const rows = trendPayslips.filter((row: any) => {
          const value = row.periodStart instanceof Date ? row.periodStart : new Date(row.periodStart);
          return value.getUTCFullYear() === Number(month.slice(0, 4)) && value.getUTCMonth() + 1 === Number(month.slice(5, 7));
        });
        return {
          month,
          netSalary: round(rows.reduce((sum: number, row: any) => sum + n(row.netAmount), 0)),
          payslipCount: rows.length,
        };
      });

    const missingBank = activeEmployees.filter((employee: any) => employee.employmentStatus === "ACTIVE" && !employee.bankAccountNumber);
    const payrollWarnings: any[] = [];
    if (missingBank.length) {
      payrollWarnings.push({
        id: "missing-bank-account",
        severity: "HIGH",
        message: `${missingBank.length} active employees missing bank account details`,
        employeeIds: missingBank.map((employee: any) => String(employee.id)),
      });
    }
    if (expiringContracts.length) {
      payrollWarnings.push({
        id: "expiring-contracts",
        severity: "MEDIUM",
        message: `${expiringContracts.length} contract${expiringContracts.length === 1 ? "" : "s"} expiring within 15 days`,
        contractId: String(expiringContracts[0].id),
      });
    }

    const departmentIds = [...new Set(activeEmployees.map((employee: any) => employee.departmentId).filter((id: any) => id != null).map(String))];
    const departmentHeadcount = departmentIds.map(id => {
      const employees = activeEmployees.filter((employee: any) => String(employee.departmentId) === id);
      return {
        department: employees[0]?.department?.name ?? "Unassigned",
        activeCount: employees.filter((employee: any) => employee.employmentStatus === "ACTIVE").length,
        onLeaveCount: employees.filter((employee: any) => employee.employmentStatus === "ON_LEAVE").length,
      };
    });

    if (activeEmployees.some((employee: any) => employee.departmentId == null)) {
      const unassigned = activeEmployees.filter((employee: any) => employee.departmentId == null);
      departmentHeadcount.push({
        department: "Unassigned",
        activeCount: unassigned.filter((employee: any) => employee.employmentStatus === "ACTIVE").length,
        onLeaveCount: unassigned.filter((employee: any) => employee.employmentStatus === "ON_LEAVE").length,
      });
    }

    return serialize({
      kpis: {
        totalNetSalaryPaid,
        payslipsGenerated,
        averageSalary,
        approvedTimeOffDays,
        attendanceHealthPercentage,
      },
      salaryCostByDepartment,
      monthlyNetSalaryTrend,
      payrollWarnings,
      departmentHeadcount,
    });
  }
}
