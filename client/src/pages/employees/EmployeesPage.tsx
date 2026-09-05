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
import type { Employee, Department, EmploymentStatus } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Archive, 
  Building2, 
  Briefcase, 
  RefreshCw, 
  Mail, 
  Phone,
  Calendar,
  X
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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
      } catch (err) {
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
        message: err?.response?.data?.message || 'Failed to load employees from server.',
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
        message: err?.response?.data?.message || 'Failed to archive employee.',
      });
    }
  };

  const columns: Column<Employee>[] = [
    {
      header: 'Employee',
      accessor: 'firstName',
      render: (item) => {
        const initials = `${item.firstName[0] || ''}${item.lastName[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                <span>{item.name}</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded-md font-mono">
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
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{item.department ? `${item.department.name} (${item.department.code})` : '-'}</span>
        </div>
      ),
    },
    {
      header: 'Job Position',
      accessor: 'positionId',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Briefcase className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <span>{item.position?.title || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Joining Date',
      accessor: 'hireDate',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{item.hireDate ? new Date(item.hireDate).toLocaleDateString() : '-'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'employmentStatus',
      render: (item) => {
        const variantMap: Record<EmploymentStatus, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'> = {
          ACTIVE: 'success',
          ON_LEAVE: 'warning',
          SUSPENDED: 'danger',
          TERMINATED: 'neutral',
        };
        return (
          <Badge variant={variantMap[item.employmentStatus] || 'neutral'}>
            {item.employmentStatus.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => navigate(`/employees/${item.id}`)}
            title="View Employee Profile"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {item.employmentStatus !== 'TERMINATED' && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-auto text-slate-600 hover:text-rose-600 hover:bg-rose-50"
              onClick={() => handleArchive(item.id, item.name)}
              title="Archive / Terminate"
            >
              <Archive className="w-4 h-4 text-rose-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Employees Directory"
          description="Manage organizational workforce, view employee profiles, and onboard new talent."
          icon={<Users className="w-6 h-6 text-indigo-600" />}
        />
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmployees(true)}
            disabled={refreshing || loading}
            leftIcon={<RefreshCw className={`w-4 h-4 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />}
            className="bg-white hover:bg-slate-50 font-bold text-xs"
          >
            {refreshing ? 'Syncing...' : 'Sync'}
          </Button>
          <Link to="/employees/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 font-bold text-xs"
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

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
            <Spinner size="md" />
            <p className="text-xs font-semibold">Loading workforce from PostgreSQL database...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Employees Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              No employees match your current filter criteria. Click "Add Employee" above to onboard a team member.
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
