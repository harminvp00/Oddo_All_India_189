import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import type { UserAccount, UserRole, UserStatus, PaginationMeta } from '../../types';
import {
  Users,
  UserPlus,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Power,
  Shield,
  UserCheck,
  Mail,
  Lock,
  User as UserIcon,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager' },
  { value: 'HR_PAYROLL_USER', label: 'HR Payroll User' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
];

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [statusToggleUser, setStatusToggleUser] = useState<UserAccount | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);

  // Forms
  const [createFormData, setCreateFormData] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    password: string;
  }>({
    email: '',
    fullName: '',
    role: 'EMPLOYEE',
    password: '',
  });

  const [editFormData, setEditFormData] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
  }>({
    email: '',
    fullName: '',
    role: 'EMPLOYEE',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load Users
  const fetchUsers = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      setError(null);
      try {
        const res = await userService.getUsers({
          search: searchTerm.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page,
          limit,
        });

        setUsers(res.users);
        setPaginationMeta(res.meta);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users. Please check backend connection.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchTerm, roleFilter, statusFilter, page, limit]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setCreateFormData({
      email: '',
      fullName: '',
      role: 'EMPLOYEE',
      password: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!createFormData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email))
      errors.email = 'Please enter a valid email';

    if (!createFormData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!createFormData.password) errors.password = 'Initial password is required';
    else if (createFormData.password.length < 8)
      errors.password = 'Password must be at least 8 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});

    try {
      await userService.createUser({
        email: createFormData.email.trim(),
        fullName: createFormData.fullName.trim(),
        role: createFormData.role,
        password: createFormData.password,
      });

      setIsAddModalOpen(false);
      setToastMessage({ type: 'success', text: `User account created successfully!` });
      fetchUsers(true);
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to create user account' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: UserAccount) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const errors: Record<string, string> = {};
    if (!editFormData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!editFormData.email.trim()) errors.email = 'Email is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});

    try {
      await userService.updateUser(selectedUser.id, {
        fullName: editFormData.fullName.trim(),
        email: editFormData.email.trim(),
        role: editFormData.role,
      });

      setIsEditModalOpen(false);
      setToastMessage({ type: 'success', text: `User "${editFormData.fullName}" updated successfully!` });
      fetchUsers(true);
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to update user' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Status
  const handleConfirmToggleStatus = async () => {
    if (!statusToggleUser) return;
    setIsTogglingStatus(true);

    const nextStatus: UserStatus = statusToggleUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';

    try {
      await userService.toggleUserStatus(statusToggleUser.id, nextStatus);
      setStatusToggleUser(null);
      setToastMessage({
        type: 'success',
        text: `Account for ${statusToggleUser.email} is now ${nextStatus.toLowerCase()}.`,
      });
      fetchUsers(true);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to update user status.',
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Role Badge Helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">Admin</Badge>;
      case 'HR_MANAGER':
        return <Badge variant="primary">HR Manager</Badge>;
      case 'HR_PAYROLL_MANAGER':
        return <Badge variant="warning">Payroll Manager</Badge>;
      case 'HR_PAYROLL_USER':
        return <Badge variant="info">Payroll User</Badge>;
      case 'EMPLOYEE':
      default:
        return <Badge variant="neutral">Employee</Badge>;
    }
  };

  // Stats calculation
  const totalCount = paginationMeta.total || users.length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top duration-300">
          <Alert
            variant={toastMessage.type === 'success' ? 'success' : 'danger'}
            title={toastMessage.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setToastMessage(null)}
          >
            {toastMessage.text}
          </Alert>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="User & Access Management"
        description="Manage system user accounts, roles, access permissions, and authentication status."
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              Add New User
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Accounts</p>
            <h3 className="text-2xl font-bold text-slate-900">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrators</p>
            <h3 className="text-2xl font-bold text-slate-900">{adminCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-44">
            <Select
              options={ROLE_OPTIONS}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" title="Error Loading Users">
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-slate-500">Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16">
            <EmptyState
              title="No Users Found"
              description="No user accounts match your current filter criteria."
              action={
                <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                  Add New User
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">User Profile</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id || currentUser?.email === u.email;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            {u.fullName
                              ? u.fullName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .substring(0, 2)
                              : u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {u.fullName || 'Unnamed User'}
                              {isSelf && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-5 py-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200/60">
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never logged in'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(u)}
                            className="text-slate-600 hover:text-indigo-600"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setStatusToggleUser(u)}
                            className={
                              u.status === 'ACTIVE'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }
                            title={u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {paginationMeta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-700">{paginationMeta.page}</span> of{' '}
              <span className="font-semibold text-slate-700">{paginationMeta.totalPages}</span> ({paginationMeta.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= paginationMeta.totalPages}
                onClick={() => setPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New User Account"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {formErrors.api && (
            <Alert variant="danger" title="Error Creating User">
              {formErrors.api}
            </Alert>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={createFormData.fullName}
            onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
            error={formErrors.fullName}
            startIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul.sharma@peoplepay360.com"
            value={createFormData.email}
            onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
            error={formErrors.email}
            startIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <Select
              options={ROLE_OPTIONS.filter((r) => r.value !== 'all')}
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as UserRole })}
            />
          </div>

          <Input
            label="Initial Password"
            type="password"
            placeholder="Min. 8 characters"
            value={createFormData.password}
            onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
            error={formErrors.password}
            startIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile & Role"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {formErrors.api && (
            <Alert variant="danger" title="Error Updating User">
              {formErrors.api}
            </Alert>
          )}

          <Input
            label="Full Name"
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
            error={formErrors.fullName}
            startIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            error={formErrors.email}
            startIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <Select
              options={ROLE_OPTIONS.filter((r) => r.value !== 'all')}
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Toggle Confirmation */}
      {statusToggleUser && (
        <ConfirmDialog
          isOpen={!!statusToggleUser}
          onClose={() => setStatusToggleUser(null)}
          onConfirm={handleConfirmToggleStatus}
          title={
            statusToggleUser.status === 'ACTIVE'
              ? `Disable User Account: ${statusToggleUser.email}`
              : `Re-activate User Account: ${statusToggleUser.email}`
          }
          description={
            statusToggleUser.status === 'ACTIVE'
              ? 'Disabling this account will immediately revoke all authentication tokens and prevent this user from signing in.'
              : 'Activating this account will allow the user to log in and access system services.'
          }
          confirmText={statusToggleUser.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
          variant={statusToggleUser.status === 'ACTIVE' ? 'danger' : 'primary'}
          isLoading={isTogglingStatus}
        />
      )}
    </div>
  );
};

export default UsersPage;
