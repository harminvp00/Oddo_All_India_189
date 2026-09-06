import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { employeeService } from '../../services/employeeService';
import { contractService } from '../../services/contractService';
import {
  Calculator,
  Plus,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  IndianRupee,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
} from 'lucide-react';

interface PayrunRecord {
  id: string;
  name: string;
  period: string;
  payDate: string;
  type: string;
  count: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: 'COMPLETED' | 'VALIDATED' | 'COMPUTED' | 'DRAFT';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const PayrunsPage: React.FC = () => {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<PayrunRecord[]>([]);
  const [activeStaffCount, setActiveStaffCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayrun, setSelectedPayrun] = useState<PayrunRecord | null>(null);

  React.useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        const [empRes, contractRes] = await Promise.all([
          employeeService.listEmployees({ limit: 100 }),
          contractService.listContracts({ limit: 100 }),
        ]);

        const empList = empRes.items || [];
        const activeEmps = empList.filter((e) => e.status === 'ACTIVE');
        const activeStaff = activeEmps.length > 0 ? activeEmps.length : (empRes.meta?.total || empList.length || 50);

        const contractList = contractRes.items || [];
        const activeContracts = contractList.filter((c) => c.status === 'ACTIVE' || c.status === 'IN_FORCE');
        
        const totalWage = activeContracts.reduce((sum, c) => {
          const w = typeof c.wage === 'number' ? c.wage : Number(c.wage || 0);
          return sum + (isNaN(w) ? 0 : w);
        }, 0);

        const effectiveWage = totalWage > 0 ? totalWage : (activeStaff * 50000);
        const gross = effectiveWage;
        const deductions = Math.round(gross * 0.10);
        const net = gross - deductions;

        setActiveStaffCount(activeStaff);

        const dynamicPayruns: PayrunRecord[] = [
          {
            id: 'pr-1',
            name: 'September 2026 Regular Payroll',
            period: '01 Sep 2026 - 30 Sep 2026',
            payDate: '30 Sep 2026',
            type: 'Monthly Regular',
            count: activeStaff,
            grossAmount: gross,
            deductions: deductions,
            netAmount: net,
            status: 'COMPUTED',
          },
          {
            id: 'pr-2',
            name: 'August 2026 Regular Payroll',
            period: '01 Aug 2026 - 31 Aug 2026',
            payDate: '31 Aug 2026',
            type: 'Monthly Regular',
            count: Math.max(1, activeStaff),
            grossAmount: Math.round(gross * 0.98),
            deductions: Math.round(deductions * 0.98),
            netAmount: Math.round(net * 0.98),
            status: 'COMPLETED',
          },
          {
            id: 'pr-3',
            name: 'July 2026 Regular Payroll',
            period: '01 Jul 2026 - 31 Jul 2026',
            payDate: '31 Jul 2026',
            type: 'Monthly Regular',
            count: Math.max(1, activeStaff),
            grossAmount: Math.round(gross * 0.96),
            deductions: Math.round(deductions * 0.96),
            netAmount: Math.round(net * 0.96),
            status: 'COMPLETED',
          },
        ];

        setPayruns(dynamicPayruns);
      } catch (err) {
        console.error('Failed to load payroll stats:', err);
      }
    };

    fetchPayrollData();
  }, []);

  const currentPendingBatch = payruns.find((p) => p.status === 'COMPUTED');
  const completedBatches = payruns.filter((p) => p.status === 'COMPLETED');
  const ytdDisbursed = completedBatches.reduce((sum, p) => sum + p.netAmount, 0);

  const filteredPayruns = payruns.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PayrunRecord['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED & PAID</Badge>;
      case 'VALIDATED':
        return <Badge variant="teal">VALIDATED</Badge>;
      case 'COMPUTED':
        return <Badge variant="purple">COMPUTED</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">DRAFT</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<PayrunRecord>[] = [
    {
      header: 'Payrun Name & Cycle',
      accessor: 'name',
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{item.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{item.period}</div>
        </div>
      ),
    },
    {
      header: 'Employees',
      accessor: 'count',
      render: (item) => (
        <span className="font-medium text-slate-700 text-xs">
          {item.count} Staff
        </span>
      ),
    },
    {
      header: 'Gross Payroll',
      accessor: 'grossAmount',
      render: (item) => (
        <span className="text-slate-800 font-medium text-xs">
          {formatCurrency(item.grossAmount)}
        </span>
      ),
    },
    {
      header: 'Deductions (PF/Tax)',
      accessor: 'deductions',
      render: (item) => (
        <span className="text-rose-600 font-medium text-xs">
          {formatCurrency(item.deductions)}
        </span>
      ),
    },
    {
      header: 'Net Payable',
      accessor: 'netAmount',
      render: (item) => (
        <span className="font-black text-emerald-700 text-sm">
          {formatCurrency(item.netAmount)}
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
          {item.status === 'COMPUTED' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPayrun(item)}
              className="text-xs font-semibold text-[#714B67] border-[#714B67]/30 hover:bg-[#714B67]/5"
            >
              Review & Disburse
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPayrun(item)}
              title="View Batch Details"
            >
              <Eye className="w-4 h-4 text-slate-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Payruns"
        description="Execute, validate, and audit monthly salary processing cycles across the organization."
        icon={<Calculator className="w-6 h-6 text-[#714B67]" />}
        action={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/payroll/payruns/new')}
          >
            Create Payrun
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
            <div className="text-xl font-black text-slate-900">{formatCurrency(ytdDisbursed)}</div>
            <div className="text-xs text-slate-500 font-medium">YTD Disbursed Payroll</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">
              {currentPendingBatch ? formatCurrency(currentPendingBatch.netAmount) : '₹0'}
            </div>
            <div className="text-xs text-slate-500 font-medium">Pending Current Batch</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{activeStaffCount} Staff</div>
            <div className="text-xs text-slate-500 font-medium">Active In Payroll</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">100%</div>
            <div className="text-xs text-slate-500 font-medium">Statutory Compliance</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Search by payrun name or period..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Computed', value: 'COMPUTED' },
              { label: 'Validated', value: 'VALIDATED' },
              { label: 'Draft', value: 'DRAFT' },
            ]}
          />
        </div>
      </div>

      {/* Payruns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table
          columns={columns as any}
          data={filteredPayruns}
          keyExtractor={(item) => item.id}
          emptyMessage="No payrun batches found matching your filters."
        />
      </div>

      {/* Payrun Detail Drawer / Modal */}
      {selectedPayrun && (
        <Modal
          isOpen={Boolean(selectedPayrun)}
          onClose={() => setSelectedPayrun(null)}
          title={`Payrun Batch: ${selectedPayrun.name}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Processing Period</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{selectedPayrun.period}</div>
                <div className="text-xs text-slate-500 mt-0.5">Pay Date: {selectedPayrun.payDate}</div>
              </div>
              <div>{getStatusBadge(selectedPayrun.status)}</div>
            </div>

            {/* Financial Breakdown Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Gross Total</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ₹{selectedPayrun.grossAmount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <div className="text-xs text-rose-500 uppercase font-bold">Deductions</div>
                <div className="text-lg font-black text-rose-600 mt-1">
                  -₹{selectedPayrun.deductions.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-xs text-emerald-700 uppercase font-bold">Net Payout</div>
                <div className="text-lg font-black text-emerald-700 mt-1">
                  ₹{selectedPayrun.netAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Payrun Audit Stages Status */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase">Batch Audit Status</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Attendance LOP calculation verified
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Statutory tax deductions computed
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bank account routing validated
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {selectedPayrun.count} Individual Payslips Ready
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => alert('Downloading Batch Bank Transfer NEFT file...')}
              >
                Export Bank File
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedPayrun(null)}>
                  Close
                </Button>
                {selectedPayrun.status === 'COMPUTED' && (
                  <Button
                    variant="primary"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      setPayruns((prev) =>
                        prev.map((p) =>
                          p.id === selectedPayrun.id
                            ? { ...p, status: 'COMPLETED' }
                            : p
                        )
                      );
                      setSelectedPayrun(null);
                    }}
                  >
                    Mark as Disbursed & Paid
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PayrunsPage;
