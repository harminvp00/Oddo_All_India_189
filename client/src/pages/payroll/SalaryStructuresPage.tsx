import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Settings2, Plus, Edit, Eye } from 'lucide-react';

const mockStructures = [
  { id: 'st1', name: 'Regular Monthly', type: 'Monthly', rulesCount: 5, status: 'Active' },
  { id: 'st2', name: 'Management Monthly', type: 'Monthly', rulesCount: 7, status: 'Active' },
  { id: 'st3', name: 'Contractual Fixed', type: 'Fixed', rulesCount: 2, status: 'Active' },
];

export const SalaryStructuresPage: React.FC = () => {
  const [structures] = useState(mockStructures);

  const columns: Column<typeof mockStructures[0]>[] = [
    {
      header: 'Structure Name',
      accessor: 'name',
      render: (item) => <span className="font-bold text-slate-900">{item.name}</span>
    },
    {
      header: 'Type',
      accessor: 'type',
    },
    {
      header: 'Rules Included',
      accessor: 'rulesCount',
      render: (item) => <Badge variant="neutral">{item.rulesCount} Rules</Badge>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => <Badge variant="success">{item.status}</Badge>
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
        title="Salary Structures"
        description="Define and manage different compensation structures."
        icon={<Settings2 className="w-6 h-6" />}
        action={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Structure
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table 
          columns={columns as any}
          data={structures}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
};
