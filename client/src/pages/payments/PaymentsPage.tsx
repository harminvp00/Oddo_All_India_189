import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  Banknote,
  Search,
  Download,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Building2,
  FileCheck,
  Send,
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  employee: string;
  employeeCode: string;
  payslipId: string;
  amount: number;
  date: string;
  method: 'NEFT / RTGS' | 'IMPS' | 'Cheque' | 'Cash';
  bankName: string;
  accountMasked: string;
  ref: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED';
}

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    employee: 'Rahul Sharma',
    employeeCode: 'EMP-001',
    payslipId: 'PS-SEP-001',
    amount: 161200,
    date: '2026-09-30',
    method: 'NEFT / RTGS',
    bankName: 'HDFC Bank',
    accountMasked: '•••• 4921',
    ref: 'UTR-HDFC9876543210',
    status: 'COMPLETED',
  },
  {
    id: 'pay-2',
    employee: 'Amit Patel',
    employeeCode: 'EMP-002',
    payslipId: 'PS-SEP-002',
    amount: 122500,
    date: '2026-09-30',
    method: 'NEFT / RTGS',
    bankName: 'ICICI Bank',
    accountMasked: '•••• 8832',
    ref: 'UTR-ICIC9876543211',
    status: 'COMPLETED',
  },
  {
    id: 'pay-3',
    employee: 'Neha Shah',
    employeeCode: 'EMP-003',
    payslipId: 'PS-SEP-003',
    amount: 83100,
    date: '2026-09-30',
    method: 'IMPS',
    bankName: 'State Bank of India',
    accountMasked: '•••• 1094',
    ref: 'UTR-SBIN9876543212',
    status: 'PROCESSING',
  },
  {
    id: 'pay-4',
    employee: 'Priya Mehta',
    employeeCode: 'EMP-004',
    payslipId: 'PS-SEP-004',
    amount: 110100,
    date: '-',
    method: 'NEFT / RTGS',
    bankName: 'Axis Bank',
    accountMasked: '•••• 7712',
    ref: 'PENDING-DISBURSEMENT',
    status: 'PENDING',
  },
  {
    id: 'pay-5',
    employee: 'Sunil Verma',
    employeeCode: 'EMP-006',
    payslipId: 'PS-SEP-006',
    amount: 74800,
    date: '2026-09-30',
    method: 'Cheque',
    bankName: 'Manual Cheque',
    accountMasked: 'CHQ-882103',
    ref: 'CHQ-882103',
    status: 'COMPLETED',
  },
];

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const filteredData = payments.filter((p) => {
    const matchesSearch =
      p.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ref.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcessAllPending = () => {
    setIsProcessingBatch(true);
    setTimeout(() => {
      setPayments((prev) =>
        prev.map((p) =>
          p.status === 'PENDING'
            ? {
                ...p,
                status: 'COMPLETED',
                date: '2026-09-30',
                ref: `UTR-AUTO-${Math.floor(10000000 + Math.random() * 90000000)}`,
              }
            : p
        )
      );
      setIsProcessingBatch(false);
    }, 1000);
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">PAID & CLEARED</Badge>;
      case 'PROCESSING':
        return <Badge variant="teal">IN TRANSIT</Badge>;
      case 'PENDING':
        return <Badge variant="warning">PENDING</Badge>;
      case 'FAILED':
        return <Badge variant="danger">FAILED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((acc, p) => acc + p.amount, 0);

  const columns: Column<PaymentRecord>[] = [
    {
      header: 'Employee & Code',
      accessor: 'employee',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
            {item.employee.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{item.employee}</div>
            <div className="text-xs text-slate-400">
              {item.employeeCode} • {item.payslipId}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Disbursed Amount',
      accessor: 'amount',
      render: (item) => (
        <span className="font-black text-slate-900 text-sm">
          ₹{item.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      header: 'Disbursement Method',
      accessor: 'method',
      render: (item) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{item.method}</div>
          <div className="text-[11px] text-slate-400">
            {item.bankName} ({item.accountMasked})
          </div>
        </div>
      ),
    },
    {
      header: 'Payment Reference (UTR / Txn)',
      accessor: 'ref',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
          {item.ref}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status === 'PENDING' ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => {
                setPayments((prev) =>
                  prev.map((p) =>
                    p.id === item.id
                      ? {
                          ...p,
                          status: 'COMPLETED',
                          date: '2026-09-30',
                          ref: `UTR-${Math.floor(100000000 + Math.random() * 900000000)}`,
                        }
                      : p
                  )
                );
              }}
            >
              Disburse Now
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPayment(item)}
              title="View Remittance Details"
            >
              <Download className="w-4 h-4 text-slate-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Payroll Payments & Disbursements"
        description="Monitor corporate bank disbursements, UTR reference tracking, and batch salary transfers."
        icon={<Banknote className="w-6 h-6 text-[#714B67]" />}
        action={
          <Button
            variant="primary"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={handleProcessAllPending}
            isLoading={isProcessingBatch}
          >
            Process All Pending
          </Button>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">
              ₹{(totalPaid / 100000).toFixed(2)}L
            </div>
            <div className="text-xs text-slate-500 font-medium">Cleared & Disbursed</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">
              ₹{(totalPending / 100000).toFixed(2)}L
            </div>
            <div className="text-xs text-slate-500 font-medium">Pending Queue</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">HDFC Corporate</div>
            <div className="text-xs text-slate-500 font-medium">Primary Payout Gateway</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">100% Match</div>
            <div className="text-xs text-slate-500 font-medium">Bank Reconciliation</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Search by employee, code, or UTR number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Processing', value: 'PROCESSING' },
              { label: 'Pending', value: 'PENDING' },
            ]}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table
          columns={columns as any}
          data={filteredData}
          keyExtractor={(item) => item.id}
          emptyMessage="No payment records found."
        />
      </div>

      {/* Remittance Detail Modal */}
      {selectedPayment && (
        <Modal
          isOpen={Boolean(selectedPayment)}
          onClose={() => setSelectedPayment(null)}
          title={`Payment Remittance: ${selectedPayment.ref}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Disbursed Amount</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{selectedPayment.amount.toLocaleString('en-IN')}
                </div>
              </div>
              <div>{getStatusBadge(selectedPayment.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400">Beneficiary Name</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedPayment.employee}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400">Employee ID</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedPayment.employeeCode}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400">Bank & Account</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedPayment.bankName} ({selectedPayment.accountMasked})
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400">Transaction Date</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedPayment.date}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 col-span-2">
                <span className="text-slate-400">Bank UTR Reference Number</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedPayment.ref}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => alert('Downloading official Bank Remittance Advice...')}
              >
                Download Remittance Advice
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentsPage;
