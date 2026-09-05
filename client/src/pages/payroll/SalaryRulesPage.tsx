import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calculator, Plus, Edit } from 'lucide-react';

const mockRules = [
  { id: 'r1', name: 'Basic Salary', category: 'Basic', code: 'BASIC', sequence: 1, type: 'Fixed', status: 'Active' },
  { id: 'r2', name: 'House Rent Allowance', category: 'Allowance', code: 'HRA', sequence: 2, type: 'Percentage (40% of BASIC)', status: 'Active' },
  { id: 'r3', name: 'Special Allowance', category: 'Allowance', code: 'SA', sequence: 3, type: 'Fixed', status: 'Active' },
  { id: 'r4', name: 'Provident Fund (Employee)', category: 'Deduction', code: 'PF_EMP', sequence: 4, type: 'Percentage (12% of BASIC)', status: 'Active' },
  { id: 'r5', name: 'Professional Tax', category: 'Deduction', code: 'PT', sequence: 5, type: 'Fixed (₹200)', status: 'Active' },
];

export const SalaryRulesPage: React.FC = () => {
  const [rules] = useState(mockRules);

  const columns: Column<typeof mockRules[0]>[] = [
    { header: 'Seq', accessor: 'sequence', render: item => <span className="font-mono text-slate-500">{item.sequence}</span> },
    { header: 'Rule Name', accessor: 'name', render: item => <span className="font-bold text-slate-900">{item.name}</span> },
    { header: 'Code', accessor: 'code', render: item => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{item.code}</span> },
    { header: 'Category', accessor: 'category', render: item => {
        const variant = item.category === 'Basic' ? 'info' : item.category === 'Allowance' ? 'success' : 'danger';
        return <Badge variant={variant}>{item.category}</Badge>;
    } },
    { header: 'Calculation Type', accessor: 'type', render: item => <span className="text-sm text-slate-600">{item.type}</span> },
    { header: 'Status', accessor: 'status', render: item => <Badge variant="success">{item.status}</Badge> },
    { header: 'Actions', accessor: 'id', render: item => (
        <Button variant="ghost" size="sm" title="Edit">
          <Edit className="w-4 h-4 text-slate-500" />
        </Button>
    ) }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Salary Rules"
        description="Configure computation rules for allowances, deductions, and basic pay."
        icon={<Calculator className="w-6 h-6" />}
        action={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Rule
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table 
          columns={columns as any}
          data={rules}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
};
