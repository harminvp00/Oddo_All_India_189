import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FileText, Plus, Search, Eye, Edit } from 'lucide-react';

const mockContracts = [
  { id: 'c1', employee: 'Rahul Sharma', type: 'Full Time', salary: '₹80,000', start: '2023-01-15', end: 'N/A', structure: 'Regular Monthly', status: 'Active' },
  { id: 'c2', employee: 'Amit Patel', type: 'Full Time', salary: '₹1,20,000', start: '2021-06-01', end: 'N/A', structure: 'Management Monthly', status: 'Active' },
  { id: 'c3', employee: 'Neha Shah', type: 'Full Time', salary: '₹95,000', start: '2022-03-10', end: 'N/A', structure: 'Management Monthly', status: 'Active' },
  { id: 'c4', employee: 'Nimesh Patel', type: 'Contract', salary: '₹40,000', start: '2024-02-20', end: '2024-08-20', structure: 'Contractual Fixed', status: 'Expired' },
];

export const ContractsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredContracts = mockContracts.filter(c => {
    const matchesSearch = c.employee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<typeof mockContracts[0]>[] = [
    {
      header: 'Employee',
      accessor: 'employee',
      render: (item) => <span className="font-bold text-slate-900">{item.employee}</span>
    },
    {
      header: 'Contract Type',
      accessor: 'type',
      render: (item) => <span className="text-sm text-slate-600">{item.type}</span>
    },
    {
      header: 'Salary',
      accessor: 'salary',
      render: (item) => <span className="font-medium text-slate-700">{item.salary}</span>
    },
    {
      header: 'Start Date',
      accessor: 'start',
    },
    {
      header: 'End Date',
      accessor: 'end',
      render: (item) => <span className={item.end !== 'N/A' ? 'text-orange-600 font-medium' : 'text-slate-400'}>{item.end}</span>
    },
    {
      header: 'Structure',
      accessor: 'structure',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => {
        const variant = item.status === 'Active' ? 'success' : item.status === 'Draft' ? 'neutral' : item.status === 'Expiring' ? 'warning' : 'danger';
        return <Badge variant={variant}>{item.status}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="View Details">
            <Eye className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" title="Edit">
            <Edit className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Contracts"
        description="Manage employee contracts, salaries, and validity periods."
        icon={<FileText className="w-6 h-6" />}
        action={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Contract
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by employee name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Active', value: 'Active' },
              { label: 'Draft', value: 'Draft' },
              { label: 'Expiring', value: 'Expiring' },
              { label: 'Expired', value: 'Expired' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table 
          columns={columns as any}
          data={filteredContracts}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
};
