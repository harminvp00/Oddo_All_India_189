import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { PositionService } from '../../services/positionService';
import type { JobPosition, PaginationMeta } from '../../types';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Power,
  Eye,
  Award,
} from 'lucide-react';

export const PositionsPage: React.FC = () => {
  // State
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedPos, setSelectedPos] = useState<JobPosition | null>(null);
  const [posToDelete, setPosToDelete] = useState<JobPosition | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{ title: string; description: string; isActive: boolean }>({
    title: '',
    description: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<{ title?: string; api?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fixed Global Job Position Metrics from DB (does NOT change on table searching/filtering)
  const [globalPosStats, setGlobalPosStats] = useState({
    totalPositions: 0,
    activeCount: 0,
    inactiveCount: 0,
    totalEmployees: 0,
    totalContracts: 0,
  });

  const fetchGlobalPosStats = useCallback(async () => {
    try {
      const res = await PositionService.listPositions({ limit: 100 });
      if (res.success && res.data) {
        const allPositions = res.data;
        const totalPositions = res.meta?.total || allPositions.length;
        const activeCount = allPositions.filter((p) => p.isActive).length;
        const inactiveCount = allPositions.filter((p) => !p.isActive).length;
        const totalEmployees = allPositions.reduce((sum, p) => sum + (p.employeeCount || 0), 0);
        const totalContracts = allPositions.reduce((sum, p) => sum + (p.contractCount || 0), 0);

        setGlobalPosStats({
          totalPositions,
          activeCount,
          inactiveCount,
          totalEmployees,
          totalContracts,
        });
      }
    } catch (err) {
      console.error('Failed to fetch global position stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchGlobalPosStats();
  }, [fetchGlobalPosStats]);

  // Load Job Positions
  const fetchPositions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await PositionService.listPositions({
        search: searchTerm.trim() || undefined,
        isActive: statusFilter,
        page,
        limit,
      });

      if (res.success) {
        setPositions(res.data);
        if (res.meta) {
          setPaginationMeta(res.meta);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job positions. Please check backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, page, limit]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPositions(true);
    fetchGlobalPosStats();
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormData({ title: '', description: '', isActive: true });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (pos: JobPosition) => {
    setSelectedPos(pos);
    setFormData({
      title: pos.title,
      description: pos.description || '',
      isActive: pos.isActive,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (pos: JobPosition) => {
    setSelectedPos(pos);
    setIsViewModalOpen(true);
  };

  // Save Position (Create)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { title?: string } = {};
    if (!formData.title.trim()) errors.title = 'Job title is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      const res = await PositionService.createPosition({
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setToastMessage({ type: 'success', text: `Job position "${res.data.title}" created successfully!` });
        fetchPositions(true);
        fetchGlobalPosStats();
      }
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to create job position' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Save Position (Update)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPos) return;

    const errors: { title?: string } = {};
    if (!formData.title.trim()) errors.title = 'Job title is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      const res = await PositionService.updatePosition(selectedPos.id, {
        title: formData.title,
        description: formData.description,
        isActive: formData.isActive,
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setToastMessage({ type: 'success', text: `Job position "${res.data.title}" updated successfully!` });
        fetchPositions(true);
        fetchGlobalPosStats();
      }
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to update job position' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (pos: JobPosition) => {
    try {
      const res = await PositionService.togglePositionStatus(pos.id, pos.isActive);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Job position "${pos.title}" marked as ${!pos.isActive ? 'Active' : 'Inactive'}`,
        });
        setPositions((prev) =>
          prev.map((p) => (p.id === pos.id ? { ...p, isActive: !p.isActive } : p))
        );
        fetchGlobalPosStats();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to change job position status' });
    }
  };

  // Delete / Archive Position
  const handleConfirmDelete = async () => {
    if (!posToDelete) return;
    setIsDeleting(true);
    try {
      const res = await PositionService.deletePosition(posToDelete.id);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: res.data.message || `Job position "${posToDelete.title}" processed successfully.`,
        });
        setPosToDelete(null);
        fetchPositions(true);
        fetchGlobalPosStats();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete job position' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-slideDown shadow-2xl">
          <Alert
            variant={toastMessage.type === 'success' ? 'success' : 'danger'}
            title={toastMessage.type === 'success' ? 'Success' : 'Error'}
            className="border shadow-lg"
          >
            {toastMessage.text}
          </Alert>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Job Positions"
        description="Define and manage organizational designations, job responsibilities, and contract linkages connected directly to PostgreSQL."
        icon={<Briefcase className="w-6 h-6 text-indigo-600" />}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
            >
              Add Position
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Positions</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{globalPosStats.totalPositions}</span>
            <span className="text-xs text-slate-500 font-medium">Designations</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Status</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{globalPosStats.activeCount}</span>
            <span className="text-xs text-slate-400">/ {globalPosStats.inactiveCount} Inactive</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Staff</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{globalPosStats.totalEmployees}</span>
            <span className="text-xs text-slate-500 font-medium">Active employees</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Links</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{globalPosStats.totalContracts}</span>
            <span className="text-xs text-slate-500 font-medium">Linked contracts</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" title="Backend Connection Issue">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchPositions()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles or descriptions..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => {
                setStatusFilter('true');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'true'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter('false');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'false'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Rows Per Page */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm font-medium text-slate-500">Loading job positions from database...</span>
          </div>
        ) : positions.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Job Positions Found"
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'No positions match your active filter criteria. Try resetting search or filters.'
                  : 'Get started by creating your first job position designation.'
              }
              action={
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddModal}
                >
                  Create Position
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Designation Title & Summary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Staff Count</th>
                  <th className="py-3.5 px-4">Contracts</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {positions.map((pos) => (
                  <tr
                    key={pos.id}
                    className="hover:bg-indigo-50/20 transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {pos.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                            {pos.description || <span className="italic text-slate-400">No description provided</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(pos)}
                        title="Click to toggle status"
                        className="inline-flex items-center gap-1.5 group/btn cursor-pointer"
                      >
                        <Badge variant={pos.isActive ? 'success' : 'neutral'}>
                          {pos.isActive ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {pos.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{pos.employeeCount || 0}</span>
                        <span className="text-xs text-slate-400">members</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{pos.contractCount || 0}</span>
                        <span className="text-xs text-slate-400">contracts</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Overview"
                          onClick={() => handleOpenViewModal(pos)}
                        >
                          <Eye className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Position"
                          onClick={() => handleOpenEditModal(pos)}
                        >
                          <Edit2 className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={pos.isActive ? 'Deactivate Position' : 'Activate Position'}
                          onClick={() => handleToggleStatus(pos)}
                        >
                          <Power
                            className={`w-4 h-4 ${
                              pos.isActive ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Position"
                          onClick={() => setPosToDelete(pos)}
                        >
                          <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {paginationMeta.total > 0 && (
          <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {Math.min((page - 1) * limit + 1, paginationMeta.total)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(page * limit, paginationMeta.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{paginationMeta.total}</span> positions
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <div className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                {page} / {paginationMeta.totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                disabled={page >= paginationMeta.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !formSubmitting && setIsAddModalOpen(false)}
        title="Create Job Position"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formErrors.api && (
            <Alert variant="danger" title="Creation Failed">
              {formErrors.api}
            </Alert>
          )}

          <div>
            <Input
              label="JOB TITLE"
              placeholder="e.g. Senior Frontend Architect"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
              }}
              required
              disabled={formSubmitting}
            />
            {formErrors.title && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.title}</p>
            )}
          </div>

          <div>
            <Textarea
              label="JOB DESCRIPTION & RESPONSIBILITIES"
              placeholder="Provide a brief summary of key duties and skills required for this role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={formSubmitting}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <input
              type="checkbox"
              id="pos_create_is_active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              disabled={formSubmitting}
            />
            <label htmlFor="pos_create_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Job Position is Active
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formSubmitting}
              leftIcon={formSubmitting ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
            >
              {formSubmitting ? 'Saving...' : 'Create Position'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !formSubmitting && setIsEditModalOpen(false)}
        title={`Edit Job Position: ${selectedPos?.title || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formErrors.api && (
            <Alert variant="danger" title="Update Failed">
              {formErrors.api}
            </Alert>
          )}

          <div>
            <Input
              label="JOB TITLE"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
              }}
              required
              disabled={formSubmitting}
            />
            {formErrors.title && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.title}</p>
            )}
          </div>

          <div>
            <Textarea
              label="JOB DESCRIPTION & RESPONSIBILITIES"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={formSubmitting}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <input
              type="checkbox"
              id="pos_edit_is_active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              disabled={formSubmitting}
            />
            <label htmlFor="pos_edit_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Job Position is Active
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formSubmitting}
              leftIcon={formSubmitting ? <Spinner size="sm" /> : <Edit2 className="w-4 h-4" />}
            >
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Position Overview"
        maxWidth="md"
      >
        {selectedPos && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-violet-50 to-slate-50 rounded-2xl border border-violet-100/60">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPos.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedPos.isActive ? 'success' : 'neutral'}>
                    {selectedPos.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="font-mono text-xs text-slate-500">ID: #{selectedPos.id}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Description</span>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                {selectedPos.description || 'No detailed description provided for this job position.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Employees</span>
                <div className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {selectedPos.employeeCount || 0}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 uppercase">Linked Contracts</span>
                <div className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {selectedPos.contractCount || 0}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Edit2 className="w-4 h-4" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(selectedPos);
                }}
              >
                Edit Position
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!posToDelete}
        onClose={() => setPosToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Job Position: "${posToDelete?.title}"?`}
        description={
          posToDelete && ((posToDelete.employeeCount || 0) > 0 || (posToDelete.contractCount || 0) > 0)
            ? `Note: This job position has ${posToDelete.employeeCount || 0} linked employees and ${
                posToDelete.contractCount || 0
              } contracts. In accordance with database integrity rules, it will be safely DEACTIVATED instead of hard-deleted.`
            : `Are you sure you want to permanently delete the job position "${posToDelete?.title}"? This action cannot be undone.`
        }
        confirmText={isDeleting ? 'Processing...' : 'Proceed with Delete'}
        variant="danger"
      />
    </div>
  );
};
