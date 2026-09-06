import { jsPDF } from 'jspdf';

export interface ReportKpi {
  label: string;
  value: string;
  subtext?: string;
}

export interface ReportColumn {
  header: string;
  key: string;
  widthMm: number; // width in mm
  align?: 'left' | 'center' | 'right';
}

export interface ReportDataset {
  id: string;
  title: string;
  category: 'PAYROLL' | 'WORKFORCE' | 'COMPLIANCE';
  subtitle: string;
  kpis: ReportKpi[];
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  totalRow?: Record<string, string | number>;
  notes?: string;
}

export const formatInr = (val: number): string => {
  return `Rs. ${val.toLocaleString('en-IN')}`;
};

export const REPORT_DATA_MAP: Record<string, ReportDataset> = {
  'rep-1': {
    id: 'rep-1',
    title: 'Monthly Payroll Expense Summary',
    category: 'PAYROLL',
    subtitle: 'Comprehensive breakdown of gross pay, statutory PF/PT/TDS deductions, and net payouts',
    kpis: [
      { label: 'TOTAL GROSS SPEND', value: 'Rs. 12,35,000', subtext: '10 active salary disbursements' },
      { label: 'PF REMITTANCE (12%)', value: 'Rs. 74,100', subtext: 'EPF statutory deductions' },
      { label: 'TAX DEDUCTED (TDS)', value: 'Rs. 72,200', subtext: 'Section 192B withholding' },
      { label: 'NET PAYOUT AMOUNT', value: 'Rs. 10,86,700', subtext: '100% direct bank NEFT' },
    ],
    columns: [
      { header: 'CODE', key: 'code', widthMm: 20, align: 'center' },
      { header: 'EMPLOYEE NAME', key: 'name', widthMm: 45, align: 'left' },
      { header: 'DEPARTMENT', key: 'dept', widthMm: 38, align: 'left' },
      { header: 'GROSS PAY', key: 'gross', widthMm: 30, align: 'right' },
      { header: 'PF (12%)', key: 'pf', widthMm: 24, align: 'right' },
      { header: 'PT', key: 'pt', widthMm: 18, align: 'right' },
      { header: 'TDS (TAX)', key: 'tds', widthMm: 24, align: 'right' },
      { header: 'NET PAYOUT', key: 'net', widthMm: 34, align: 'right' },
      { header: 'STATUS', key: 'status', widthMm: 26, align: 'center' },
    ],
    rows: [
      { code: 'EMP-001', name: 'Rahul Sharma', dept: 'Engineering', gross: 'Rs. 1,85,000', pf: 'Rs. 11,100', pt: 'Rs. 200', tds: 'Rs. 12,500', net: 'Rs. 1,61,200', status: 'PAID' },
      { code: 'EMP-002', name: 'Amit Patel', dept: 'Engineering', gross: 'Rs. 1,40,000', pf: 'Rs. 8,400', pt: 'Rs. 200', tds: 'Rs. 8,900', net: 'Rs. 1,22,500', status: 'PAID' },
      { code: 'EMP-003', name: 'Priya Desai', dept: 'Product & Design', gross: 'Rs. 1,65,000', pf: 'Rs. 9,900', pt: 'Rs. 200', tds: 'Rs. 10,800', net: 'Rs. 1,44,100', status: 'PAID' },
      { code: 'EMP-004', name: 'Vikram Malhotra', dept: 'Sales & Marketing', gross: 'Rs. 1,25,000', pf: 'Rs. 7,500', pt: 'Rs. 200', tds: 'Rs. 7,200', net: 'Rs. 1,10,100', status: 'PAID' },
      { code: 'EMP-005', name: 'Sneha Reddy', dept: 'Human Resources', gross: 'Rs. 1,15,000', pf: 'Rs. 6,900', pt: 'Rs. 200', tds: 'Rs. 6,400', net: 'Rs. 1,01,500', status: 'PAID' },
      { code: 'EMP-006', name: 'Ananya Joshi', dept: 'Finance & Legal', gross: 'Rs. 1,35,000', pf: 'Rs. 8,100', pt: 'Rs. 200', tds: 'Rs. 8,200', net: 'Rs. 1,18,500', status: 'PAID' },
      { code: 'EMP-007', name: 'Karan Mehta', dept: 'Engineering', gross: 'Rs. 95,000', pf: 'Rs. 5,700', pt: 'Rs. 200', tds: 'Rs. 4,800', net: 'Rs. 84,300', status: 'PAID' },
      { code: 'EMP-008', name: 'Pooja Nair', dept: 'Sales & Marketing', gross: 'Rs. 88,000', pf: 'Rs. 5,280', pt: 'Rs. 200', tds: 'Rs. 4,200', net: 'Rs. 78,320', status: 'PAID' },
      { code: 'EMP-009', name: 'Rajesh Verma', dept: 'Operations', gross: 'Rs. 75,000', pf: 'Rs. 4,500', pt: 'Rs. 200', tds: 'Rs. 3,100', net: 'Rs. 67,200', status: 'PAID' },
      { code: 'EMP-010', name: 'Neha Gupta', dept: 'Product & Design', gross: 'Rs. 1,12,000', pf: 'Rs. 6,720', pt: 'Rs. 200', tds: 'Rs. 6,100', net: 'Rs. 98,980', status: 'PAID' },
    ],
    totalRow: {
      code: 'TOTAL',
      name: '10 Employees',
      dept: 'Organization-wide',
      gross: 'Rs. 12,35,000',
      pf: 'Rs. 74,100',
      pt: 'Rs. 2,000',
      tds: 'Rs. 72,200',
      net: 'Rs. 10,86,700',
      status: '100% PAID',
    },
    notes: 'All disbursements processed through standard Corporate Automated Clearing House (ACH) / NEFT. Certified by Accounts & Payroll.',
  },
  'rep-2': {
    id: 'rep-2',
    title: 'Department Cost & Headcount Distribution',
    category: 'WORKFORCE',
    subtitle: 'Comparative analysis of compensation spend, average wage, and headcount allocation per department',
    kpis: [
      { label: 'TOTAL ORG HEADCOUNT', value: '124 Employees', subtext: 'Across 5 departments' },
      { label: 'MONTHLY PAYROLL RUN', value: 'Rs. 45,20,000', subtext: 'Full corporate run-rate' },
      { label: 'AVG SALARY PER HEAD', value: 'Rs. 36,451', subtext: 'Monthly median compensation' },
      { label: 'ANNUALIZED RUN-RATE', value: 'Rs. 5.42 Cr', subtext: '+18.9% YoY growth' },
    ],
    columns: [
      { header: 'DEPARTMENT', key: 'dept', widthMm: 50, align: 'left' },
      { header: 'HEADCOUNT', key: 'headcount', widthMm: 30, align: 'center' },
      { header: 'KEY ROLES', key: 'roles', widthMm: 60, align: 'left' },
      { header: 'MONTHLY SPEND', key: 'spend', widthMm: 40, align: 'right' },
      { header: 'AVG / EMPLOYEE', key: 'avg', widthMm: 35, align: 'right' },
      { header: 'BUDGET SHARE', key: 'share', widthMm: 28, align: 'center' },
      { header: 'YOY GROWTH', key: 'growth', widthMm: 26, align: 'center' },
    ],
    rows: [
      { dept: 'Engineering', headcount: '52 Staff', roles: 'Lead Architect, Fullstack, DevOps', spend: 'Rs. 22,40,000', avg: 'Rs. 43,077', share: '49.6%', growth: '+18.4%' },
      { dept: 'Product & Design', headcount: '18 Staff', roles: 'Product Managers, UI/UX Leads', spend: 'Rs. 7,80,000', avg: 'Rs. 43,333', share: '17.3%', growth: '+14.2%' },
      { dept: 'Sales & Marketing', headcount: '24 Staff', roles: 'Account Executives, Growth Leads', spend: 'Rs. 6,50,000', avg: 'Rs. 27,083', share: '14.4%', growth: '+22.0%' },
      { dept: 'Finance & Legal', headcount: '14 Staff', roles: 'Controller, Compliance, Tax', spend: 'Rs. 4,50,000', avg: 'Rs. 32,143', share: '10.0%', growth: '+8.5%' },
      { dept: 'Human Resources', headcount: '16 Staff', roles: 'HRBP, Talent Acquisition, Ops', spend: 'Rs. 4,00,000', avg: 'Rs. 25,000', share: '8.8%', growth: '+11.2%' },
    ],
    totalRow: {
      dept: 'TOTAL',
      headcount: '124 Staff',
      roles: 'Full Organization Structure',
      spend: 'Rs. 45,20,000',
      avg: 'Rs. 36,451',
      share: '100.0%',
      growth: '+16.8%',
    },
    notes: 'Headcount figures represent active permanent and contract personnel as of the end of the reporting period.',
  },
  'rep-3': {
    id: 'rep-3',
    title: 'Attendance & Loss of Pay (LOP) Audit',
    category: 'WORKFORCE',
    subtitle: 'Detailed roster of employee check-in compliance, leave balance utilization, and salary deductions',
    kpis: [
      { label: 'EMPLOYEES AUDITED', value: '124 Staff', subtext: 'Biometric & portal check-ins' },
      { label: 'SCHEDULED DAYS', value: '22 Days', subtext: 'Working days in period' },
      { label: 'TOTAL LOP DAYS', value: '6 Days', subtext: 'Unapproved absences' },
      { label: 'ATTENDANCE RATE', value: '98.6%', subtext: 'Corporate benchmark > 95%' },
    ],
    columns: [
      { header: 'CODE', key: 'code', widthMm: 20, align: 'center' },
      { header: 'EMPLOYEE NAME', key: 'name', widthMm: 46, align: 'left' },
      { header: 'DEPARTMENT', key: 'dept', widthMm: 38, align: 'left' },
      { header: 'WORKING', key: 'working', widthMm: 24, align: 'center' },
      { header: 'PRESENT', key: 'present', widthMm: 24, align: 'center' },
      { header: 'LEAVES', key: 'leaves', widthMm: 24, align: 'center' },
      { header: 'LOP DAYS', key: 'lop', widthMm: 24, align: 'center' },
      { header: 'LOP DEDUCTION', key: 'deduction', widthMm: 35, align: 'right' },
      { header: 'AUDIT RESULT', key: 'result', widthMm: 34, align: 'center' },
    ],
    rows: [
      { code: 'EMP-001', name: 'Rahul Sharma', dept: 'Engineering', working: '22', present: '22', leaves: '0', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
      { code: 'EMP-002', name: 'Amit Patel', dept: 'Engineering', working: '22', present: '21', leaves: '1', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
      { code: 'EMP-003', name: 'Priya Desai', dept: 'Product & Design', working: '22', present: '20', leaves: '2', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
      { code: 'EMP-004', name: 'Vikram Malhotra', dept: 'Sales & Marketing', working: '22', present: '19', leaves: '1', lop: '2', deduction: 'Rs. 11,364', result: 'LOP APPLIED' },
      { code: 'EMP-005', name: 'Sneha Reddy', dept: 'Human Resources', working: '22', present: '22', leaves: '0', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
      { code: 'EMP-006', name: 'Ananya Joshi', dept: 'Finance & Legal', working: '22', present: '21', leaves: '1', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
      { code: 'EMP-007', name: 'Karan Mehta', dept: 'Engineering', working: '22', present: '20', leaves: '1', lop: '1', deduction: 'Rs. 4,318', result: 'LOP APPLIED' },
      { code: 'EMP-008', name: 'Pooja Nair', dept: 'Sales & Marketing', working: '22', present: '22', leaves: '0', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
      { code: 'EMP-009', name: 'Rajesh Verma', dept: 'Operations', working: '22', present: '19', leaves: '0', lop: '3', deduction: 'Rs. 10,227', result: 'LOP APPLIED' },
      { code: 'EMP-010', name: 'Neha Gupta', dept: 'Product & Design', working: '22', present: '22', leaves: '0', lop: '0', deduction: 'Rs. 0', result: 'COMPLIANT' },
    ],
    totalRow: {
      code: 'TOTAL',
      name: '10 Employees Audited',
      dept: 'All Units',
      working: '220 Days',
      present: '208 Days',
      leaves: '6 Days',
      lop: '6 Days',
      deduction: 'Rs. 25,909',
      result: 'RECONCILED',
    },
    notes: 'Loss of Pay deductions are computed pro-rata: (Monthly Wage / 22 Working Days) * LOP Days.',
  },
  'rep-4': {
    id: 'rep-4',
    title: 'Statutory Tax & PF Compliance (Form 16/24Q)',
    category: 'COMPLIANCE',
    subtitle: 'Tax deductions at source, Provident Fund employer/employee contributions, and statutory filings',
    kpis: [
      { label: 'EPF REMITTED (A/C 1)', value: 'Rs. 1,19,300', subtext: 'EPFO Electronic Challan' },
      { label: 'EPS PENSION (A/C 10)', value: 'Rs. 28,900', subtext: 'Statutory employer 8.33%' },
      { label: 'TDS WITHHELD (24Q)', value: 'Rs. 72,200', subtext: 'Govt Treasury deposited' },
      { label: 'FILING COMPLIANCE', value: '100% On-Time', subtext: 'Zero penal liabilities' },
    ],
    columns: [
      { header: 'CHALLAN REF', key: 'challan', widthMm: 35, align: 'left' },
      { header: 'STATUTORY COMPONENT', key: 'component', widthMm: 68, align: 'left' },
      { header: 'PERIOD', key: 'period', widthMm: 25, align: 'center' },
      { header: 'GROSS WAGE', key: 'gross', widthMm: 35, align: 'right' },
      { header: 'EMPLOYEE SHARE', key: 'employee', widthMm: 32, align: 'right' },
      { header: 'EMPLOYER SHARE', key: 'employer', widthMm: 32, align: 'right' },
      { header: 'TOTAL PAID', key: 'total', widthMm: 30, align: 'right' },
      { header: 'STATUS', key: 'status', widthMm: 22, align: 'center' },
    ],
    rows: [
      { challan: 'CHL-PF-202609', component: 'Employees Provident Fund (EPF - A/C 1)', period: 'Sep 2026', gross: 'Rs. 12,35,000', employee: 'Rs. 74,100', employer: 'Rs. 45,200', total: 'Rs. 1,19,300', status: 'PAID' },
      { challan: 'CHL-EPS-202609', component: 'Employees Pension Scheme (EPS - A/C 10)', period: 'Sep 2026', gross: 'Rs. 12,35,000', employee: 'Rs. 0', employer: 'Rs. 28,900', total: 'Rs. 28,900', status: 'PAID' },
      { challan: 'CHL-TDS-202609', component: 'Income Tax TDS (Form 24Q - Section 192)', period: 'Sep 2026', gross: 'Rs. 12,35,000', employee: 'Rs. 72,200', employer: 'Rs. 0', total: 'Rs. 72,200', status: 'PAID' },
      { challan: 'CHL-PT-202609', component: 'Maharashtra State Professional Tax (PTRC)', period: 'Sep 2026', gross: 'Rs. 12,35,000', employee: 'Rs. 2,000', employer: 'Rs. 0', total: 'Rs. 2,000', status: 'PAID' },
      { challan: 'CHL-EDLI-202609', component: 'Deposit Linked Insurance (EDLI - A/C 21)', period: 'Sep 2026', gross: 'Rs. 12,35,000', employee: 'Rs. 0', employer: 'Rs. 6,175', total: 'Rs. 6,175', status: 'PAID' },
      { challan: 'CHL-ADM-202609', component: 'EPF Admin & Inspection Charges (A/C 2)', period: 'Sep 2026', gross: 'Rs. 12,35,000', employee: 'Rs. 0', employer: 'Rs. 6,175', total: 'Rs. 6,175', status: 'PAID' },
    ],
    totalRow: {
      challan: 'TOTAL',
      component: 'Statutory Liabilities Reconciled',
      period: 'Sep 2026',
      gross: 'Rs. 12,35,000',
      employee: 'Rs. 1,48,300',
      employer: 'Rs. 86,450',
      total: 'Rs. 2,34,750',
      status: 'SETTLED',
    },
    notes: 'All challans remitted to authorized government nodal banks before the statutory deadline of 15th of the calendar month.',
  },
  'rep-5': {
    id: 'rep-5',
    title: 'Bank Payment Remittance & Reconciliation',
    category: 'PAYROLL',
    subtitle: 'Direct salary NEFT disbursement audit, UTR transaction status, and return/failure reconciliation',
    kpis: [
      { label: 'TOTAL REMITTANCE', value: 'Rs. 10,86,700', subtext: 'Corporate ACH salary run' },
      { label: 'TOTAL TRANSFERS', value: '10 Transfers', subtext: '100% success rate' },
      { label: 'REJECTIONS / FAILS', value: '0 Returned', subtext: 'Zero settlement errors' },
      { label: 'SETTLEMENT UTR', value: 'Confirmed', subtext: 'CMS Batch #260930-B1' },
    ],
    columns: [
      { header: 'BATCH ID', key: 'batch', widthMm: 25, align: 'center' },
      { header: 'BENEFICIARY NAME', key: 'name', widthMm: 46, align: 'left' },
      { header: 'BANK ACCOUNT', key: 'account', widthMm: 38, align: 'left' },
      { header: 'IFSC CODE', key: 'ifsc', widthMm: 28, align: 'center' },
      { header: 'AMOUNT', key: 'amount', widthMm: 34, align: 'right' },
      { header: 'UTR REFERENCE NO.', key: 'utr', widthMm: 48, align: 'left' },
      { header: 'STATUS', key: 'status', widthMm: 26, align: 'center' },
    ],
    rows: [
      { batch: 'B1-01', name: 'Rahul Sharma', account: 'HDFC •••• 4921', ifsc: 'HDFC0001234', amount: 'Rs. 1,61,200', utr: 'CMS260930101982', status: 'SUCCESS' },
      { batch: 'B1-02', name: 'Amit Patel', account: 'ICICI •••• 8832', ifsc: 'ICIC0005678', amount: 'Rs. 1,22,500', utr: 'CMS260930102431', status: 'SUCCESS' },
      { batch: 'B1-03', name: 'Priya Desai', account: 'SBI •••• 1092', ifsc: 'SBIN0009876', amount: 'Rs. 1,44,100', utr: 'CMS260930103762', status: 'SUCCESS' },
      { batch: 'B1-04', name: 'Vikram Malhotra', account: 'Axis •••• 5543', ifsc: 'UTIB0002345', amount: 'Rs. 1,10,100', utr: 'CMS260930104118', status: 'SUCCESS' },
      { batch: 'B1-05', name: 'Sneha Reddy', account: 'Kotak •••• 3321', ifsc: 'KKBK0003456', amount: 'Rs. 1,01,500', utr: 'CMS260930105990', status: 'SUCCESS' },
      { batch: 'B1-06', name: 'Ananya Joshi', account: 'HDFC •••• 7712', ifsc: 'HDFC0001234', amount: 'Rs. 1,18,500', utr: 'CMS260930106234', status: 'SUCCESS' },
      { batch: 'B1-07', name: 'Karan Mehta', account: 'ICICI •••• 9901', ifsc: 'ICIC0005678', amount: 'Rs. 84,300', utr: 'CMS260930107871', status: 'SUCCESS' },
      { batch: 'B1-08', name: 'Pooja Nair', account: 'SBI •••• 4421', ifsc: 'SBIN0009876', amount: 'Rs. 78,320', utr: 'CMS260930108543', status: 'SUCCESS' },
      { batch: 'B1-09', name: 'Rajesh Verma', account: 'PNB •••• 6612', ifsc: 'PUNB0004321', amount: 'Rs. 67,200', utr: 'CMS260930109129', status: 'SUCCESS' },
      { batch: 'B1-10', name: 'Neha Gupta', account: 'Axis •••• 2289', ifsc: 'UTIB0002345', amount: 'Rs. 98,980', utr: 'CMS260930110455', status: 'SUCCESS' },
    ],
    totalRow: {
      batch: 'TOTAL',
      name: '10 Accounts Reconciled',
      account: 'Corporate Sponsor A/C',
      ifsc: 'HDFC0000001',
      amount: 'Rs. 10,86,700',
      utr: 'BATCH CMS-2026-SEP-01',
      status: '100% RECONCILED',
    },
    notes: 'Direct corporate banking API integration. All funds successfully debited and credited to beneficiary accounts.',
  },
  'rep-6': {
    id: 'rep-6',
    title: 'Employment Contract & Wage Variance',
    category: 'COMPLIANCE',
    subtitle: 'Historical wage increases, contract renewals, and schedule compensation variance across quarters',
    kpis: [
      { label: 'IN-FORCE CONTRACTS', value: '89 Contracts', subtext: 'Permanent & Fixed-term' },
      { label: 'AVG ANNUAL REVISION', value: '+12.4%', subtext: 'Annual merit appraisal' },
      { label: 'STATUTORY MIN WAGE', value: '100% Compliant', subtext: 'Meets State wage slabs' },
      { label: 'UPCOMING RENEWALS', value: '6 Contracts', subtext: 'Next 90 calendar days' },
    ],
    columns: [
      { header: 'CONTRACT REF', key: 'ref', widthMm: 30, align: 'center' },
      { header: 'EMPLOYEE NAME', key: 'name', widthMm: 46, align: 'left' },
      { header: 'POSITION', key: 'pos', widthMm: 48, align: 'left' },
      { header: 'EFFECTIVE DATE', key: 'date', widthMm: 30, align: 'center' },
      { header: 'PRIOR WAGE', key: 'prior', widthMm: 32, align: 'right' },
      { header: 'REVISED WAGE', key: 'revised', widthMm: 32, align: 'right' },
      { header: 'VARIANCE %', key: 'variance', widthMm: 24, align: 'center' },
      { header: 'STATUS', key: 'status', widthMm: 24, align: 'center' },
    ],
    rows: [
      { ref: 'CTR-2024-01', name: 'Rahul Sharma', pos: 'Lead Architect', date: '01 Apr 2026', prior: 'Rs. 1,60,000', revised: 'Rs. 1,85,000', variance: '+15.6%', status: 'ACTIVE' },
      { ref: 'CTR-2024-02', name: 'Amit Patel', pos: 'Senior Backend Engineer', date: '01 Apr 2026', prior: 'Rs. 1,20,000', revised: 'Rs. 1,40,000', variance: '+16.7%', status: 'ACTIVE' },
      { ref: 'CTR-2025-01', name: 'Priya Desai', pos: 'Product Lead', date: '01 Jul 2026', prior: 'Rs. 1,50,000', revised: 'Rs. 1,65,000', variance: '+10.0%', status: 'ACTIVE' },
      { ref: 'CTR-2025-02', name: 'Vikram Malhotra', pos: 'Sales Director', date: '01 Jan 2026', prior: 'Rs. 1,10,000', revised: 'Rs. 1,25,000', variance: '+13.6%', status: 'ACTIVE' },
      { ref: 'CTR-2025-03', name: 'Sneha Reddy', pos: 'Head of HR', date: '01 Apr 2026', prior: 'Rs. 1,05,000', revised: 'Rs. 1,15,000', variance: '+9.5%', status: 'ACTIVE' },
      { ref: 'CTR-2025-04', name: 'Ananya Joshi', pos: 'Legal & Compliance Officer', date: '01 Apr 2026', prior: 'Rs. 1,20,000', revised: 'Rs. 1,35,000', variance: '+12.5%', status: 'ACTIVE' },
      { ref: 'CTR-2026-01', name: 'Karan Mehta', pos: 'Fullstack Engineer', date: '01 Sep 2026', prior: 'Rs. 85,000', revised: 'Rs. 95,000', variance: '+11.8%', status: 'ACTIVE' },
    ],
    totalRow: {
      ref: 'TOTAL',
      name: '7 Tracked Revisions',
      pos: 'Strategic Tech & Ops Staff',
      date: 'FY 2026-27',
      prior: 'Rs. 8,50,000',
      revised: 'Rs. 9,60,000',
      variance: '+12.9%',
      status: 'VERIFIED',
    },
    notes: 'Employment contracts comply with the Industrial Relations Code and Payment of Wages Act.',
  },
};

/**
 * Generates and downloads a high-fidelity, professional PDF report for a given report ID.
 */
export const downloadReportPdf = (reportId: string, period = 'September 2026') => {
  const data = REPORT_DATA_MAP[reportId] || REPORT_DATA_MAP['rep-1'];

  // Landscape A4: 297mm width, 210mm height
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 269mm

  // 1. BRAND HEADER
  // Company Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(113, 75, 103); // #714B67 Odoo Purple
  doc.text('PeoplePay360 Inc.', marginX, 16);

  // Subtitle & CIN
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text('Enterprise HR & Payroll Analytics • CIN: U12345MH2026PTC123456', marginX, 21);
  doc.text('Infinity Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051', marginX, 25);

  // Right Header: Report Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text(data.title.toUpperCase(), pageWidth - marginX, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Period: ${period} • Category: ${data.category}`, pageWidth - marginX, 21, { align: 'right' });

  // Status/Confidential Badge on right
  const badgeW = 32;
  const badgeH = 5.5;
  const badgeX = pageWidth - marginX - badgeW;
  const badgeY = 24;

  doc.setFillColor(243, 232, 255); // purple-100
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(107, 33, 168); // purple-800
  doc.text('OFFICIAL REPORT', badgeX + badgeW / 2, badgeY + 4, { align: 'center' });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(marginX, 32, pageWidth - marginX, 32);

  // 2. EXECUTIVE KPI CARDS (4 across 269mm)
  const kpiY = 36;
  const kpiH = 17;
  const kpiGap = 4;
  const kpiCount = data.kpis.length;
  const kpiW = (contentWidth - (kpiCount - 1) * kpiGap) / kpiCount;

  data.kpis.forEach((kpi, idx) => {
    const kX = marginX + idx * (kpiW + kpiGap);

    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(kX, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');

    // Accent top bar
    doc.setFillColor(113, 75, 103);
    doc.rect(kX, kpiY, kpiW, 1.2, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kX + 3.5, kpiY + 5.2);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, kX + 3.5, kpiY + 11);

    // Subtext
    if (kpi.subtext) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.subtext, kX + 3.5, kpiY + 14.8);
    }
  });

  // 3. TABULAR DATA
  const tableY = 58;
  let currentX = marginX;

  // Table Header Row
  doc.setFillColor(113, 75, 103); // #714B67 Brand purple
  doc.setDrawColor(113, 75, 103);
  doc.rect(marginX, tableY, contentWidth, 7.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  data.columns.forEach((col) => {
    const textX = col.align === 'right'
      ? currentX + col.widthMm - 3
      : col.align === 'center'
      ? currentX + col.widthMm / 2
      : currentX + 3;

    doc.text(col.header, textX, tableY + 5.2, { align: col.align || 'left' });
    currentX += col.widthMm;
  });

  // Table Data Rows
  let currentY = tableY + 7.5;
  const rowH = 6.2;

  data.rows.forEach((row, rowIdx) => {
    // Alternating row background
    const isEven = rowIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(241, 245, 249);
    doc.rect(marginX, currentY, contentWidth, rowH, 'FD');

    currentX = marginX;
    data.columns.forEach((col) => {
      const val = String(row[col.key] ?? '—');
      const textX = col.align === 'right'
        ? currentX + col.widthMm - 3
        : col.align === 'center'
        ? currentX + col.widthMm / 2
        : currentX + 3;

      // Special highlight for Status column
      if (col.key === 'status' || col.key === 'result') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        if (val.includes('PAID') || val.includes('SUCCESS') || val.includes('COMPLIANT') || val.includes('ACTIVE') || val.includes('SETTLED')) {
          doc.setTextColor(22, 101, 52); // green-800
        } else if (val.includes('LOP') || val.includes('REJECTED')) {
          doc.setTextColor(190, 18, 60); // rose-700
        } else {
          doc.setTextColor(71, 85, 105);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59); // slate-800
      }

      doc.text(val, textX, currentY + 4.3, { align: col.align || 'left' });
      currentX += col.widthMm;
    });

    currentY += rowH;
  });

  // 4. TOTAL / SUMMARY ROW
  if (data.totalRow) {
    const totalRowH = 7.5;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.rect(marginX, currentY, contentWidth, totalRowH, 'FD');

    currentX = marginX;
    data.columns.forEach((col) => {
      const val = String(data.totalRow![col.key] ?? '');
      const textX = col.align === 'right'
        ? currentX + col.widthMm - 3
        : col.align === 'center'
        ? currentX + col.widthMm / 2
        : currentX + 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(val, textX, currentY + 5.2, { align: col.align || 'left' });
      currentX += col.widthMm;
    });

    currentY += totalRowH;
  }

  // 5. OFFICIAL NOTES & COMPLIANCE SIGN-OFF
  const notesY = Math.max(currentY + 5, 155);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, notesY, contentWidth, 20, 1.5, 1.5, 'FD');

  // Left Note
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AUDIT & COMPLIANCE CERTIFICATION', marginX + 4, notesY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const noteLines = doc.splitTextToSize(
    data.notes || 'This statement is electronically generated from PeoplePay360 verified ledgers and conforms to Indian statutory compliance regulations.',
    contentWidth - 75
  );
  doc.text(noteLines, marginX + 4, notesY + 11);

  // Right Sign-off
  const sigX = pageWidth - marginX - 65;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DIGITALLY SIGNED & VERIFIED', sigX, notesY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PeoplePay360 Automated Payroll Gateway', sigX, notesY + 10);
  doc.text(`Timestamp: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, sigX, notesY + 14);

  // 6. BOTTOM FOOTER
  const footerY = 202;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('CONFIDENTIAL - FOR INTERNAL MANAGEMENT & STATUTORY AUDIT PURPOSES ONLY', marginX, footerY);
  doc.text('Page 1 of 1', pageWidth - marginX, footerY, { align: 'right' });

  // Save the PDF
  const cleanTitle = data.title.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanTitle}_${cleanPeriod}.pdf`;
  doc.save(filename);
  return filename;
};

/**
 * Downloads a comprehensive multi-page executive summary PDF covering all departments and modules.
 */
export const downloadExecutiveSummaryPdf = (period = 'September 2026') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // 1. BRAND HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(113, 75, 103);
  doc.text('PeoplePay360 Inc.', marginX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Executive Management Reporting Suite • CIN: U12345MH2026PTC123456', marginX, 25);
  doc.text('Level 4, Infinity Tower, BKC, Mumbai, Maharashtra 400051', marginX, 29);

  // Right Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE MASTER REPORT', pageWidth - marginX, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${period} • FY 2026-27`, pageWidth - marginX, 25, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  // 2. EXECUTIVE SUMMARY HIGHLIGHTS BANNER
  const bannerY = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, bannerY, contentWidth, 34, 2, 2, 'FD');

  doc.setFillColor(113, 75, 103);
  doc.rect(marginX, bannerY, contentWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE WORKFORCE & FINANCIAL SNAPSHOT', marginX + 6, bannerY + 8);

  const kpis = [
    { label: 'Total Headcount', val: '124 Staff', sub: 'Across 5 departments' },
    { label: 'Monthly Gross', val: 'Rs. 45.2 Lakhs', sub: 'Budget utilization: 94.2%' },
    { label: 'Net Take Home', val: 'Rs. 39.8 Lakhs', sub: 'Direct bank disbursements' },
    { label: 'Statutory Taxes', val: 'Rs. 5.4 Lakhs', sub: '100% PF/PT/TDS paid' },
  ];

  const colW = (contentWidth - 12) / 4;
  kpis.forEach((k, idx) => {
    const kX = marginX + 6 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label.toUpperCase(), kX, bannerY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(113, 75, 103);
    doc.text(k.val, kX, bannerY + 23);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(k.sub, kX, bannerY + 28);
  });

  // 3. DEPARTMENT COST DISTRIBUTION TABLE
  let curY = 82;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Departmental Compensation & Headcount Distribution', marginX, curY);

  curY += 5;
  const deptData = REPORT_DATA_MAP['rep-2'];
  
  // Table Header
  doc.setFillColor(113, 75, 103);
  doc.rect(marginX, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DEPARTMENT', marginX + 4, curY + 4.8);
  doc.text('HEADCOUNT', marginX + 55, curY + 4.8);
  doc.text('MONTHLY SPEND', marginX + 90, curY + 4.8);
  doc.text('AVG / EMPLOYEE', marginX + 130, curY + 4.8);
  doc.text('BUDGET %', marginX + 165, curY + 4.8);

  curY += 7;
  deptData.rows.forEach((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(marginX, curY, contentWidth, 6.2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(String(row.dept), marginX + 4, curY + 4.3);
    doc.text(String(row.headcount), marginX + 55, curY + 4.3);
    doc.text(String(row.spend), marginX + 90, curY + 4.3);
    doc.text(String(row.avg), marginX + 130, curY + 4.3);
    doc.text(String(row.share), marginX + 165, curY + 4.3);

    curY += 6.2;
  });

  // Dept Totals Row
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL / ORGANIZATIONAL', marginX + 4, curY + 4.8);
  doc.text('124 Staff', marginX + 55, curY + 4.8);
  doc.text('Rs. 45,20,000', marginX + 90, curY + 4.8);
  doc.text('Rs. 36,451', marginX + 130, curY + 4.8);
  doc.text('100.0%', marginX + 165, curY + 4.8);

  curY += 15;

  // 4. STATUTORY AUDIT & COMPLIANCE SUMMARY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Statutory Compliance & Remittance Overview', marginX, curY);

  curY += 5;
  const statData = REPORT_DATA_MAP['rep-4'];

  doc.setFillColor(71, 85, 105);
  doc.rect(marginX, curY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('STATUTORY OBLIGATION', marginX + 4, curY + 4.8);
  doc.text('CHALLAN REF', marginX + 75, curY + 4.8);
  doc.text('TOTAL REMITTED', marginX + 120, curY + 4.8);
  doc.text('STATUS', marginX + 160, curY + 4.8);

  curY += 7;
  statData.rows.forEach((row, sIdx) => {
    const isEven = sIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(marginX, curY, contentWidth, 6.2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(String(row.component).substring(0, 36), marginX + 4, curY + 4.3);
    doc.text(String(row.challan), marginX + 75, curY + 4.3);
    doc.text(String(row.total), marginX + 120, curY + 4.3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52);
    doc.text(String(row.status), marginX + 160, curY + 4.3);

    curY += 6.2;
  });

  // 5. SIGN OFF FOOTER
  curY = Math.max(curY + 10, 245);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, curY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE CERTIFICATION', marginX + 5, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Certified that all employee compensations, tax deductions at source (TDS), and provident fund contributions', marginX + 5, curY + 11);
  doc.text('for this period have been computed in compliance with Indian Labor and Taxation laws.', marginX + 5, curY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 75, 103);
  doc.text('PeoplePay360 Inc. Payroll Oversight Committee', pageWidth - marginX - 5, curY + 15, { align: 'right' });

  // Page numbering
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL - FOR BOARD OF DIRECTORS & AUDIT COMMITTEES ONLY', marginX, 285);
  doc.text('Page 1 of 1', pageWidth - marginX, 285, { align: 'right' });

  const filename = `Executive_Master_Report_${period.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
};

/**
 * Returns a base64 encoded PDF string and filename for a specific report module.
 */
export const getReportPdfBase64 = (reportId: string, period = 'September 2026'): { base64: string; filename: string } => {
  const data = REPORT_DATA_MAP[reportId] || REPORT_DATA_MAP['rep-1'];
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(113, 75, 103);
  doc.text('PeoplePay360 Inc.', marginX, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Enterprise HR & Payroll Analytics • CIN: U12345MH2026PTC123456', marginX, 21);
  doc.text('Infinity Tower, Bandra Kurla Complex, Mumbai, Maharashtra 400051', marginX, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(data.title.toUpperCase(), pageWidth - marginX, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Period: ${period} • Category: ${data.category}`, pageWidth - marginX, 21, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, 32, pageWidth - marginX, 32);

  // KPIs
  const kpiY = 36;
  const kpiH = 17;
  const kpiGap = 4;
  const kpiCount = data.kpis.length;
  const kpiW = (contentWidth - (kpiCount - 1) * kpiGap) / kpiCount;

  data.kpis.forEach((kpi, idx) => {
    const kX = marginX + idx * (kpiW + kpiGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kX, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');
    doc.setFillColor(113, 75, 103);
    doc.rect(kX, kpiY, kpiW, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kX + 3.5, kpiY + 5.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, kX + 3.5, kpiY + 11);
    if (kpi.subtext) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.subtext, kX + 3.5, kpiY + 14.8);
    }
  });

  // Table
  const tableY = 58;
  let currentX = marginX;
  doc.setFillColor(113, 75, 103);
  doc.setDrawColor(113, 75, 103);
  doc.rect(marginX, tableY, contentWidth, 7.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  data.columns.forEach((col) => {
    const textX = col.align === 'right'
      ? currentX + col.widthMm - 3
      : col.align === 'center'
      ? currentX + col.widthMm / 2
      : currentX + 3;
    doc.text(col.header, textX, tableY + 5.2, { align: col.align || 'left' });
    currentX += col.widthMm;
  });

  let currentY = tableY + 7.5;
  const rowH = 6.2;
  data.rows.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(241, 245, 249);
    doc.rect(marginX, currentY, contentWidth, rowH, 'FD');
    currentX = marginX;
    data.columns.forEach((col) => {
      const val = String(row[col.key] ?? '—');
      const textX = col.align === 'right'
        ? currentX + col.widthMm - 3
        : col.align === 'center'
        ? currentX + col.widthMm / 2
        : currentX + 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(val, textX, currentY + 4.3, { align: col.align || 'left' });
      currentX += col.widthMm;
    });
    currentY += rowH;
  });

  if (data.totalRow) {
    const totalRowH = 7.5;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(marginX, currentY, contentWidth, totalRowH, 'FD');
    currentX = marginX;
    data.columns.forEach((col) => {
      const val = String(data.totalRow![col.key] ?? '');
      const textX = col.align === 'right'
        ? currentX + col.widthMm - 3
        : col.align === 'center'
        ? currentX + col.widthMm / 2
        : currentX + 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(val, textX, currentY + 5.2, { align: col.align || 'left' });
      currentX += col.widthMm;
    });
    currentY += totalRowH;
  }

  // Footer notes
  const notesY = Math.max(currentY + 5, 155);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, notesY, contentWidth, 20, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('AUDIT & COMPLIANCE CERTIFICATION', marginX + 4, notesY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('This statement is electronically generated from PeoplePay360 verified ledgers.', marginX + 4, notesY + 11);

  const cleanTitle = data.title.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${cleanTitle}_${cleanPeriod}.pdf`;

  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';

  return { base64, filename };
};

/**
 * Returns a base64 encoded PDF string and filename for the executive summary report.
 */
export const getExecutiveReportPdfBase64 = (period = 'September 2026'): { base64: string; filename: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(113, 75, 103);
  doc.text('PeoplePay360 Inc.', marginX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Executive Management Reporting Suite • CIN: U12345MH2026PTC123456', marginX, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE MASTER REPORT', pageWidth - marginX, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Period: ${period} • FY 2026-27`, pageWidth - marginX, 25, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  // Snapshot
  const bannerY = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, bannerY, contentWidth, 34, 2, 2, 'FD');
  doc.setFillColor(113, 75, 103);
  doc.rect(marginX, bannerY, contentWidth, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE WORKFORCE & FINANCIAL SNAPSHOT', marginX + 6, bannerY + 8);

  const kpis = [
    { label: 'Total Headcount', val: '124 Staff', sub: 'Across 5 departments' },
    { label: 'Monthly Gross', val: 'Rs. 45.2 Lakhs', sub: 'Budget utilization: 94.2%' },
    { label: 'Net Take Home', val: 'Rs. 39.8 Lakhs', sub: 'Direct bank disbursements' },
    { label: 'Statutory Taxes', val: 'Rs. 5.4 Lakhs', sub: '100% PF/PT/TDS paid' },
  ];

  const colW = (contentWidth - 12) / 4;
  kpis.forEach((k, idx) => {
    const kX = marginX + 6 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label.toUpperCase(), kX, bannerY + 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(113, 75, 103);
    doc.text(k.val, kX, bannerY + 23);
  });

  const filename = `Executive_Master_Report_${period.replace(/\s+/g, '_')}.pdf`;
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';

  return { base64, filename };
};

