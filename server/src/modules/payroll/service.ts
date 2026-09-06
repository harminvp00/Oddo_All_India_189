import {
  SalaryRuleCreateInput,
  SalaryRuleUpdateInput,
  SalaryStructureCreateInput,
  SalaryStructureUpdateInput,
  PayrunCreateInput,
} from "./validation";



export class PayrollError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "PayrollError";
  }
}

const n = (value: unknown) =>
  Number(value ?? 0);

const d = (value: string) =>
  new Date(`${value}T00:00:00.000Z`);

const round = (value: number) =>
  Number(value.toFixed(2));

export function serialize(value: any): any {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, item]) => [
          key,
          serialize(item),
        ],
      ),
    );
  }

  return value;
}

function formula(
  expression: string,
  vars: Record<string, number>,
): number {
  const tokens =
    expression.match(
      /[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]/g,
    ) ?? [];

  let index = 0;

  const peek = () => tokens[index];

  const take = () => tokens[index++];

  const factor = (): number => {
    const token = take();

    if (token === "(") {
      const value = expressionPart();

      if (take() !== ")") {
        throw new Error("Invalid formula");
      }

      return value;
    }

    if (token === "+") {
      return factor();
    }

    if (token === "-") {
      return -factor();
    }

    if (!token) {
      throw new Error("Invalid formula");
    }

    if (/^\d/.test(token)) {
      return Number(token);
    }

    const key = token.toUpperCase();

    if (!(key in vars)) {
      throw new Error(
        `Unknown payroll variable: ${token}`,
      );
    }

    return vars[key];
  };

  const term = (): number => {
    let value = factor();

    while (
      peek() === "*" ||
      peek() === "/"
    ) {
      const operator = take();
      const right = factor();

      if (
        operator === "/" &&
        right === 0
      ) {
        throw new Error(
          "Division by zero",
        );
      }

      value =
        operator === "*"
          ? value * right
          : value / right;
    }

    return value;
  };

  const expressionPart = (): number => {
    let value = term();

    while (
      peek() === "+" ||
      peek() === "-"
    ) {
      const operator = take();
      const right = term();

      value =
        operator === "+"
          ? value + right
          : value - right;
    }

    return value;
  };

  if (!tokens.length) {
    throw new Error(
      "Formula cannot be empty",
    );
  }

  const result = expressionPart();

  if (
    index !== tokens.length ||
    !Number.isFinite(result)
  ) {
    throw new Error(
      "Invalid formula",
    );
  }

  return Number(result.toFixed(2));
}

export class PayrollService {
  constructor(private db: any) {}

  private get rulesDelegate() {
    return this.db.salary_rules ?? this.db.salaryRule;
  }

  private get structuresDelegate() {
    return this.db.salary_structures ?? this.db.salaryStructure;
  }

  private get structureRulesDelegate() {
    return this.db.salary_structure_rules ?? this.db.salaryStructureRule;
  }

  async listSalaryRules(query: { search?: string; category?: string; isActive?: boolean }) {
    const rows = await this.rulesDelegate.findMany({
      where: {
        ...(query.search ? { OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { code: { contains: query.search, mode: "insensitive" } },
        ] } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.isActive === undefined ? {} : { is_active: query.isActive }),
      },
      orderBy: { id: "asc" },
    });
    return serialize(rows);
  }

  async getSalaryRule(id: bigint) {
    const row = await this.rulesDelegate.findUnique({ where: { id } });
    if (!row) throw new PayrollError("NOT_FOUND", "Salary rule not found", 404);
    return serialize(row);
  }

  async createSalaryRule(input: SalaryRuleCreateInput) {
    try {
      return serialize(await this.rulesDelegate.create({
        data: {
          name: input.name,
          code: input.code.toUpperCase(),
          category: input.category,
          method: input.method,
          fixed_amount: input.method === "FIXED" ? input.fixedAmount : null,
          percentage: input.method === "PERCENTAGE" ? input.percentage : null,
          formula: input.method === "FORMULA" ? input.formula : null,
          is_active: input.isActive ?? true,
        },
      }));
    } catch (e: any) {
      if (e?.code === "P2002") throw new PayrollError("DUPLICATE_SALARY_RULE", "Salary rule code already exists", 409);
      throw e;
    }
  }

  async updateSalaryRule(id: bigint, input: SalaryRuleUpdateInput) {
    await this.getSalaryRule(id);
    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.code !== undefined) data.code = input.code.toUpperCase();
    if (input.category !== undefined) data.category = input.category;
    if (input.method !== undefined) data.method = input.method;
    if ((input as any).fixedAmount !== undefined || (input as any).fixed_amount !== undefined) {
      data.fixed_amount = (input as any).fixedAmount ?? (input as any).fixed_amount;
    }
    if (input.percentage !== undefined) data.percentage = input.percentage;
    if (input.formula !== undefined) data.formula = input.formula;
    if ((input as any).isActive !== undefined || (input as any).is_active !== undefined) {
      data.is_active = (input as any).isActive ?? (input as any).is_active;
    }
    if (input.method === "FIXED") { data.percentage = null; data.formula = null; }
    if (input.method === "PERCENTAGE") { data.fixed_amount = null; data.formula = null; }
    if (input.method === "FORMULA") { data.fixed_amount = null; data.percentage = null; }
    return serialize(await this.rulesDelegate.update({ where: { id }, data }));
  }

  async deleteSalaryRule(id: bigint) {
    try { return serialize(await this.rulesDelegate.delete({ where: { id } })); }
    catch (e: any) {
      if (e?.code === "P2003") throw new PayrollError("SALARY_RULE_IN_USE", "Salary rule is in use", 409);
      throw e;
    }
  }

  async listSalaryStructures() {
    const rows = await this.db.salaryStructure.findMany({
      orderBy: { name: "asc" },
      include: { rules: { orderBy: { executionOrder: "asc" }, include: { rule: true } } },
    });
    return serialize(rows);
  }

  async getSalaryStructure(id: bigint) {
    const row = await this.db.salaryStructure.findUnique({
      where: { id },
      include: { rules: { orderBy: { executionOrder: "asc" }, include: { rule: true } } },
    });
    if (!row) throw new PayrollError("NOT_FOUND", "Salary structure not found", 404);
    return serialize(row);
  }

  async createSalaryStructure(input: SalaryStructureCreateInput) {
    try {
      return serialize(await this.db.$transaction(async (tx: any) => {
        const structure = await tx.salaryStructure.create({
          data: { name: input.name, description: input.description ?? null, isActive: input.isActive },
        });
        await tx.salaryStructureRule.createMany({
          data: input.rules.map(r => ({ structureId: structure.id, ruleId: r.ruleId, executionOrder: r.executionOrder })),
        });
        return structure;
      }));
    } catch (e: any) {
      if (e?.code === "P2002") throw new PayrollError("SALARY_STRUCTURE_CONFLICT", "Duplicate structure name or rule order", 409);
      throw e;
    }
  }

  async updateSalaryStructure(id: bigint, input: SalaryStructureUpdateInput) {
    await this.getSalaryStructure(id);
    return serialize(await this.db.$transaction(async (tx: any) => {
      const structure = await tx.salaryStructure.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
      if (input.rules) {
        await tx.salaryStructureRule.deleteMany({ where: { structureId: id } });
        await tx.salaryStructureRule.createMany({
          data: input.rules.map(r => ({ structureId: id, ruleId: r.ruleId, executionOrder: r.executionOrder })),
        });
      }
      return structure;
    }));
  }

  async deleteSalaryStructure(id: bigint) {
    try { return serialize(await this.db.salaryStructure.delete({ where: { id } })); }
    catch (e: any) {
      if (e?.code === "P2003") throw new PayrollError("SALARY_STRUCTURE_IN_USE", "Salary structure is in use", 409);
      throw e;
    }
  }

  async eligibleEmployees(input: { salaryStructureId: bigint; periodStart: string; periodEnd: string }) {
    const contracts = await this.db.contract.findMany({
      where: {
        status: "ACTIVE", salaryStructureId: input.salaryStructureId,
        startDate: { lte: d(input.periodStart) },
        OR: [{ endDate: null }, { endDate: { gte: d(input.periodEnd) } }],
      },
      include: { employee: { include: { department: true } } },
      orderBy: { employeeId: "asc" },
    });

    return serialize(await Promise.all(contracts.map(async (c: any) => {
      const duplicate = await this.db.payslip.findFirst({
        where: { employeeId: c.employeeId, periodStart: d(input.periodStart), periodEnd: d(input.periodEnd) },
      });
      const e = c.employee;
      return {
        employeeId: e.id, employeeCode: e.employeeCode,
        fullName: `${e.firstName} ${e.lastName}`,
        department: e.department?.name ?? null,
        contractNumber: c.contractNumber, wage: c.wage,
        hasBankDetails: !!e.bankAccountNumber,
        hasDuplicatePayslip: !!duplicate,
        eligible: !duplicate,
      };
    })));
  }

  async createPayrun(input: PayrunCreateInput, createdBy: bigint) {
    const structure = await this.db.salaryStructure.findUnique({ where: { id: input.salaryStructureId } });
    if (!structure?.isActive) throw new PayrollError("SALARY_STRUCTURE_NOT_FOUND", "Active salary structure not found", 404);

    const employees = await this.db.employee.findMany({
      where: { id: { in: input.employeeIds }, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    if (employees.length !== input.employeeIds.length)
      throw new PayrollError("INVALID_EMPLOYEE_SELECTION", "All selected employees must be active", 422);

    return serialize(await this.db.$transaction(async (tx: any) => {
      const payrun = await tx.payrun.create({
        data: {
          runName: input.runName, salaryStructureId: input.salaryStructureId,
          periodStart: d(input.periodStart), periodEnd: d(input.periodEnd),
          status: "DRAFT", createdBy,
        },
      });
      await tx.payrunEmployee.createMany({
        data: input.employeeIds.map(employeeId => ({ payrunId: payrun.id, employeeId })),
      });
      return payrun;
    }));
  }

  async computePayrun(id: bigint) {
    return serialize(await this.db.$transaction(async (tx: any) => {
      const payrun = await tx.payrun.findUnique({
        where: { id }, include: { payrunEmployees: true },
      });
      if (!payrun) throw new PayrollError("NOT_FOUND", "Payrun not found", 404);
      if (["VALIDATED", "PAID", "CANCELLED"].includes(payrun.status))
        throw new PayrollError("INVALID_PAYRUN_STATE", "Payrun cannot be recomputed", 400);

      const links = await tx.salaryStructureRule.findMany({
        where: { structureId: payrun.salaryStructureId },
        orderBy: { executionOrder: "asc" },
        include: { rule: true },
      });
      if (!links.length) throw new PayrollError("EMPTY_SALARY_STRUCTURE", "Salary structure has no rules", 422);

      let totalGross = 0, totalDeductions = 0, totalNet = 0;
      const warnings: any[] = [];

      for (const pe of payrun.payrunEmployees) {
        const employee = await tx.employee.findUnique({ where: { id: pe.employeeId } });
        if (!employee) continue;

        const contract = await tx.contract.findFirst({
          where: {
            employeeId: employee.id, status: "ACTIVE",
            salaryStructureId: payrun.salaryStructureId,
            startDate: { lte: payrun.periodStart },
            OR: [{ endDate: null }, { endDate: { gte: payrun.periodEnd } }],
          },
          orderBy: { startDate: "desc" },
        });
        if (!contract)
          throw new PayrollError("MISSING_CONTRACT", `No applicable contract for employee ${employee.id}`, 422);

        const vars: Record<string, number> = { WAGE: n(contract.wage), BASIC: 0, ALLOWANCES: 0, GROSS: 0, DEDUCTIONS: 0 };
        const lines: any[] = [];

        for (const link of links) {
          const r = link.rule;
          if (!r?.isActive) throw new PayrollError("INVALID_SALARY_RULE", `Rule ${link.ruleId} is inactive`, 422);

          let amount = 0;
          if (r.method === "FIXED") amount = n(r.fixedAmount);
          else if (r.method === "PERCENTAGE") amount = vars.WAGE * n(r.percentage) / 100;
          else amount = formula(r.formula, vars);
          amount = round(amount);

          lines.push({
            salaryRuleId: r.id, sequenceNo: link.executionOrder,
            code: r.code, name: r.name, category: r.category,
            rate: r.method === "PERCENTAGE" ? n(r.percentage) : null, amount,
          });

          if (r.category === "BASIC") vars.BASIC = round(vars.BASIC + amount);
          if (r.category === "ALLOWANCE") vars.ALLOWANCES = round(vars.ALLOWANCES + amount);
          if (r.category === "DEDUCTION") vars.DEDUCTIONS = round(vars.DEDUCTIONS + amount);
          vars[r.code.toUpperCase()] = amount;
          if (r.category === "GROSS") vars.GROSS = amount;
        }

        const gross = vars.GROSS || round(vars.BASIC + vars.ALLOWANCES);
        const deductions = round(vars.DEDUCTIONS);
        const net = round(Math.max(0, gross - deductions));

        const duplicate = await tx.payslip.findFirst({
          where: { employeeId: employee.id, periodStart: payrun.periodStart, periodEnd: payrun.periodEnd },
        });
        if (duplicate) throw new PayrollError("DUPLICATE_PAYSLIP", `Payslip already exists for employee ${employee.id}`, 409);

        const payslip = await tx.payslip.create({
          data: {
            payrunId: id, employeeId: employee.id, contractId: contract.id,
            salaryStructureId: payrun.salaryStructureId,
            periodStart: payrun.periodStart, periodEnd: payrun.periodEnd,
            grossAmount: gross, totalDeductions: deductions, netAmount: net,
            status: "COMPUTED",
          },
        });
        await tx.payslipLine.createMany({
          data: lines.map(l => ({
            payslipId: payslip.id, sequenceNo: l.sequenceNo,
            ruleCode: l.code, ruleName: l.name, category: l.category,
            quantity: 1, rate: l.rate, amount: l.amount,
          })),
        });

        totalGross += gross; totalDeductions += deductions; totalNet += net;
        if (!employee.bankAccountNumber)
          warnings.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            warningType: "MISSING_BANK_ACCOUNT",
            message: `Employee ${employee.firstName} ${employee.lastName} has no bank account configured.`,
          });
      }

      await tx.payrun.update({ where: { id }, data: { status: "COMPUTED", computedAt: new Date() } });
      return {
        payrunId: id, status: "COMPUTED",
        totalEmployees: payrun.payrunEmployees.length,
        totalGross: round(totalGross), totalDeductions: round(totalDeductions),
        totalNet: round(totalNet), warnings,
      };
    }));
  }

  async validatePayrun(id: bigint) {
    return serialize(await this.db.$transaction(async (tx: any) => {
      const p = await tx.payrun.findUnique({ where: { id } });
      if (!p) throw new PayrollError("NOT_FOUND", "Payrun not found", 404);
      if (p.status !== "COMPUTED") throw new PayrollError("INVALID_PAYRUN_STATE", "Only COMPUTED payruns can be validated", 400);
      await tx.payslip.updateMany({ where: { payrunId: id, status: "COMPUTED" }, data: { status: "VALIDATED" } });
      return tx.payrun.update({ where: { id }, data: { status: "VALIDATED", validatedAt: new Date() } });
    }));
  }

  async payPayrun(id: bigint) {
    return serialize(await this.db.$transaction(async (tx: any) => {
      const p = await tx.payrun.findUnique({ where: { id } });
      if (!p) throw new PayrollError("NOT_FOUND", "Payrun not found", 404);
      if (p.status !== "VALIDATED") throw new PayrollError("INVALID_PAYRUN_STATE", "Only VALIDATED payruns can be paid", 400);
      await tx.payslip.updateMany({ where: { payrunId: id, status: "VALIDATED" }, data: { status: "PAID" } });
      return tx.payrun.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
    }));
  }
}
