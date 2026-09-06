import { Request, Response } from 'express';
import { sendReportEmail } from '../../utils/email';

export async function sendReportEmailHandler(req: Request, res: Response) {
  try {
    const { to, reportTitle, period, category, pdfBase64, filename, subject } = req.body;

    if (!to || !reportTitle) {
      return res.status(400).json({
        success: false,
        error: { message: "Recipient email ('to') and 'reportTitle' are required" },
      });
    }

    let attachmentBuffer: Buffer;
    if (pdfBase64) {
      attachmentBuffer = Buffer.from(pdfBase64, 'base64');
    } else {
      attachmentBuffer = Buffer.from("%PDF-1.4\n%EOF\n");
    }

    const safePeriod = period || 'September 2026';
    const safeFilename =
      filename ||
      `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${safePeriod.replace(/\s+/g, '_')}.pdf`;

    const info = await sendReportEmail({
      to,
      reportTitle,
      period: safePeriod,
      category,
      attachment: {
        filename: safeFilename,
        content: attachmentBuffer,
        contentType: 'application/pdf',
      },
      subject,
    });

    return res.status(200).json({
      success: true,
      data: {
        messageId: info.messageId,
        message: `Report "${reportTitle}" successfully emailed to ${to}`,
      },
    });
  } catch (err: any) {
    console.error("Error sending report email:", err);
    return res.status(500).json({
      success: false,
      error: { message: err?.message || "Failed to deliver report email" },
    });
  }
}
