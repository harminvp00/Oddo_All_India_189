import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { DepartmentService } from '../../services/departmentService';
import type { Department, PaginationMeta } from '../../types';
import {
  Building2,
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
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  // State
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<{ name: string; code: string; isActive: boolean }>({
    name: '',
    code: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; code?: string; api?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load Departments
  const fetchDepartments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await DepartmentService.listDepartments({
        search: searchTerm.trim() || undefined,
        isActive: statusFilter,
        page,
        limit,
      });

      if (res.success) {
        setDepartments(res.data);
        if (res.meta) {
          setPaginationMeta(res.meta);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch departments. Please check backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, page, limit]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDepartments(true);
  };

  // KPIs
  const totalDepts = paginationMeta.total || departments.length;
  const activeCount = departments.filter((d) => d.isActive).length;
  const inactiveCount = departments.filter((d) => !d.isActive).length;
  const totalEmployees = departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0);
  const totalContracts = departments.reduce((sum, d) => sum + (d.contractCount || 0), 0);

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormData({ name: '', code: '', isActive: true });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      isActive: dept.isActive,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (dept: Department) => {
    setSelectedDept(dept);
    setIsViewModalOpen(true);
  };

  // Save Department (Create)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; code?: string } = {};
    if (!formData.name.trim()) errors.name = 'Department name is required';
    if (!formData.code.trim()) errors.code = 'Department code is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      const res = await DepartmentService.createDepartment({
        name: formData.name,
        code: formData.code,
        isActive: formData.isActive,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setToastMessage({ type: 'success', text: `Department "${res.data.name}" created successfully!` });
        fetchDepartments(true);
      }
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to create department' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Save Department (Update)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;

    const errors: { name?: string; code?: string } = {};
    if (!formData.name.trim()) errors.name = 'Department name is required';
    if (!formData.code.trim()) errors.code = 'Department code is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      const res = await DepartmentService.updateDepartment(selectedDept.id, {
        name: formData.name,
        code: formData.code,
        isActive: formData.isActive,
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setToastMessage({ type: 'success', text: `Department "${res.data.name}" updated successfully!` });
        fetchDepartments(true);
      }
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to update department' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (dept: Department) => {
    try {
      const res = await DepartmentService.toggleDepartmentStatus(dept.id, dept.isActive);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Department "${dept.name}" marked as ${!dept.isActive ? 'Active' : 'Inactive'}`,
        });
        // Optimistic / fast update
        setDepartments((prev) =>
          prev.map((d) => (d.id === dept.id ? { ...d, isActive: !d.isActive } : d))
        );
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to change department status' });
    }
  };

  // Delete / Archive Department
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      const res = await DepartmentService.deleteDepartment(deptToDelete.id);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: res.data.message || `Department "${deptToDelete.name}" processed successfully.`,
        });
        setDeptToDelete(null);
        fetchDepartments(true);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete department' });
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
        title="Department Management"
        description="Configure organizational departments, track headcount, and manage assignments connected directly to PostgreSQL."
        icon={<Building2 className="w-6 h-6 text-indigo-600" />}
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
              Add Department
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Departments</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalDepts}</span>
            <span className="text-xs text-slate-500 font-medium">In organization</span>
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
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-slate-400">/ {inactiveCount} Inactive</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Employees</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalEmployees}</span>
            <span className="text-xs text-slate-500 font-medium">Assigned staff</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Contracts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalContracts}</span>
            <span className="text-xs text-slate-500 font-medium">Salary contracts</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" title="Backend Connection Issue">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchDepartments()}>
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
            placeholder="Search by name or code..."
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
            <span className="text-sm font-medium text-slate-500">Loading departments from database...</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Departments Found"
              description={
                searchTerm || statusFilter !== 'all'
                  ? 'No departments match your active filter criteria. Try resetting search or filters.'
                  : 'Get started by creating your first organizational department.'
              }
              action={
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddModal}
                >
                  Create Department
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Department Details</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Staff Assigned</th>
                  <th className="py-3.5 px-4">Contracts</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-indigo-50/20 transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {dept.code?.substring(0, 2) || 'DP'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {dept.name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            ID: #{dept.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {dept.code}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(dept)}
                        title="Click to toggle status"
                        className="inline-flex items-center gap-1.5 group/btn cursor-pointer"
                      >
                        <Badge variant={dept.isActive ? 'success' : 'neutral'}>
                          {dept.isActive ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{dept.employeeCount || 0}</span>
                        <span className="text-xs text-slate-400">members</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{dept.contractCount || 0}</span>
                        <span className="text-xs text-slate-400">contracts</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Details"
                          onClick={() => handleOpenViewModal(dept)}
                        >
                          <Eye className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Department"
                          onClick={() => handleOpenEditModal(dept)}
                        >
                          <Edit2 className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={dept.isActive ? 'Deactivate Department' : 'Activate Department'}
                          onClick={() => handleToggleStatus(dept)}
                        >
                          <Power
                            className={`w-4 h-4 ${
                              dept.isActive ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Department"
                          onClick={() => setDeptToDelete(dept)}
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
              of <span className="font-semibold text-slate-800">{paginationMeta.total}</span> departments
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
        title="Create New Department"
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
              label="DEPARTMENT NAME"
              placeholder="e.g. Finance & Accounting"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
              }}
              required
              disabled={formSubmitting}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.name}</p>
            )}
          </div>

          <div>
            <Input
              label="DEPARTMENT CODE (e.g. FIN, ENG, HR)"
              placeholder="e.g. FIN"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                if (formErrors.code) setFormErrors({ ...formErrors, code: undefined });
              }}
              required
              disabled={formSubmitting}
            />
            {formErrors.code && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.code}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              A unique abbreviation used across payroll and employee contracts.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <input
              type="checkbox"
              id="create_is_active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              disabled={formSubmitting}
            />
            <label htmlFor="create_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Department is Active
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
              {formSubmitting ? 'Saving...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !formSubmitting && setIsEditModalOpen(false)}
        title={`Edit Department: ${selectedDept?.name || ''}`}
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
              label="DEPARTMENT NAME"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
              }}
              required
              disabled={formSubmitting}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.name}</p>
            )}
          </div>

          <div>
            <Input
              label="DEPARTMENT CODE"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                if (formErrors.code) setFormErrors({ ...formErrors, code: undefined });
              }}
              required
              disabled={formSubmitting}
            />
            {formErrors.code && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.code}</p>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              disabled={formSubmitting}
            />
            <label htmlFor="edit_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Department is Active
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
        title="Department Overview"
        maxWidth="md"
      >
        {selectedDept && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {selectedDept.code?.substring(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedDept.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-700">
                    {selectedDept.code}
                  </span>
                  <Badge variant={selectedDept.isActive ? 'success' : 'neutral'}>
                    {selectedDept.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Employees</span>
                <div className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {selectedDept.employeeCount || 0}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 uppercase">Linked Contracts</span>
                <div className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {selectedDept.contractCount || 0}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
              <div className="flex justify-between">
                <span>Database ID:</span>
                <span className="font-mono font-semibold text-slate-700">#{selectedDept.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-slate-700">
                  {selectedDept.isActive ? 'Operational & Active' : 'Deactivated / Archived'}
                </span>
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
                  handleOpenEditModal(selectedDept);
                }}
              >
                Edit Department
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Department: "${deptToDelete?.name}"?`}
        description={
          deptToDelete && ((deptToDelete.employeeCount || 0) > 0 || (deptToDelete.contractCount || 0) > 0)
            ? `Note: This department has ${deptToDelete.employeeCount || 0} linked employees and ${
                deptToDelete.contractCount || 0
              } contracts. In accordance with database integrity rules, it will be safely DEACTIVATED instead of hard-deleted.`
            : `Are you sure you want to permanently delete the department "${deptToDelete?.name}" (${deptToDelete?.code})? This action cannot be undone.`
        }
        confirmText={isDeleting ? 'Processing...' : 'Proceed with Delete'}
        variant="danger"
      />
    </div>
  );
};
