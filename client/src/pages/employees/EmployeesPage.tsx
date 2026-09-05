import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { employeeService } from '../../services/employeeService';
import { DepartmentService } from '../../services/departmentService';
import { getStoredAvatar } from '../../utils/avatarUtils';
import type { Employee, Department, EmploymentStatus } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Pencil,
  Archive, 
  Building2, 
  Briefcase, 
  RefreshCw, 
  Mail, 
  Phone,
  Calendar,
  X,
  LayoutGrid,
  List as ListIcon,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'danger' | 'info'; message: string } | null>(null);

  // Load departments once for filter dropdown
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await DepartmentService.listDepartments({ limit: 100 });
        if (res.success) setDepartments(res.data);
      } catch (err: any) {
        console.error('Failed to load departments for filter:', err);
      }
    }
    loadDepts();
  }, []);

  // Fetch employees from live backend
  const loadEmployees = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await employeeService.listEmployees({
        page,
        limit: 20,
        search: searchTerm.trim() || undefined,
        departmentId: deptFilter !== 'all' ? deptFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setEmployees(res.items || []);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total || 0);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setAlertInfo({
        type: 'danger',
        message: err?.response?.data?.message || err?.message || 'Failed to load employees from server.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchTerm, deptFilter, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to terminate/archive employee "${name}"?`)) {
      return;
    }

    try {
      await employeeService.deleteEmployee(id);
      setAlertInfo({
        type: 'success',
        message: `Employee "${name}" has been archived successfully.`,
      });
      await loadEmployees(true);
    } catch (err: any) {
      console.error('Failed to archive employee:', err);
      setAlertInfo({
        type: 'danger',
        message: err?.response?.data?.message || err?.message || 'Failed to archive employee.',
      });
    }
  };

  const statusVariantMap: Record<EmploymentStatus, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'> = {
    ACTIVE: 'success',
    ON_LEAVE: 'warning',
    SUSPENDED: 'danger',
    TERMINATED: 'neutral',
  };

  const columns: Column<Employee>[] = [
    {
      header: 'Employee',
      accessor: 'firstName',
      render: (item) => {
        const initials = `${item.firstName[0] || ''}${item.lastName[0] || ''}`.toUpperCase();
        const avatar = item.avatarUrl || getStoredAvatar(item.id) || getStoredAvatar(item.employeeCode);

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-xs flex items-center justify-center shrink-0">
              {avatar ? (
                <img src={avatar} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#714B67] to-slate-800 text-white font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                <span>{item.name}</span>
                <span className="text-[10px] font-bold text-[#714B67] bg-[#714B67]/10 px-1.5 py-0.2 rounded-md font-mono">
                  {item.employeeCode}
                </span>
              </div>
              {item.email && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{item.email}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Department',
      accessor: 'departmentId',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{item.department?.name || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      header: 'Position / Role',
      accessor: 'positionId',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Briefcase className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <span>{item.position?.title || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (item) => (
        <div className="text-xs text-slate-600">
          {item.phone ? (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {item.phone}
            </span>
          ) : (
            <span className="text-slate-400 italic">No phone</span>
          )}
        </div>
      ),
    },
    {
      header: 'Joining Date',
      accessor: 'hireDate',
      render: (item) => (
        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{new Date(item.hireDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'employmentStatus',
      render: (item) => (
        <Badge variant={statusVariantMap[item.employmentStatus] || 'neutral'}>
          {item.employmentStatus.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link to={`/employees/${item.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
              title="View 360° Hub"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link to={`/employees/${item.id}/edit`}>
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600"
              title="Edit Employee"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          {item.employmentStatus === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleArchive(item.id, item.name)}
              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400"
              title="Archive Employee"
            >
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Master Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Centralized directory managing employee profiles, contracts, shifts, and payroll parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Kanban / List Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table List View"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmployees(true)}
            disabled={refreshing || loading}
            leftIcon={<RefreshCw className={`w-4 h-4 text-[#714B67] ${refreshing ? 'animate-spin' : ''}`} />}
            className="bg-white hover:bg-slate-50 font-bold text-xs"
          >
            {refreshing ? 'Syncing...' : 'Sync'}
          </Button>

          <Link to="/employees/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-md shadow-[#714B67]/20 font-bold text-xs"
            >
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {alertInfo && (
        <Alert variant={alertInfo.type} onClose={() => setAlertInfo(null)}>
          {alertInfo.message}
        </Alert>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 w-full">
          <Input 
            placeholder="Search by name, employee code, email, or phone..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-slate-50/50"
          />
        </div>

        <div className="w-full sm:w-56">
          <Select 
            value={deptFilter} 
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Departments', value: 'all' },
              ...departments.map((d) => ({ label: `${d.name} (${d.code})`, value: d.id })),
            ]}
          />
        </div>

        <div className="w-full sm:w-44">
          <Select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'On Leave', value: 'ON_LEAVE' },
              { label: 'Suspended', value: 'SUSPENDED' },
              { label: 'Terminated', value: 'TERMINATED' },
            ]}
          />
        </div>

        {(searchTerm || deptFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setDeptFilter('all');
              setStatusFilter('all');
              setPage(1);
            }}
            className="text-xs text-rose-600 hover:bg-rose-50 p-2"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Content Area: Kanban or List */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200/70 shadow-xs text-center flex flex-col items-center justify-center gap-3 text-slate-500">
          <Spinner size="md" />
          <p className="text-xs font-semibold">Loading workforce from database...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200/70 shadow-xs text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Employees Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No employees match your current filter criteria. Click "Add Employee" above to onboard a team member.
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN CARDS VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
            {employees.map((emp) => {
              const initials = `${emp.firstName[0] || ''}${emp.lastName[0] || ''}`.toUpperCase();
              const avatar = emp.avatarUrl || getStoredAvatar(emp.id) || getStoredAvatar(emp.employeeCode);

              return (
                <div
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#714B67]/40 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs flex items-center justify-center shrink-0">
                          {avatar ? (
                            <img src={avatar} alt={emp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#714B67] to-slate-800 text-white font-extrabold text-sm flex items-center justify-center">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#714B67] transition-colors leading-tight">
                            {emp.name}
                          </h3>
                          <span className="text-[10px] font-bold text-[#714B67] bg-[#714B67]/10 px-2 py-0.5 rounded-md font-mono mt-0.5 inline-block">
                            {emp.employeeCode}
                          </span>
                        </div>
                      </div>

                      <Badge variant={statusVariantMap[emp.employmentStatus] || 'neutral'}>
                        {emp.employmentStatus.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Metadata Badges */}
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{emp.position?.title || 'Designation Pending'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{emp.department?.name || 'Department Unassigned'}</span>
                      </div>
                      {emp.email && (
                        <div className="flex items-center gap-2 text-slate-500 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Joined {new Date(emp.hireDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs font-bold text-[#714B67] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View 360° Hub <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <Table 
            columns={columns}
            data={employees}
            keyExtractor={(item) => item.id}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Page <span className="font-bold text-slate-900">{page}</span> of{' '}
                <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
