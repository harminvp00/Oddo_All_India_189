import nodemailer, {
  SentMessageInfo,
  Transporter,
} from "nodemailer";

export type PayslipEmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: "application/pdf";
};

export type SendPayslipEmailInput = {
  to: string;
  employeeName: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  attachment: PayslipEmailAttachment;
  subject?: string;
};

export type BulkPayslipEmailItem = SendPayslipEmailInput & {
  employeeId: string | number | bigint;
};

export type BulkEmailResult = {
  sentCount: number;
  failedCount: number;
  failures: Array<{
    employeeId: string;
    message: string;
  }>;
};

export class EmailError extends Error {
  constructor(
    message: string,
    public readonly code =
      "EMAIL_DELIVERY_ERROR",
  ) {
    super(message);
    this.name = "EmailError";
  }
}

const EMAIL_RE =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 120;
const MAX_SUBJECT_LENGTH = 200;
const MAX_FILENAME_LENGTH = 120;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new EmailError(`${field} is required`, "VALIDATION_ERROR");
  }

  const text = value.trim();
  if (text.length > max) {
    throw new EmailError(`${field} exceeds ${max} characters`, "VALIDATION_ERROR");
  }

  return text;
}

function validateEmail(value: unknown): string {
  const email = requiredText(value, "recipient email", MAX_EMAIL_LENGTH);

  if (!EMAIL_RE.test(email)) {
    throw new EmailError("recipient email is invalid", "VALIDATION_ERROR");
  }

  return email;
}

function validateDate(value: unknown, field: string): string {
  const date = value instanceof Date ? value : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new EmailError(`${field} must be a valid date`, "VALIDATION_ERROR");
  }

  return date.toISOString().slice(0, 10);
}

function validateAttachment(attachment: PayslipEmailAttachment): PayslipEmailAttachment {
  if (!attachment || typeof attachment !== "object") {
    throw new EmailError("PDF attachment is required", "VALIDATION_ERROR");
  }

  const filename = requiredText(attachment.filename, "attachment filename", MAX_FILENAME_LENGTH);

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/i.test(filename)) {
    throw new EmailError(
      "attachment filename must be a safe .pdf filename",
      "VALIDATION_ERROR",
    );
  }

  if (!Buffer.isBuffer(attachment.content) || attachment.content.length === 0) {
    throw new EmailError("PDF attachment must contain data", "VALIDATION_ERROR");
  }

  if (attachment.content.length > MAX_ATTACHMENT_BYTES) {
    throw new EmailError(
      `PDF attachment cannot exceed ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB`,
      "VALIDATION_ERROR",
    );
  }

  return {
    filename,
    content: attachment.content,
    contentType: "application/pdf",
  };
}

function validateInput(input: SendPayslipEmailInput): SendPayslipEmailInput {
  if (!input || typeof input !== "object") {
    throw new EmailError("Email payload is required", "VALIDATION_ERROR");
  }

  validateEmail(input.to);
  requiredText(input.employeeName, "employeeName", MAX_NAME_LENGTH);
  validateDate(input.periodStart, "periodStart");
  validateDate(input.periodEnd, "periodEnd");

  const start = validateDate(input.periodStart, "periodStart");
  const end = validateDate(input.periodEnd, "periodEnd");

  if (start > end) {
    throw new EmailError("periodStart must precede or equal periodEnd", "VALIDATION_ERROR");
  }

  if (input.subject != null) {
    requiredText(input.subject, "subject", MAX_SUBJECT_LENGTH);
  }

  validateAttachment(input.attachment);
  return input;
}

function env(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new EmailError(`Missing required email configuration: ${name}`, "EMAIL_CONFIG_ERROR");
  }

  return value;
}

function createTransport(): Transporter<SentMessageInfo> {
  const host = env("SMTP_HOST");
  const portRaw = env("SMTP_PORT");
  const port = Number(portRaw);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new EmailError("SMTP_PORT must be a valid TCP port", "EMAIL_CONFIG_ERROR");
  }

  const secure = process.env.SMTP_SECURE === "true";

  const user = env("SMTP_USER");
  const pass = env("SMTP_PASSWORD");

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function senderAddress(): string {
  const address = validateEmail(process.env.SMTP_FROM_EMAIL);
  return address;
}

function senderName(): string {
  return (process.env.SMTP_FROM_NAME?.trim() || "PeoplePay360").slice(0, 120);
}

function defaultSubject(periodStart: string | Date, periodEnd: string | Date): string {
  return `Payslip - ${validateDate(periodStart, "periodStart")} to ${validateDate(periodEnd, "periodEnd")}`;
}

function buildText(input: SendPayslipEmailInput): string {
  const employeeName = requiredText(input.employeeName, "employeeName", MAX_NAME_LENGTH);
  const start = validateDate(input.periodStart, "periodStart");
  const end = validateDate(input.periodEnd, "periodEnd");

  return [
    `Hello ${employeeName},`,
    "",
    `Your PeoplePay360 payslip for ${start} to ${end} is attached as a PDF.`,
    "",
    "Please contact your HR/payroll team if you have any questions.",
    "",
    "PeoplePay360",
  ].join("\n");
}

function buildHtml(input: SendPayslipEmailInput): string {
  const employeeName = requiredText(input.employeeName, "employeeName", MAX_NAME_LENGTH);
  const start = validateDate(input.periodStart, "periodStart");
  const end = validateDate(input.periodEnd, "periodEnd");

  // Escape user/database-controlled values before inserting into HTML.
  const escapeHtml = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char]!,
    );

  return [
    "<!doctype html>",
    '<html><body style="font-family:Arial,sans-serif;line-height:1.5">',
    "<h2>PeoplePay360</h2>",
    `<p>Hello ${escapeHtml(employeeName)},</p>`,
    `<p>Your payslip for <strong>${escapeHtml(start)}</strong> to <strong>${escapeHtml(end)}</strong> is attached as a PDF.</p>`,
    "<p>Please contact your HR/payroll team if you have any questions.</p>",
    "<p>PeoplePay360</p>",
    "</body></html>",
  ].join("");
}

export async function sendPayslipEmail(
  input: SendPayslipEmailInput,
): Promise<SentMessageInfo> {
  validateInput(input);

  const transporter = createTransport();
  const from = `"${senderName().replace(/"/g, "")}" <${senderAddress()}>`;

  const subject =
    input.subject?.trim() ||
    defaultSubject(input.periodStart, input.periodEnd);

  try {
    return await transporter.sendMail({
      from,
      to: validateEmail(input.to),
      subject,
      text: buildText(input),
      html: buildHtml(input),
      attachments: [validateAttachment(input.attachment)],
    });
  } catch (error) {
    throw new EmailError(
      error instanceof Error ? error.message : "Unable to send payslip email",
    );
  }
}

export async function sendPayslipEmails(
  items: BulkPayslipEmailItem[],
): Promise<BulkEmailResult> {
  if (!Array.isArray(items)) {
    throw new EmailError("Bulk email items must be an array", "VALIDATION_ERROR");
  }

  if (items.length === 0) {
    return { sentCount: 0, failedCount: 0, failures: [] };
  }

  // Validate the complete batch before sending anything. This prevents a malformed
  // item from producing a partially sent batch due to input validation alone.
  items.forEach((item) => validateInput(item));

  const transporter = createTransport();
  const from = `"${senderName().replace(/"/g, "")}" <${senderAddress()}>`;

  let sentCount = 0;
  const failures: BulkEmailResult["failures"] = [];

  for (const item of items) {
    const employeeId =
      typeof item.employeeId === "bigint"
        ? item.employeeId.toString()
        : String(item.employeeId);

    try {
      await transporter.sendMail({
        from,
        to: validateEmail(item.to),
        subject:
          item.subject?.trim() ||
          defaultSubject(item.periodStart, item.periodEnd),
        text: buildText(item),
        html: buildHtml(item),
        attachments: [validateAttachment(item.attachment)],
      });

      sentCount += 1;
    } catch (error) {
      failures.push({
        employeeId,
        message:
          error instanceof Error ? error.message : "Unable to send payslip email",
      });
    }
  }

  return {
    sentCount,
    failedCount: failures.length,
    failures,
  };
}

export async function verifyEmailTransport(): Promise<void> {
  const transporter = createTransport();

  try {
    await transporter.verify();
  } catch (error) {
    throw new EmailError(
      error instanceof Error ? error.message : "SMTP configuration verification failed",
      "EMAIL_CONFIG_ERROR",
    );
  }
}

export default sendPayslipEmail;
