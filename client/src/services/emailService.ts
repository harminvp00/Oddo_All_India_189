import { api } from './api';

export interface SendPayslipEmailPayload {
  to: string;
  employeeName: string;
  periodStart?: string;
  periodEnd?: string;
  pdfBase64?: string;
  filename?: string;
  subject?: string;
}

export interface SendReportEmailPayload {
  to: string;
  reportTitle: string;
  period?: string;
  category?: string;
  pdfBase64?: string;
  filename?: string;
  subject?: string;
}

export const emailService = {
  sendPayslipEmail: async (payload: SendPayslipEmailPayload) => {
    return api.post<{ success: boolean; data: { message: string; messageId: string } }>(
      '/payroll/payslips/send-email',
      payload
    );
  },

  sendBulkPayslipEmails: async (items: SendPayslipEmailPayload[]) => {
    return api.post<{ success: boolean; data: { sentCount: number; failedCount: number } }>(
      '/payroll/payslips/send-email-bulk',
      { items }
    );
  },

  sendReportEmail: async (payload: SendReportEmailPayload) => {
    return api.post<{ success: boolean; data: { message: string; messageId: string } }>(
      '/reports/send-email',
      payload
    );
  },
};
