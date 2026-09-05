import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { mockEmployees, DEPARTMENTS, POSITIONS, STATUSES } from '../../features/employees/mockData';
import { Users, Search, Plus, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Local state for demonstration of frontend interactions
  const [employees, setEmployees] = useState(mockEmployees);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter ? emp.department === deptFilter : true;
    const matchesStatus = statusFilter ? emp.status === statusFilter : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if(window.confirm('Are you sure you want to archive this employee?')) {
      setEmployees(employees.map(emp => emp.id === id ? { ...emp, status: 'Archived' } : emp));
    }
  };

  const columns: Column<typeof mockEmployees[0]>[] = [
    {
      header: 'Employee',
      accessor: 'name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
            {item.avatar}
          </div>
          <div>
            <div className="font-bold text-slate-900">{item.name}</div>
            <div className="text-xs text-slate-500">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (item) => <span className="font-medium text-slate-700">{item.department}</span>
    },
    {
      header: 'Position',
      accessor: 'position',
      render: (item) => <span className="text-slate-600">{item.position}</span>
    },
    {
      header: 'Joining Date',
      accessor: 'joiningDate',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => {
        const variant = item.status === 'Active' ? 'success' : item.status === 'Inactive' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{item.status}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${item.id}`)} title="View Profile">
            <Eye className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" title="Edit">
            <Edit className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} title="Archive">
            <Trash2 className="w-4 h-4 text-rose-500" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Employees"
        description="Manage your workforce, view profiles, and update information."
        icon={<Users className="w-6 h-6" />}
        action={
          <Link to="/employees/new">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Add Employee
            </Button>
          </Link>
        }
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[
              { label: 'All Departments', value: '' },
              ...DEPARTMENTS.map(d => ({ label: d, value: d }))
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              ...STATUSES.map(s => ({ label: s, value: s }))
            ]}
          />
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table 
          columns={columns as any} // Using any to bypass strict type checking for mock data
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          emptyMessage="No employees found matching your criteria."
        />
      </div>
    </div>
  );
};
