import { Request, Response } from "express";
import {
  payrunCreateSchema, salaryRuleCreateSchema, salaryRuleUpdateSchema,
  salaryStructureCreateSchema, salaryStructureUpdateSchema,
} from "./validation";
import { PayrollError, PayrollService } from "./service";

const service = new PayrollService();

const ok = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res: Response, error: any) => {
  if (error?.issues) return res.status(422).json({
    success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request", details: error.issues },
  });
  const e = error instanceof PayrollError ? error : new PayrollError("INTERNAL_ERROR", "Internal server error", 500);
  return res.status(e.status).json({ success: false, error: { code: e.code, message: e.message } });
};

const id = (req: Request) => BigInt(req.params.id);

export async function listSalaryRules(req: Request, res: Response) {
  try { return ok(res, await service.listSalaryRules({
    search: req.query.search as string | undefined,
    category: req.query.category as string | undefined,
    isActive: req.query.isActive === undefined ? undefined : req.query.isActive === "true",
  })); } catch (e) { return fail(res, e); }
}
export async function getSalaryRule(req: Request, res: Response) {
  try { return ok(res, await service.getSalaryRule(id(req))); } catch (e) { return fail(res, e); }
}
export async function createSalaryRule(req: Request, res: Response) {
  try { return ok(res, await service.createSalaryRule(salaryRuleCreateSchema.parse(req.body)), 201); } catch (e) { return fail(res, e); }
}
export async function updateSalaryRule(req: Request, res: Response) {
  try { return ok(res, await service.updateSalaryRule(id(req), salaryRuleUpdateSchema.parse(req.body))); } catch (e) { return fail(res, e); }
}
export async function deleteSalaryRule(req: Request, res: Response) {
  try { return ok(res, await service.deleteSalaryRule(id(req))); } catch (e) { return fail(res, e); }
}

export async function listSalaryStructures(_req: Request, res: Response) {
  try { return ok(res, await service.listSalaryStructures()); } catch (e) { return fail(res, e); }
}
export async function getSalaryStructure(req: Request, res: Response) {
  try { return ok(res, await service.getSalaryStructure(id(req))); } catch (e) { return fail(res, e); }
}
export async function createSalaryStructure(req: Request, res: Response) {
  try { return ok(res, await service.createSalaryStructure(salaryStructureCreateSchema.parse(req.body)), 201); } catch (e) { return fail(res, e); }
}
export async function updateSalaryStructure(req: Request, res: Response) {
  try { return ok(res, await service.updateSalaryStructure(id(req), salaryStructureUpdateSchema.parse(req.body))); } catch (e) { return fail(res, e); }
}
export async function deleteSalaryStructure(req: Request, res: Response) {
  try { return ok(res, await service.deleteSalaryStructure(id(req))); } catch (e) { return fail(res, e); }
}

export async function eligibleEmployees(req: Request, res: Response) {
  try {
    const q = req.query;
    return ok(res, await service.eligibleEmployees({
      salaryStructureId: BigInt(q.salaryStructureId as string),
      periodStart: q.periodStart as string,
      periodEnd: q.periodEnd as string,
    }));
  } catch (e) { return fail(res, e); }
}

export async function createPayrun(req: Request, res: Response) {
  try {
    const userId = BigInt((req as any).user.userId);
    return ok(res, await service.createPayrun(payrunCreateSchema.parse(req.body), userId), 201);
  } catch (e) { return fail(res, e); }
}
export async function computePayrun(req: Request, res: Response) {
  try { return ok(res, await service.computePayrun(id(req))); } catch (e) { return fail(res, e); }
}
export async function validatePayrun(req: Request, res: Response) {
  try { return ok(res, await service.validatePayrun(id(req))); } catch (e) { return fail(res, e); }
}
export async function payPayrun(req: Request, res: Response) {
  try { return ok(res, await service.payPayrun(id(req))); } catch (e) { return fail(res, e); }
}
