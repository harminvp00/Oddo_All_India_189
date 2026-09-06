import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { contractService } from '../../services/contractService';
import { ContractModal } from './ContractModal';
import type { Contract, ContractStatus, PaginationMeta } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);

  // Detail Modal State
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // Delete State
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fixed Global Metrics for stats bar (does NOT change on table searching/filtering)
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    expiredOrTerminated: 0,
  });

  const fetchGlobalStats = useCallback(async () => {
    try {
      const res = await contractService.listContracts({ limit: 100 });
      if (res && res.items) {
        const allItems = res.items;
        const total = res.meta?.total || allItems.length;
        const active = allItems.filter((c) => c.status === 'ACTIVE').length;
        const draft = allItems.filter((c) => c.status === 'DRAFT').length;
        const expiredOrTerminated = allItems.filter(
          (c) => c.status === 'EXPIRED' || c.status === 'TERMINATED'
        ).length;

        setGlobalStats({
          total,
          active,
          draft,
          expiredOrTerminated,
        });
      }
    } catch (err) {
      console.error('Failed to load global contract stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  const fetchContracts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await contractService.listContracts({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as ContractStatus) : undefined,
        page,
        limit: meta.limit,
      });

      setContracts(res.items);
      setMeta(res.meta);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, meta.limit]);

  useEffect(() => {
    fetchContracts(1);
  }, [fetchContracts]);

  const handleOpenCreateModal = () => {
    setContractToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (contract: Contract) => {
    setContractToEdit(contract);
    setIsFormModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingContract) return;
    setIsDeleting(true);
    try {
      await contractService.deleteContract(deletingContract.id);
      setDeletingContract(null);
      fetchContracts(meta.page);
      fetchGlobalStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete contract');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">DRAFT</Badge>;
      case 'EXPIRED':
        return <Badge variant="warning">EXPIRED</Badge>;
      case 'TERMINATED':
        return <Badge variant="danger">TERMINATED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: Column<Contract>[] = [
    {
      header: 'Contract Reference',
      accessor: 'contractNumber',
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
            {item.contractNumber}
          </span>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {item.salaryStructure?.name || 'Standard Structure'}
          </div>
        </div>
      ),
    },
    {
      header: 'Employee',
      accessor: 'employeeId',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {item.employee?.fullName?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{item.employee?.fullName || 'N/A'}</div>
            <div className="text-xs text-slate-400">{item.employee?.employeeCode}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Wage / Compensation',
      accessor: 'wage',
      render: (item) => (
        <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
          <span className="text-emerald-600 font-extrabold">₹{Number(item.wage).toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-slate-400 font-normal">/ mo</span>
        </div>
      ),
    },
    {
      header: 'Validity Period',
      accessor: 'startDate',
      render: (item) => (
        <div className="text-xs text-slate-700 space-y-0.5">
          <div className="flex items-center gap-1 font-medium text-slate-900">
            <span className="text-slate-400 text-[10px]">From:</span> {item.startDate || '-'}
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-slate-400 text-[10px]">To:</span>{' '}
            {item.endDate ? (
              <span className="text-orange-700 font-medium">{item.endDate}</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Open-ended</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Department & Position',
      accessor: 'departmentId',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <div className="font-medium text-slate-800">{item.department?.name || 'Department Default'}</div>
          <div className="text-slate-400 text-[11px]">{item.position?.title || 'Position Default'}</div>
        </div>
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingContract(item)}
            title="View Details"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditModal(item)}
            title="Edit Contract"
            className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingContract(item)}
            title="Terminate / Delete"
            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Employment Contracts"
        description="Issue, manage, and prevent overlap on employee compensation contracts and wage structures."
        icon={<FileText className="w-6 h-6 text-indigo-600" />}
        action={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            New Contract
          </Button>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{globalStats.total}</div>
            <div className="text-xs text-slate-500 font-medium">Total Contracts On Record</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-indigo-900">{globalStats.active} In Force</div>
            <div className="text-xs text-slate-500 font-medium">Protected against date overlap</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{globalStats.draft} Drafts / {globalStats.expiredOrTerminated} Terminated</div>
            <div className="text-xs text-slate-500 font-medium">Pending or Archived contracts</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <Input
            placeholder="Search by contract # or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 text-sm font-medium"
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active Only', value: 'ACTIVE' },
              { label: 'Draft Only', value: 'DRAFT' },
              { label: 'Expired', value: 'EXPIRED' },
              { label: 'Terminated', value: 'TERMINATED' },
            ]}
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={contracts}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No contracts found matching your filters."
        />

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> (
              {meta.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => fetchContracts(meta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchContracts(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Contract Modal */}
      <ContractModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          fetchContracts(meta.page);
          fetchGlobalStats();
        }}
        contractToEdit={contractToEdit}
      />

      {/* Contract Detail View Modal */}
      {viewingContract && (
        <Modal
          isOpen={Boolean(viewingContract)}
          onClose={() => setViewingContract(null)}
          title={`Contract Details: ${viewingContract.contractNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <div>
                <div className="text-xs text-slate-400">Employee</div>
                <div className="font-bold text-slate-900 text-sm">
                  {viewingContract.employee?.fullName} ({viewingContract.employee?.employeeCode})
                </div>
              </div>
              <div>{getStatusBadge(viewingContract.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Monthly Base Wage
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  ₹{Number(viewingContract.wage).toLocaleString('en-IN')} {viewingContract.currencyCode}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Salary Structure
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  {viewingContract.salaryStructure?.name || 'Default CTC'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Start Date
                </div>
                <div className="font-bold text-slate-900 mt-1">{viewingContract.startDate}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> End Date
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  {viewingContract.endDate || 'Open-ended'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Department
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  {viewingContract.department?.name || 'Default Employee Dept'}
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Position
                </div>
                <div className="font-bold text-slate-900 mt-1">
                  {viewingContract.position?.title || 'Default Employee Position'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="primary" onClick={() => setViewingContract(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Terminate Confirmation Modal */}
      {deletingContract && (
        <Modal
          isOpen={Boolean(deletingContract)}
          onClose={() => setDeletingContract(null)}
          title="Terminate / Delete Contract"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-800">
                Are you sure you want to remove contract{' '}
                <strong>{deletingContract.contractNumber}</strong> for employee{' '}
                <strong>{deletingContract.employee?.fullName}</strong>?
                <p className="text-xs text-rose-600 mt-1">
                  If this contract has historical payslips generated, it will be safely marked as <strong>TERMINATED</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setDeletingContract(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Confirm Removal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContractsPage;
