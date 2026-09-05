import { Request, Response } from "express";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  employeeIdSchema,
} from "./validation";
import { EmployeeService, EmployeeServiceError } from "./service";

const employeeService = new EmployeeService();

export const employeeController = {
  async create(req: Request, res: Response) {
    try {
      const input = createEmployeeSchema.parse(req.body);
      const employee = await employeeService.create(input);

      return res.status(201).json({
        success: true,
        data: serializeEmployee(employee),
        message: "Employee created successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const input = employeeQuerySchema.parse(req.query);
      const result = await employeeService.list(input);

      return res.status(200).json({
        success: true,
        data: result.items.map(serializeEmployee),
        meta: result.meta,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = employeeIdSchema.parse(req.params);
      const employee = await employeeService.getById(BigInt(id));

      return res.status(200).json({
        success: true,
        data: serializeEmployee(employee),
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = employeeIdSchema.parse(req.params);
      const input = updateEmployeeSchema.parse(req.body);
      const employee = await employeeService.update(BigInt(id), input);

      return res.status(200).json({
        success: true,
        data: serializeEmployee(employee),
        message: "Employee updated successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = employeeIdSchema.parse(req.params);
      await employeeService.delete(BigInt(id));

      return res.status(200).json({
        success: true,
        message: "Employee archived successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
};

function serializeEmployee(emp: any) {
  if (!emp) return emp;

  return {
    id: emp.id?.toString(),
    employeeCode: emp.employee_code,
    firstName: emp.first_name,
    lastName: emp.last_name,
    name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
    email: emp.users?.email || null,
    phone: emp.phone || null,
    dateOfBirth: emp.date_of_birth instanceof Date ? emp.date_of_birth.toISOString().split("T")[0] : emp.date_of_birth,
    hireDate: emp.hire_date instanceof Date ? emp.hire_date.toISOString().split("T")[0] : emp.hire_date,
    terminationDate: emp.termination_date instanceof Date ? emp.termination_date.toISOString().split("T")[0] : emp.termination_date,
    employeeType: emp.employee_type,
    employmentStatus: emp.employment_status,
    departmentId: emp.department_id?.toString() || null,
    department: emp.departments
      ? {
          id: emp.departments.id?.toString(),
          name: emp.departments.name,
          code: emp.departments.code,
        }
      : undefined,
    positionId: emp.position_id?.toString() || null,
    position: emp.job_positions
      ? {
          id: emp.job_positions.id?.toString(),
          title: emp.job_positions.title,
        }
      : undefined,
    scheduleId: emp.schedule_id?.toString() || null,
    schedule: emp.working_schedules
      ? {
          id: emp.working_schedules.id?.toString(),
          name: emp.working_schedules.name,
          scheduleType: emp.working_schedules.schedule_type,
          weeklyHours: Number(emp.working_schedules.weekly_hours),
        }
      : undefined,
    managerId: emp.manager_id?.toString() || null,
    manager: emp.employees
      ? {
          id: emp.employees.id?.toString(),
          employeeCode: emp.employees.employee_code,
          name: `${emp.employees.first_name} ${emp.employees.last_name}`,
        }
      : undefined,
    userId: emp.user_id?.toString() || null,
    user: emp.users
      ? {
          id: emp.users.id?.toString(),
          email: emp.users.email,
          role: emp.users.role,
          status: emp.users.status,
        }
      : undefined,
    bankAccountName: emp.bank_account_name || null,
    bankAccountNumber: emp.bank_account_number || null,
    bankName: emp.bank_name || null,
    ifscCode: emp.ifsc_code || null,
    totalAttendance: emp._count?.attendance || 0,
    totalContracts: emp._count?.contracts || 0,
    createdAt: emp.created_at instanceof Date ? emp.created_at.toISOString() : emp.created_at,
    updatedAt: emp.updated_at instanceof Date ? emp.updated_at.toISOString() : emp.updated_at,
  };
}

function handleError(res: Response, error: unknown) {
  if (error instanceof EmployeeServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: [],
      },
    });
  }

  if (error instanceof Error && error.name === "ZodError") {
    const zodError = error as Error & { issues?: Array<{ path: (string | number)[]; message: string }> };

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: (zodError.issues ?? []).map((issue) => ({
          field: issue.path.join("."),
          issue: issue.message,
        })),
      },
    });
  }

  console.error("Employee controller error:", error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: (error as Error)?.message || "An unexpected error occurred",
      details: [],
    },
  });
}
