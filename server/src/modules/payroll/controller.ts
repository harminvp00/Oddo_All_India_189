import { Request, Response } from "express";
import prisma from "../../config/database";
import {
  payrunCreateSchema,
  salaryRuleCreateSchema,
  salaryRuleUpdateSchema,
  salaryStructureCreateSchema,
  salaryStructureUpdateSchema,
} from "./validation";
import { PayrollError, PayrollService } from "./service";
import { sendPayslipEmail, sendPayslipEmails } from "../../utils/email";

const service = new PayrollService(prisma);


const ok = (res: Response, data: any, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res: Response, error: any) => {
  if (error?.issues)
    return res.status(422).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request", details: error.issues },
    });
  const e =
    error instanceof PayrollError
      ? error
      : new PayrollError("INTERNAL_ERROR", "Internal server error", 500);
  return res.status(e.status).json({ success: false, error: { code: e.code, message: e.message } });
};

const getId = (req: Request): string => {
  const param = req.params.id;
  return Array.isArray(param) ? param[0] : param;
};

const id = (req: Request) => BigInt(getId(req));

export async function listSalaryRules(req: Request, res: Response) {
  try {
    return ok(
      res,
      await service.listSalaryRules({
        search: req.query.search as string | undefined,
        category: req.query.category as string | undefined,
        isActive: req.query.isActive === undefined ? undefined : req.query.isActive === "true",
      }),
    );
  } catch (e) {
    return fail(res, e);
  }
}

export async function getSalaryRule(req: Request, res: Response) {
  try {
    return ok(res, await service.getSalaryRule(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function createSalaryRule(req: Request, res: Response) {
  try {
    return ok(res, await service.createSalaryRule(salaryRuleCreateSchema.parse(req.body)), 201);
  } catch (e) {
    return fail(res, e);
  }
}

export async function updateSalaryRule(req: Request, res: Response) {
  try {
    return ok(res, await service.updateSalaryRule(id(req), salaryRuleUpdateSchema.parse(req.body)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function deleteSalaryRule(req: Request, res: Response) {
  try {
    return ok(res, await service.deleteSalaryRule(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function listSalaryStructures(_req: Request, res: Response) {
  try {
    return ok(res, await service.listSalaryStructures());
  } catch (e) {
    return fail(res, e);
  }
}

export async function getSalaryStructure(req: Request, res: Response) {
  try {
    return ok(res, await service.getSalaryStructure(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function createSalaryStructure(req: Request, res: Response) {
  try {
    return ok(res, await service.createSalaryStructure(salaryStructureCreateSchema.parse(req.body)), 201);
  } catch (e) {
    return fail(res, e);
  }
}

export async function updateSalaryStructure(req: Request, res: Response) {
  try {
    return ok(res, await service.updateSalaryStructure(id(req), salaryStructureUpdateSchema.parse(req.body)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function deleteSalaryStructure(req: Request, res: Response) {
  try {
    return ok(res, await service.deleteSalaryStructure(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function eligibleEmployees(req: Request, res: Response) {
  try {
    const q = req.query;
    return ok(
      res,
      await service.eligibleEmployees({
        salaryStructureId: BigInt(q.salaryStructureId as string),
        periodStart: q.periodStart as string,
        periodEnd: q.periodEnd as string,
      }),
    );
  } catch (e) {
    return fail(res, e);
  }
}

export async function createPayrun(req: Request, res: Response) {
  try {
    const userId = BigInt((req as any).user.userId);
    return ok(res, await service.createPayrun(payrunCreateSchema.parse(req.body), userId), 201);
  } catch (e) {
    return fail(res, e);
  }
}

export async function computePayrun(req: Request, res: Response) {
  try {
    return ok(res, await service.computePayrun(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function validatePayrun(req: Request, res: Response) {
  try {
    return ok(res, await service.validatePayrun(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function payPayrun(req: Request, res: Response) {
  try {
    return ok(res, await service.payPayrun(id(req)));
  } catch (e) {
    return fail(res, e);
  }
}

export async function sendPayslipEmailHandler(req: Request, res: Response) {
  try {
    const { to, employeeName, periodStart, periodEnd, pdfBase64, filename, subject } = req.body;

    if (!to || !employeeName) {
      return res.status(400).json({ success: false, error: { message: "to and employeeName are required" } });
    }

    let attachmentBuffer: Buffer;
    if (pdfBase64) {
      attachmentBuffer = Buffer.from(pdfBase64, 'base64');
    } else {
      attachmentBuffer = Buffer.from("%PDF-1.4\n%EOF\n");
    }

    const info = await sendPayslipEmail({
      to,
      employeeName,
      periodStart: periodStart || new Date().toISOString().slice(0, 10),
      periodEnd: periodEnd || new Date().toISOString().slice(0, 10),
      attachment: {
        filename: filename || `Payslip_${employeeName.replace(/\s+/g, '_')}.pdf`,
        content: attachmentBuffer,
        contentType: "application/pdf",
      },
      subject,
    });

    return ok(res, { success: true, messageId: info.messageId, message: `Payslip email sent to ${to}` });
  } catch (e: any) {
    console.error("Error sending payslip email:", e);
    return res.status(500).json({ success: false, error: { message: e.message || "Failed to send payslip email" } });
  }
}

export async function sendBulkPayslipsEmailHandler(req: Request, res: Response) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: { message: "items must be a non-empty array" } });
    }

    const emailItems = items.map((item: any, idx: number) => {
      const attachmentBuffer = item.pdfBase64
        ? Buffer.from(item.pdfBase64, 'base64')
        : Buffer.from("%PDF-1.4\n%EOF\n");

      return {
        to: item.to,
        employeeName: item.employeeName,
        periodStart: item.periodStart || new Date().toISOString().slice(0, 10),
        periodEnd: item.periodEnd || new Date().toISOString().slice(0, 10),
        employeeId: item.employeeId || idx + 1,
        attachment: {
          filename: item.filename || `Payslip_${item.employeeName.replace(/\s+/g, '_')}.pdf`,
          content: attachmentBuffer,
          contentType: "application/pdf" as const,
        },
        subject: item.subject,
      };
    });

    const result = await sendPayslipEmails(emailItems);
    return ok(res, result);
  } catch (e: any) {
    console.error("Error sending bulk payslip emails:", e);
    return res.status(500).json({ success: false, error: { message: e.message || "Failed to send bulk payslip emails" } });
  }
}

