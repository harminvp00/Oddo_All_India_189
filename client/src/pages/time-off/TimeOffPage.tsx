import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { timeOffService } from '../../services/timeOffService';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { GrantAllocationModal } from './GrantAllocationModal';
import { LeaveTypeModal } from './LeaveTypeModal';
import type { LeaveType, LeaveAllocation, LeaveRequest } from '../../types';
import {
  CalendarDays,
  Check,
  X,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Ban,
  Layers,
  ShieldAlert,
} from 'lucide-react';

function parseUnits(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  if (typeof val === 'object') {
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (Array.isArray(val.d)) return (val.s ?? 1) * Number(val.d.join(''));
  }
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = cleanStr.split('-');
    if (y && m && d) {
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return cleanStr;
  } catch {
    return dateStr;
  }
}

export const TimeOffPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getTabFromPath = () => {
    if (location.pathname.includes('allocations')) return 'allocations';
    if (location.pathname.includes('types')) return 'types';
    return 'requests';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  // Data states
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeToEdit, setTypeToEdit] = useState<LeaveType | null>(null);

  // Sync tab state with URL
  useEffect(() => {
    navigate(`/time-off/${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reqRes, allocRes, typesRes] = await Promise.all([
        timeOffService.listLeaveRequests({ limit: 100 }),
        timeOffService.listAllocations({ limit: 100 }),
        timeOffService.listLeaveTypes(),
      ]);
      setRequests(reqRes.data || []);
      setAllocations(allocRes.data || []);
      setLeaveTypes(typesRes || []);
    } catch (err) {
      console.error('Failed to fetch time off records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      await timeOffService.approveLeaveRequest(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve leave request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      await timeOffService.rejectLeaveRequest(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reject leave request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoadingId(id);
    try {
      await timeOffService.cancelLeaveRequest(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel leave request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics calculation
  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedRequestsCount = requests.filter((r) => r.status === 'APPROVED').length;

  const TABS = [
    { id: 'requests', label: 'Leave Requests' },
    { id: 'allocations', label: 'Leave Allocations (Quotas)' },
    { id: 'types', label: 'Leave Types & Policies' },
  ];

  // Table Columns
  const requestsColumns: Column<LeaveRequest>[] = [
    {
      header: 'Employee',
      accessor: 'employeeId',
      render: (item: any) => {
        const emp = item.employee || item.employees;
        const name =
          emp?.name ||
          (emp?.firstName || emp?.first_name
            ? `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name || ''}`.trim()
            : item.employeeId
            ? `Employee #${item.employeeId}`
            : 'Employee');
        const code = emp?.employeeCode || emp?.employee_code || '';
        const initial = name && name !== 'Employee' ? name.charAt(0).toUpperCase() : 'E';

        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{name}</div>
              {code && <div className="text-xs text-slate-400 font-mono">{code}</div>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Leave Type',
      accessor: 'leaveTypeId',
      render: (item: any) => {
        const lt = item.leaveType || item.leave_types;
        return (
          <div>
            <span className="font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
              {lt?.name || 'General Leave'}
            </span>
            {lt?.code && <div className="text-[11px] text-slate-400 mt-0.5">{lt.code}</div>}
          </div>
        );
      },
    },
    {
      header: 'Duration & Dates',
      accessor: 'startDate',
      render: (item) => (
        <div className="text-xs text-slate-800 space-y-0.5">
          <div className="font-medium text-slate-900">
            {formatDate(item.startDate)} → {formatDate(item.endDate)}
          </div>
          <div className="text-indigo-600 font-bold">{parseUnits(item.requestedUnits)} days requested</div>
        </div>
      ),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (item) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">{item.reason || 'Not specified'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => {
        const variant =
          item.status === 'APPROVED'
            ? 'success'
            : item.status === 'REJECTED'
            ? 'danger'
            : item.status === 'PENDING'
            ? 'warning'
            : 'neutral';
        return <Badge variant={variant}>{item.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          {item.status === 'PENDING' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(item.id)}
                disabled={actionLoadingId === item.id}
                title="Approve Request"
                className="p-1.5 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 rounded-lg"
              >
                <Check className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReject(item.id)}
                disabled={actionLoadingId === item.id}
                title="Reject Request"
                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4 text-rose-600" />
              </Button>
            </>
          )}
          {(item.status === 'PENDING' || item.status === 'APPROVED') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(item.id)}
              disabled={actionLoadingId === item.id}
              title="Cancel Request"
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg text-xs"
            >
              <Ban className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const allocationsColumns: Column<LeaveAllocation>[] = [
    {
      header: 'Employee',
      accessor: 'employeeId',
      render: (item: any) => {
        const emp = item.employee || item.employees;
        const name =
          emp?.name ||
          (emp?.firstName || emp?.first_name
            ? `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name || ''}`.trim()
            : item.employeeId
            ? `Employee #${item.employeeId}`
            : 'Employee');
        const code = emp?.employeeCode || emp?.employee_code || '';

        return (
          <div className="flex items-center gap-2">
            <div className="font-bold text-slate-900 text-sm">{name}</div>
            {code && <span className="text-[11px] text-slate-400 font-mono">({code})</span>}
          </div>
        );
      },
    },
    {
      header: 'Leave Type',
      accessor: 'leaveTypeId',
      render: (item: any) => {
        const lt = item.leaveType || item.leave_types;
        return (
          <span className="font-semibold text-slate-800 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
            {lt?.name || 'Standard'} {lt?.code ? `(${lt.code})` : ''}
          </span>
        );
      },
    },
    {
      header: 'Allocated Quota',
      accessor: 'allocatedUnits',
      render: (item) => (
        <span className="font-bold text-slate-900 text-sm">{parseUnits(item.allocatedUnits)} days</span>
      ),
    },
    {
      header: 'Used',
      accessor: 'usedUnits',
      render: (item) => (
        <span className="font-semibold text-rose-600 text-sm">{parseUnits(item.usedUnits)} days</span>
      ),
    },
    {
      header: 'Remaining Balance',
      accessor: 'id',
      render: (item) => {
        const remaining = Math.max(0, parseUnits(item.allocatedUnits) - parseUnits(item.usedUnits));
        return (
          <span className="font-black text-emerald-600 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            {remaining.toFixed(1)} days left
          </span>
        );
      },
    },
    {
      header: 'Validity Period',
      accessor: 'validFrom',
      render: (item) => (
        <span className="text-xs text-slate-600 font-medium">
          {formatDate(item.validFrom)} → {formatDate(item.validTo)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => (
        <Badge variant={item.status === 'APPROVED' ? 'success' : 'neutral'}>{item.status}</Badge>
      ),
    },
  ];

  const typesColumns: Column<LeaveType>[] = [
    {
      header: 'Leave Policy Name',
      accessor: 'name',
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 text-sm">{item.name}</span>
          <div className="text-[11px] text-slate-400 font-mono">Code: {item.code}</div>
        </div>
      ),
    },
    {
      header: 'Unit',
      accessor: 'unit',
      render: (item) => <Badge variant="neutral">{item.unit}</Badge>,
    },
    {
      header: 'Allocation Quota',
      accessor: 'requiresAllocation',
      render: (item) => (
        <span className={item.requiresAllocation ? 'text-emerald-700 font-bold text-xs' : 'text-slate-400 text-xs'}>
          {item.requiresAllocation ? 'Quota Enforced' : 'Unlimited (LWP)'}
        </span>
      ),
    },
    {
      header: 'Approval Requirement',
      accessor: 'requiresApproval',
      render: (item) => (
        <span className={item.requiresApproval ? 'text-indigo-700 font-semibold text-xs' : 'text-slate-500 text-xs'}>
          {item.requiresApproval ? 'Manager Approval' : 'Auto Approved'}
        </span>
      ),
    },
    {
      header: 'Payroll Impact',
      accessor: 'payrollDeductible',
      render: (item) => (
        <span className={item.payrollDeductible ? 'text-amber-700 font-bold text-xs' : 'text-emerald-600 font-medium text-xs'}>
          {item.payrollDeductible ? 'Loss of Pay (Deductible)' : 'Paid Leave'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'neutral'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-7xl mx-auto">
      <PageHeader
        title="Time Off & Leave Management"
        description="Submit leave requests, manage employee quotas and allocations, and configure organizational leave policies."
        icon={<CalendarDays className="w-6 h-6 text-indigo-600" />}
        action={
          <div className="flex items-center gap-2.5">
            {activeTab === 'requests' && (
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsApplyModalOpen(true)}
              >
                Request Time Off
              </Button>
            )}
            {activeTab === 'allocations' && (
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsGrantModalOpen(true)}
              >
                Grant Allocation
              </Button>
            )}
            {activeTab === 'types' && (
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setTypeToEdit(null);
                  setIsTypeModalOpen(true);
                }}
              >
                New Leave Policy
              </Button>
            )}
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{pendingRequestsCount} Pending</div>
            <div className="text-xs text-slate-500 font-medium">Leave requests awaiting review</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{approvedRequestsCount} Approved</div>
            <div className="text-xs text-slate-500 font-medium">Leave periods sanctioned</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{allocations.length} Allocations</div>
            <div className="text-xs text-slate-500 font-medium">Granted leave quotas & balances</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{leaveTypes.length} Policies</div>
            <div className="text-xs text-slate-500 font-medium">Active paid & unpaid leave types</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-0">
          {activeTab === 'requests' && (
            <Table
              columns={requestsColumns}
              data={requests}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              emptyMessage="No leave requests submitted yet. Click 'Request Time Off' to create one."
            />
          )}

          {activeTab === 'allocations' && (
            <Table
              columns={allocationsColumns}
              data={allocations}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              emptyMessage="No leave allocations granted yet. Click 'Grant Allocation' to assign quotas."
            />
          )}

          {activeTab === 'types' && (
            <Table
              columns={typesColumns}
              data={leaveTypes}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              emptyMessage="No leave policies configured."
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={loadData}
      />

      <GrantAllocationModal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        onSuccess={loadData}
      />

      <LeaveTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSuccess={loadData}
        typeToEdit={typeToEdit}
      />
    </div>
  );
};

export default TimeOffPage;
