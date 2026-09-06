import PDFDocument from "pdfkit";

export type PayslipLine = {
  sequenceNo?: number | null;
  code: string;
  name: string;
  category: string;
  rate?: number | string | null;
  amount: number | string | bigint | { toNumber?: () => number } | null;
};

export type PayslipPdfData = {
  id: string | number | bigint;
  periodStart: string | Date;
  periodEnd: string | Date;
  workedDays?: number | string | null;
  grossAmount: number | string | bigint | { toNumber?: () => number } | null;
  totalDeductions: number | string | bigint | { toNumber?: () => number } | null;
  netAmount: number | string | bigint | { toNumber?: () => number } | null;
  employee: {
    id: string | number | bigint;
    employeeCode: string;
    fullName: string;
    department?: string | null;
    position?: string | null;
    bankAccount?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
  };
  contract?: {
    contractNumber?: string | null;
    wage?: number | string | null;
  } | null;
  lines: PayslipLine[];
};

export class PayslipPdfError extends Error {
  constructor(
    message: string,
    public readonly code =
      "PAYSLIP_PDF_GENERATION_ERROR",
  ) {
    super(message);
    this.name = "PayslipPdfError";
  }
}

const MAX_NAME_LENGTH = 120;
const MAX_CODE_LENGTH = 40;
const MAX_LINE_COUNT = 100;

function requiredText(value: unknown, field: string, max = MAX_NAME_LENGTH): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PayslipPdfError(`${field} is required`, "VALIDATION_ERROR");
  }

  const text = value.trim();
  if (text.length > max) {
    throw new PayslipPdfError(`${field} exceeds ${max} characters`, "VALIDATION_ERROR");
  }

  return text;
}

function optionalText(value: unknown, field: string, max = MAX_NAME_LENGTH): string {
  if (value == null || value === "") return "";
  return requiredText(value, field, max);
}

function numeric(value: unknown, field: string): number {
  if (value == null || value === "") {
    throw new PayslipPdfError(`${field} is required`, "VALIDATION_ERROR");
  }

  let result: number;

  if (typeof value === "object" && value !== null && typeof (value as any).toNumber === "function") {
    result = Number((value as any).toNumber());
  } else {
    result = Number(value);
  }

  if (!Number.isFinite(result)) {
    throw new PayslipPdfError(`${field} must be a finite number`, "VALIDATION_ERROR");
  }

  return result;
}

function nonNegative(value: unknown, field: string): number {
  const result = numeric(value, field);
  if (result < 0) {
    throw new PayslipPdfError(`${field} cannot be negative`, "VALIDATION_ERROR");
  }
  return result;
}

function dateText(value: unknown, field: string): string {
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new PayslipPdfError(`${field} must be a valid date`, "VALIDATION_ERROR");
  }

  return date.toISOString().slice(0, 10);
}

function safeId(value: unknown, field: string): string {
  if (typeof value === "bigint") {
    if (value < 0n) {
      throw new PayslipPdfError(`${field} must be non-negative`, "VALIDATION_ERROR");
    }
    return value.toString();
  }

  if (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0)) {
    throw new PayslipPdfError(`${field} must be a safe non-negative integer`, "VALIDATION_ERROR");
  }

  const text = String(value ?? "").trim();

  if (!text || !/^[A-Za-z0-9_-]+$/.test(text)) {
    throw new PayslipPdfError(`${field} contains invalid characters`, "VALIDATION_ERROR");
  }

  return text;
}

function formatMoney(value: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRate(value: PayslipLine["rate"]): string {
  if (value == null || value === "") return "—";

  const rate = Number(value);
  if (!Number.isFinite(rate)) {
    throw new PayslipPdfError("line rate must be a finite number", "VALIDATION_ERROR");
  }

  return `${(rate * 100).toFixed(2)}%`;
}

function isDeduction(category: string): boolean {
  return category.toUpperCase() === "DEDUCTION";
}

function validatePayslip(data: PayslipPdfData): PayslipPdfData {
  if (!data || typeof data !== "object") {
    throw new PayslipPdfError("Payslip data is required", "VALIDATION_ERROR");
  }

  safeId(data.id, "payslip id");
  if (!Array.isArray(data.lines)) {
    throw new PayslipPdfError("payslip lines must be an array", "VALIDATION_ERROR");
  }
  requiredText(data.employee?.employeeCode, "employeeCode", MAX_CODE_LENGTH);
  requiredText(data.employee?.fullName, "employee fullName");

  if (data.lines.length > MAX_LINE_COUNT) {
    throw new PayslipPdfError(
      `A payslip cannot contain more than ${MAX_LINE_COUNT} lines`,
      "VALIDATION_ERROR",
    );
  }

  const start = dateText(data.periodStart, "periodStart");
  const end = dateText(data.periodEnd, "periodEnd");

  if (start > end) {
    throw new PayslipPdfError("periodStart must precede or equal periodEnd", "VALIDATION_ERROR");
  }

  nonNegative(data.grossAmount, "grossAmount");
  nonNegative(data.totalDeductions, "totalDeductions");
  nonNegative(data.netAmount, "netAmount");

  if (data.workedDays != null) {
    nonNegative(data.workedDays, "workedDays");
  }

  for (const [index, line] of data.lines.entries()) {
    requiredText(line.code, `lines[${index}].code`, MAX_CODE_LENGTH);
    requiredText(line.name, `lines[${index}].name`);
    requiredText(line.category, `lines[${index}].category`, 40);
    nonNegative(line.amount, `lines[${index}].amount`);

    if (line.sequenceNo != null && (!Number.isInteger(Number(line.sequenceNo)) || Number(line.sequenceNo) < 0)) {
      throw new PayslipPdfError(
        `lines[${index}].sequenceNo must be a non-negative integer`,
        "VALIDATION_ERROR",
      );
    }
  }

  return data;
}

function drawSectionTitle(doc: any, title: string) {
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(title)
    .moveDown(0.4);
}

function drawKeyValue(
  doc: any,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  doc.font("Helvetica-Bold").fontSize(9).text(label, x, y);
  doc.font("Helvetica").text(value || "—", x + 110, y);
}

export async function generatePayslipPdf(data: PayslipPdfData): Promise<Buffer> {
  const payslip = validatePayslip(data);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 42,
      info: {
        Title: `PeoplePay360 Payslip ${String(payslip.id)}`,
        Author: "PeoplePay360",
        Subject: "Employee payslip",
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (error) =>
      reject(
        new PayslipPdfError(
          error instanceof Error ? error.message : "Unable to generate payslip PDF",
        ),
      ),
    );

    try {
      const gross = nonNegative(payslip.grossAmount, "grossAmount");
      const deductions = nonNegative(payslip.totalDeductions, "totalDeductions");
      const net = nonNegative(payslip.netAmount, "netAmount");

      // Header / branding
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("PeoplePay360", { align: "left" });

      doc
        .font("Helvetica")
        .fontSize(9)
        .text("HR & Payroll")
        .moveDown(0.2);

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("PAYSLIP", { align: "right" });

      doc.moveDown(1);

      drawSectionTitle(doc, "Employee Details");
      const employeeY = doc.y;

      drawKeyValue(doc, "Employee", payslip.employee.fullName, 42, employeeY);
      drawKeyValue(doc, "Employee Code", payslip.employee.employeeCode, 42, employeeY + 18);
      drawKeyValue(doc, "Department", optionalText(payslip.employee.department, "department"), 42, employeeY + 36);
      drawKeyValue(doc, "Position", optionalText(payslip.employee.position, "position"), 42, employeeY + 54);

      drawKeyValue(
        doc,
        "Payslip ID",
        safeId(payslip.id, "payslip id"),
        310,
        employeeY,
      );
      drawKeyValue(
        doc,
        "Period",
        `${dateText(payslip.periodStart, "periodStart")} to ${dateText(payslip.periodEnd, "periodEnd")}`,
        310,
        employeeY + 18,
      );
      drawKeyValue(
        doc,
        "Worked Days",
        payslip.workedDays == null ? "—" : numeric(payslip.workedDays, "workedDays").toFixed(2),
        310,
        employeeY + 36,
      );
      drawKeyValue(
        doc,
        "Contract",
        optionalText(payslip.contract?.contractNumber, "contractNumber", MAX_CODE_LENGTH),
        310,
        employeeY + 54,
      );

      doc.y = employeeY + 82;

      drawSectionTitle(doc, "Earnings & Deductions");

      const tableX = 42;
      const codeX = 42;
      const nameX = 100;
      const categoryX = 300;
      const rateX = 390;
      const amountX = 470;

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("Code", codeX)
        .text("Description", nameX)
        .text("Category", categoryX)
        .text("Rate", rateX)
        .text("Amount", amountX);

      doc.moveTo(tableX, doc.y + 2).lineTo(553, doc.y + 2).stroke();
      doc.moveDown(0.5);

      const lines = [...payslip.lines].sort(
        (a, b) => Number(a.sequenceNo ?? 0) - Number(b.sequenceNo ?? 0),
      );

      for (const line of lines) {
        if (doc.y > 735) doc.addPage();

        const amount = nonNegative(line.amount, `line ${line.code} amount`);
        const category = line.category.toUpperCase();

        doc
          .font("Helvetica")
          .fontSize(8)
          .text(line.code, codeX)
          .text(line.name, nameX, doc.y)
          .text(category, categoryX, doc.y)
          .text(formatRate(line.rate), rateX, doc.y)
          .text(formatMoney(amount), amountX, doc.y, { align: "right", width: 83 });

        doc.moveDown(0.55);
      }

      doc.moveDown(0.5);

      const calculatedEarnings = lines
        .filter((line) => !isDeduction(line.category))
        .reduce((sum, line) => sum + nonNegative(line.amount, `line ${line.code} amount`), 0);

      const calculatedDeductions = lines
        .filter((line) => isDeduction(line.category))
        .reduce((sum, line) => sum + nonNegative(line.amount, `line ${line.code} amount`), 0);

      // Keep the PDF truthful to the persisted payslip totals. The line totals are
      // displayed independently; the engine remains the source of truth for gross/net.
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(`Line earnings: ${formatMoney(calculatedEarnings)}`, { align: "right" })
        .text(`Line deductions: ${formatMoney(calculatedDeductions)}`, { align: "right" })
        .moveDown(0.5);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Gross Pay: ${formatMoney(gross)}`, { align: "right" })
        .text(`Total Deductions: ${formatMoney(deductions)}`, { align: "right" })
        .fontSize(13)
        .text(`Net Pay: ${formatMoney(net)}`, { align: "right" });

      doc.moveDown(1.5);

      drawSectionTitle(doc, "Bank Details");
      doc.font("Helvetica").fontSize(9);
      doc.text(`Account: ${optionalText(payslip.employee.bankAccount, "bankAccount") || "—"}`);
      doc.text(`Bank: ${optionalText(payslip.employee.bankName, "bankName") || "—"}`);
      doc.text(`IFSC: ${optionalText(payslip.employee.ifscCode, "ifscCode", 20) || "—"}`);

      doc.moveDown(2);
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Generated by PeoplePay360. This document is generated from the stored payslip and payslip-line records.",
          { align: "center" },
        );

      doc.end();
    } catch (error) {
      reject(
        error instanceof PayslipPdfError
          ? error
          : new PayslipPdfError(
              error instanceof Error ? error.message : "Unable to generate payslip PDF",
            ),
      );
    }
  });
}

export default generatePayslipPdf;
