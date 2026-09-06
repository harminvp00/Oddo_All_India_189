import { Request, Response } from "express";
import { payrollDashboardQuerySchema } from "./validation";
import { DashboardError, DashboardService } from "./service";

const getService = (req: Request) => {
  const db = (req.app as any).locals?.prisma;
  return new DashboardService(db);
};

const fail = (res: Response, error: any) => {
  if (error?.issues) {
    return res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid dashboard query",
        details: error.issues,
      },
    });
  }

  const e = error instanceof DashboardError
    ? error
    : new DashboardError("INTERNAL_SERVER_ERROR", "Internal server error", 500);

  return res.status(e.status).json({
    success: false,
    error: { code: e.code, message: e.message },
  });
};

export async function getPayrollDashboard(req: Request, res: Response) {
  try {
    const query = payrollDashboardQuerySchema.parse(req.query);
    const data = await getService(req).getPayrollDashboard(query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return fail(res, error);
  }
}
