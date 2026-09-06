import { jsPDF } from 'jspdf';

export interface PayslipPdfItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  panNumber: string;
  bankAccount: string;
  period: string;
  payDate: string;
  basic: number;
  hra: number;
  specialAllowance: number;
  transport: number;
  pfDeduction: number;
  taxDeduction: number;
  profTax: number;
  lopDeduction: number;
  gross: number;
  totalDeductions: number;
  net: number;
  status: 'PAID' | 'PENDING';
}

const formatCurrency = (val: number): string => {
  return `Rs. ${val.toLocaleString('en-IN')}`;
};

/**
 * Renders a complete, beautifully formatted payslip onto a jsPDF document page.
 */
export const renderPayslipPage = (doc: jsPDF, item: PayslipPdfItem) => {
  const marginX = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // 1. BRAND HEADER
  // Company Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(113, 75, 103); // #714B67 Odoo purple brand
  doc.text('PeoplePay360 Inc.', marginX, 20);

  // Subtitle & Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text('HR & Payroll Services • CIN: U12345MH2026PTC123456', marginX, 25);
  doc.text('Level 4, Infinity Tower, BKC, Mumbai, Maharashtra 400051', marginX, 29);

  // Right Header: Payslip title, ID, and Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('SALARY STATEMENT', pageWidth - marginX, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Pay Slip ID: #${item.id.toUpperCase()}`, pageWidth - marginX, 25, { align: 'right' });

  // Status Badge
  const isPaid = item.status === 'PAID';
  const badgeW = 20;
  const badgeH = 5.5;
  const badgeX = pageWidth - marginX - badgeW;
  const badgeY = 27;

  if (isPaid) {
    doc.setFillColor(220, 252, 231); // green-100
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52); // green-800
    doc.text('PAID', badgeX + badgeW / 2, badgeY + 4, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text('PENDING', badgeX + badgeW / 2, badgeY + 4, { align: 'center' });
  }

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(marginX, 36, pageWidth - marginX, 36);

  // 2. EMPLOYEE DETAILS CARD
  const cardY = 40;
  const cardH = 30;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cardY, contentWidth, cardH, 2, 2, 'FD');

  const col1X = marginX + 4;
  const col2X = marginX + 49;
  const col3X = marginX + 96;
  const col4X = marginX + 141;

  const renderMetaPair = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(label.toUpperCase(), x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(value || '—', x, y + 4.5);
  };

  // Row 1
  renderMetaPair('Employee Name', item.employeeName, col1X, cardY + 7);
  renderMetaPair('Designation', item.position, col2X, cardY + 7);
  renderMetaPair('Pay Period', item.period, col3X, cardY + 7);
  renderMetaPair('Bank Account', item.bankAccount, col4X, cardY + 7);

  // Row 2
  renderMetaPair('Employee Code', item.employeeCode, col1X, cardY + 19);
  renderMetaPair('Department', item.department, col2X, cardY + 19);
  renderMetaPair('Pay Date', item.payDate, col3X, cardY + 19);
  renderMetaPair('PAN Number', item.panNumber, col4X, cardY + 19);

  // 3. EARNINGS & DEDUCTIONS TABLES
  const tableY = 75;
  const colW = (contentWidth - 6) / 2; // 88mm
  const leftX = marginX;
  const rightX = marginX + colW + 6;

  // Earnings Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftX, tableY, colW, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('EARNINGS & ALLOWANCES', leftX + 3, tableY + 4.8);
  doc.text('AMOUNT', leftX + colW - 3, tableY + 4.8, { align: 'right' });

  // Earnings Rows
  const earnings = [
    { label: 'Basic Salary', amount: item.basic },
    { label: 'House Rent Allowance (HRA)', amount: item.hra },
    { label: 'Special Allowance', amount: item.specialAllowance },
    { label: 'Transport Allowance', amount: item.transport },
  ];

  let currentY = tableY + 7;
  const rowH = 6.5;

  earnings.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(241, 245, 249);
    doc.rect(leftX, currentY, colW, rowH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(row.label, leftX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(row.amount), leftX + colW - 3, currentY + 4.5, { align: 'right' });
    currentY += rowH;
  });

  // Gross Earnings Total Row
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftX, currentY, colW, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Gross Earnings', leftX + 3, currentY + 5.2);
  doc.text(formatCurrency(item.gross), leftX + colW - 3, currentY + 5.2, { align: 'right' });

  // Deductions Table Header
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 202, 202);
  doc.rect(rightX, tableY, colW, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57); // rose-800
  doc.text('STATUTORY DEDUCTIONS', rightX + 3, tableY + 4.8);
  doc.text('AMOUNT', rightX + colW - 3, tableY + 4.8, { align: 'right' });

  // Deductions Rows
  const deductions = [
    { label: 'Provident Fund (PF - 12%)', amount: item.pfDeduction },
    { label: 'Income Tax (TDS)', amount: item.taxDeduction },
    { label: 'Professional Tax (PT)', amount: item.profTax },
    { label: 'Loss of Pay (LOP)', amount: item.lopDeduction },
  ];

  currentY = tableY + 7;
  deductions.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 254, idx % 2 === 0 ? 255 : 242, idx % 2 === 0 ? 255 : 242);
    doc.setDrawColor(241, 245, 249);
    doc.rect(rightX, currentY, colW, rowH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(row.label, rightX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(row.amount), rightX + colW - 3, currentY + 4.5, { align: 'right' });
    currentY += rowH;
  });

  // Total Deductions Row
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.rect(rightX, currentY, colW, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 18, 60); // rose-700
  doc.text('Total Deductions', rightX + 3, currentY + 5.2);
  doc.text(`-${formatCurrency(item.totalDeductions)}`, rightX + colW - 3, currentY + 5.2, { align: 'right' });

  // 4. NET TAKE HOME PAYOUT BANNER
  const netBannerY = 120;
  const netBannerH = 22;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(marginX, netBannerY, contentWidth, netBannerH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('NET DISBURSEMENT PAYABLE (TAKE HOME SALARY)', marginX + 6, netBannerY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(formatCurrency(item.net), marginX + 6, netBannerY + 16);

  // Right side of net banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.text('Digitally Verified Statement', pageWidth - marginX - 6, netBannerY + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('Bank Transfer Confirmed', pageWidth - marginX - 6, netBannerY + 14.5, { align: 'right' });

  // 5. BANK & STATUTORY DETAILS CARD
  const bankCardY = 148;
  const bankCardH = 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, bankCardY, contentWidth, bankCardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BANK DISBURSEMENT & STATUTORY COMPLIANCE', marginX + 4, bankCardY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Credit Bank: ${item.bankAccount}`, marginX + 4, bankCardY + 12);
  doc.text(`PAN: ${item.panNumber}`, marginX + 65, bankCardY + 12);
  doc.text(`Status: Disbursed to Bank Account`, marginX + 115, bankCardY + 12);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Provident Fund deposited in EPFO. Income Tax deducted at source (TDS) as per Indian Income Tax Rules.', marginX + 4, bankCardY + 18.5);

  // 6. SIGNATURE & CERTIFICATION
  const signY = 184;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Signature: _______________________', marginX, signY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('For PeoplePay360 Inc.', pageWidth - marginX, signY - 4, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('[Authorized Signatory / Automated Payroll System]', pageWidth - marginX, signY + 1, { align: 'right' });

  // 7. FOOTER
  const footerY = 280;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a system-generated salary slip and requires no physical signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Generated by PeoplePay360 Platform • Level 4, Infinity Tower, BKC, Mumbai', pageWidth / 2, footerY + 3.5, { align: 'center' });
};

/**
 * Downloads a single employee payslip as a PDF file.
 */
export const downloadPayslipPdf = (item: PayslipPdfItem) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  renderPayslipPage(doc, item);

  const cleanPeriod = item.period.replace(/\s+/g, '_');
  const cleanCode = item.employeeCode.replace(/\s+/g, '_');
  const fileName = `Payslip_${cleanCode}_${cleanPeriod}.pdf`;

  doc.save(fileName);
};

/**
 * Downloads all payslips as a multi-page PDF document.
 */
export const downloadAllPayslipsPdf = (items: PayslipPdfItem[], period = 'September_2026') => {
  if (!items.length) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  items.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderPayslipPage(doc, item);
  });

  doc.save(`All_Payslips_${period}.pdf`);
};

/**
 * Generates a base64 encoded PDF string for a single employee payslip.
 */
export const getPayslipPdfBase64 = (item: PayslipPdfItem): string => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  renderPayslipPage(doc, item);

  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1] || '';
};

