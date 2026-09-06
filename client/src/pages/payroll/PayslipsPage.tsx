import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import {
  FileSpreadsheet,
  Search,
  Download,
  Eye,
  Printer,
  Mail,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  ShieldCheck,
  Loader2,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  downloadPayslipPdf,
  downloadAllPayslipsPdf,
  getPayslipPdfBase64,
} from '../../utils/payslipPdf';
import { emailService } from '../../services/emailService';

interface MockPayslip {
  id: string;
  employeeName: string;
  employeeCode: string;
  email: string;
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

const INITIAL_PAYSLIPS: MockPayslip[] = [
  {
    id: 'ps-1',
    employeeName: 'Rahul Sharma',
    employeeCode: 'EMP-001',
    email: 'rahul.sharma@example.com',
    department: 'Engineering',
    position: 'Lead Architect',
    panNumber: 'ABCDE1234F',
    bankAccount: 'HDFC •••• 4921',
    period: 'September 2026',
    payDate: '30 Sep 2026',
    basic: 92500,
    hra: 46250,
    specialAllowance: 36250,
    transport: 10000,
    pfDeduction: 11100,
    taxDeduction: 12500,
    profTax: 200,
    lopDeduction: 0,
    gross: 185000,
    totalDeductions: 23800,
    net: 161200,
    status: 'PAID',
  },
  {
    id: 'ps-2',
    employeeName: 'Amit Patel',
    employeeCode: 'EMP-002',
    email: 'amit.patel@example.com',
    department: 'Engineering',
    position: 'Senior Backend Engineer',
    panNumber: 'FGHIJ5678K',
    bankAccount: 'ICICI •••• 8832',
    period: 'September 2026',
    payDate: '30 Sep 2026',
    basic: 70000,
    hra: 35000,
    specialAllowance: 27000,
    transport: 8000,
    pfDeduction: 8400,
    taxDeduction: 8900,
    profTax: 200,
    lopDeduction: 0,
    gross: 140000,
    totalDeductions: 17500,
    net: 122500,
    status: 'PAID',
  },
  {
    id: 'ps-3',
    employeeName: 'Neha Shah',
    employeeCode: 'EMP-003',
    email: 'neha.shah@example.com',
    department: 'Human Resources',
    position: 'HR Operations Lead',
    panNumber: 'KLMNO9012P',
    bankAccount: 'SBI •••• 1094',
    period: 'September 2026',
    payDate: '30 Sep 2026',
    basic: 47500,
    hra: 23750,
    specialAllowance: 18750,
    transport: 5000,
    pfDeduction: 5700,
    taxDeduction: 4500,
    profTax: 200,
    lopDeduction: 1500,
    gross: 95000,
    totalDeductions: 11900,
    net: 83100,
    status: 'PAID',
  },
  {
    id: 'ps-4',
    employeeName: 'Priya Mehta',
    employeeCode: 'EMP-004',
    email: 'priya.mehta@example.com',
    department: 'Finance',
    position: 'Financial Controller',
    panNumber: 'PQRST3456U',
    bankAccount: 'Axis •••• 7712',
    period: 'September 2026',
    payDate: '30 Sep 2026',
    basic: 62500,
    hra: 31250,
    specialAllowance: 23250,
    transport: 8000,
    pfDeduction: 7500,
    taxDeduction: 7200,
    profTax: 200,
    lopDeduction: 0,
    gross: 125000,
    totalDeductions: 14900,
    net: 110100,
    status: 'PENDING',
  },
];

export const PayslipsPage: React.FC = () => {
  const [payslips] = useState<MockPayslip[]>(INITIAL_PAYSLIPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [selectedPayslip, setSelectedPayslip] = useState<MockPayslip | null>(null);

  // Email state
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTargetPayslip, setEmailTargetPayslip] = useState<MockPayslip | null>(null);
  const [customEmailRecipient, setCustomEmailRecipient] = useState('');
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkEmailConfirmOpen, setBulkEmailConfirmOpen] = useState(false);
  const [bulkOverrideEmail, setBulkOverrideEmail] = useState('');

  const filteredData = payslips.filter((ps) => {
    const matchesSearch =
      ps.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ps.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ps.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      departmentFilter === 'ALL' || ps.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenEmailModal = (item: MockPayslip) => {
    setEmailTargetPayslip(item);
    setCustomEmailRecipient(item.email || 'employee@peoplepay360.com');
  };

  const handleSendSingleEmail = async () => {
    if (!emailTargetPayslip) return;
    const recipient = customEmailRecipient.trim() || emailTargetPayslip.email;
    if (!recipient) {
      setEmailStatusMsg({ type: 'danger', text: 'Please provide a valid recipient email address.' });
      return;
    }

    try {
      setIsSendingEmail(true);
      setEmailStatusMsg(null);

      // Generate the PDF document base64
      const base64 = getPayslipPdfBase64(emailTargetPayslip);
      const filename = `${emailTargetPayslip.employeeName.replace(/\s+/g, '_')}_Payslip_${emailTargetPayslip.period.replace(/\s+/g, '_')}.pdf`;

      await emailService.sendPayslipEmail({
        to: recipient,
        employeeName: emailTargetPayslip.employeeName,
        periodStart: emailTargetPayslip.period,
        pdfBase64: base64,
        filename,
        subject: `Salary Statement for ${emailTargetPayslip.period} - ${emailTargetPayslip.employeeName}`,
      });

      setEmailStatusMsg({
        type: 'success',
        text: `Official payslip PDF successfully emailed to ${emailTargetPayslip.employeeName} (${recipient})!`,
      });
      setEmailTargetPayslip(null);
    } catch (err: any) {
      console.error('Failed to send payslip email:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to dispatch email';
      setEmailStatusMsg({
        type: 'danger',
        text: `Failed to email payslip: ${msg}`,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendBulkEmails = async () => {
    if (!filteredData.length) return;

    try {
      setIsBulkSending(true);
      setEmailStatusMsg(null);

      const items = filteredData.map((ps) => {
        const to = bulkOverrideEmail.trim() ? bulkOverrideEmail.trim() : ps.email;
        const base64 = getPayslipPdfBase64(ps);
        const filename = `${ps.employeeName.replace(/\s+/g, '_')}_Payslip_${ps.period.replace(/\s+/g, '_')}.pdf`;
        return {
          to,
          employeeName: ps.employeeName,
          periodStart: ps.period,
          pdfBase64: base64,
          filename,
          subject: `Salary Statement for ${ps.period} - ${ps.employeeName}`,
        };
      });

      const res = await emailService.sendBulkPayslipEmails(items);
      const resultData = (res as any)?.data?.data || (res as any)?.data || {};
      const sentCount = resultData.sentCount ?? items.length;
      const failedCount = resultData.failedCount ?? 0;

      setEmailStatusMsg({
        type: 'success',
        text: `Batch processing complete: Successfully emailed ${sentCount} employee payslip(s) with PDF attachment!${
          failedCount > 0 ? ` (${failedCount} failed)` : ''
        }`,
      });
      setBulkEmailConfirmOpen(false);
    } catch (err: any) {
      console.error('Failed bulk email send:', err);
      const msg = err.response?.data?.error || err.message || 'Bulk dispatch failed';
      setEmailStatusMsg({
        type: 'danger',
        text: `Failed to send bulk payslip emails: ${msg}`,
      });
    } finally {
      setIsBulkSending(false);
    }
  };

  const columns: Column<MockPayslip>[] = [
    {
      header: 'Employee',
      accessor: 'employeeName',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            {item.employeeName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{item.employeeName}</div>
            <div className="text-xs text-slate-400">
              {item.employeeCode} • {item.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Period',
      accessor: 'period',
      render: (item) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{item.period}</div>
          <div className="text-[10px] text-slate-400">Pay Date: {item.payDate}</div>
        </div>
      ),
    },
    {
      header: 'Gross Earnings',
      accessor: 'gross',
      render: (item) => (
        <span className="font-medium text-slate-800 text-xs">
          ₹{item.gross.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Total Deductions',
      accessor: 'totalDeductions',
      render: (item) => (
        <span className="font-medium text-rose-600 text-xs">
          -₹{item.totalDeductions.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Net Salary Payable',
      accessor: 'net',
      render: (item) => (
        <span className="font-black text-emerald-700 text-sm">
          ₹{item.net.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => (
        <Badge variant={item.status === 'PAID' ? 'success' : 'warning'}>
          {item.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPayslip(item)}
            title="View Salary Statement"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEmailModal(item)}
            title="Email Payslip PDF to Employee"
            className="p-1.5 hover:bg-purple-50 text-[#714B67] hover:text-[#53344d] rounded-lg"
          >
            <Mail className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadPayslipPdf(item)}
            title="Download PDF"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Payslips & Salary Statements"
        description="Generate, verify, and dispatch monthly salary statements directly to employee emails with statutory PDF attachments."
        icon={<FileSpreadsheet className="w-6 h-6 text-[#714B67]" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => downloadAllPayslipsPdf(filteredData)}
            >
              Export PDFs
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={() => setBulkEmailConfirmOpen(true)}
            >
              Email All Payslips
            </Button>
          </div>
        }
      />

      {/* Email Notification Alert */}
      {emailStatusMsg && (
        <Alert
          variant={emailStatusMsg.type}
          title={emailStatusMsg.type === 'success' ? 'Email Sent Successfully' : 'Email Dispatch Failed'}
          onClose={() => setEmailStatusMsg(null)}
        >
          <div className="flex items-center gap-2">
            {emailStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{emailStatusMsg.text}</span>
          </div>
        </Alert>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{payslips.length} Statements</div>
            <div className="text-xs text-slate-500 font-medium">Generated for Sep 2026</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">3 Disbursed</div>
            <div className="text-xs text-slate-500 font-medium">Bank Transfer Confirmed</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">1 Pending</div>
            <div className="text-xs text-slate-500 font-medium">Awaiting Batch Approval</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">₹1,19,225</div>
            <div className="text-xs text-slate-500 font-medium">Average Net Salary</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Search by employee name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={[
              { label: 'All Departments', value: 'ALL' },
              { label: 'Engineering', value: 'Engineering' },
              { label: 'Human Resources', value: 'Human Resources' },
              { label: 'Finance', value: 'Finance' },
            ]}
          />
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table
          columns={columns as any}
          data={filteredData}
          keyExtractor={(item) => item.id}
          emptyMessage="No payslips found matching your filters."
        />
      </div>

      {/* Financial Statement Modal (Formal Payslip) */}
      {selectedPayslip && (
        <Modal
          isOpen={Boolean(selectedPayslip)}
          onClose={() => setSelectedPayslip(null)}
          title="Official Salary Statement"
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Header Document Block */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#714B67] text-white flex items-center justify-center font-bold text-sm">
                    P360
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-base">PeoplePay360 Inc.</div>
                    <div className="text-[11px] text-slate-400">CIN: U12345MH2026PTC123456 • Level 4, Infinity Tower, BKC, Mumbai</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={selectedPayslip.status === 'PAID' ? 'success' : 'warning'}>
                    {selectedPayslip.status}
                  </Badge>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">PAYSLIP #{selectedPayslip.id.toUpperCase()}</div>
                </div>
              </div>

              {/* Employee Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Employee Name:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.employeeName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Employee ID:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.employeeCode}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Designation:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.position}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Department:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.department}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Pay Period:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.period}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Payment Date:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.payDate}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Bank Account:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.bankAccount}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">PAN Number:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedPayslip.panNumber}</div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-2.5 font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                    <span>EARNINGS & ALLOWANCES</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 space-y-1">
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Basic Salary</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.basic.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.hra.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Special Allowance</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.specialAllowance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Transport Allowance</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.transport.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-2 pt-3 font-bold text-slate-900 border-t border-slate-200">
                      <span>Total Gross Earnings</span>
                      <span>₹{selectedPayslip.gross.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-2.5 font-bold text-rose-800 border-b border-slate-200 flex justify-between">
                    <span>STATUTORY & OTHER DEDUCTIONS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 space-y-1">
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Provident Fund (PF - 12%)</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.pfDeduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Income Tax (TDS)</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.taxDeduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Professional Tax (PT)</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.profTax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Loss of Pay (LOP)</span>
                      <span className="font-medium text-slate-900">₹{selectedPayslip.lopDeduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-2 pt-3 font-bold text-rose-700 border-t border-slate-200">
                      <span>Total Deductions</span>
                      <span>-₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-800 font-bold uppercase">NET DISBURSEMENT PAYABLE</div>
                  <div className="text-2xl font-black text-emerald-900 mt-0.5">
                    ₹{selectedPayslip.net.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Digitally Verified Statement
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Mail className="w-4 h-4" />}
                  onClick={() => handleOpenEmailModal(selectedPayslip)}
                >
                  Email Employee
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedPayslip(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => downloadPayslipPdf(selectedPayslip)}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Single Payslip Email Modal */}
      {emailTargetPayslip && (
        <Modal
          isOpen={Boolean(emailTargetPayslip)}
          onClose={() => !isSendingEmail && setEmailTargetPayslip(null)}
          title={`Email Payslip: ${emailTargetPayslip.employeeName}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-900">{emailTargetPayslip.employeeName} ({emailTargetPayslip.employeeCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pay Period:</span>
                <span className="font-semibold text-slate-800">{emailTargetPayslip.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Salary:</span>
                <span className="font-bold text-emerald-700">₹{emailTargetPayslip.net.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attachment:</span>
                <span className="font-mono text-purple-700">{emailTargetPayslip.employeeName.replace(/\s+/g, '_')}_Payslip_{emailTargetPayslip.period.replace(/\s+/g, '_')}.pdf</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Email Address
              </label>
              <Input
                type="email"
                placeholder="employee@example.com"
                value={customEmailRecipient}
                onChange={(e) => setCustomEmailRecipient(e.target.value)}
                disabled={isSendingEmail}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The employee will receive an official email from PeoplePay360 with their complete PDF payslip attached.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setEmailTargetPayslip(null)}
                disabled={isSendingEmail}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                onClick={handleSendSingleEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? 'Sending Email...' : 'Send Payslip Email'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Payslips Email Modal */}
      {bulkEmailConfirmOpen && (
        <Modal
          isOpen={bulkEmailConfirmOpen}
          onClose={() => !isBulkSending && setBulkEmailConfirmOpen(false)}
          title="Email Payslips in Batch"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-purple-50/70 border border-[#714B67]/20 rounded-xl text-xs space-y-2">
              <div className="font-bold text-[#714B67] text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" /> Ready to Dispatch {filteredData.length} Payslips
              </div>
              <p className="text-slate-600 leading-relaxed">
                This will automatically generate individual, signed PDF salary statements for all <strong>{filteredData.length}</strong> employees listed in current view and deliver them via SMTP.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Override Recipient (for Testing)
              </label>
              <Input
                type="email"
                placeholder="Leave blank to send to each employee's email"
                value={bulkOverrideEmail}
                onChange={(e) => setBulkOverrideEmail(e.target.value)}
                disabled={isBulkSending}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave empty to send each employee their respective statement, or provide a single testing email to receive all copies.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setBulkEmailConfirmOpen(false)}
                disabled={isBulkSending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={isBulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                onClick={handleSendBulkEmails}
                disabled={isBulkSending}
              >
                {isBulkSending ? 'Dispatching Batch...' : `Send ${filteredData.length} Emails`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PayslipsPage;
