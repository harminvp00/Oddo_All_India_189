import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calculator, Plus, Eye, CheckCircle } from 'lucide-react';

const mockPayruns = [
  { id: 'pr1', name: 'August 2026 Salary', period: '01 Aug - 31 Aug 2026', type: 'Monthly', count: 124, status: 'Completed', amount: '₹42,50,000' },
  { id: 'pr2', name: 'September 2026 Salary', period: '01 Sep - 30 Sep 2026', type: 'Monthly', count: 124, status: 'Draft', amount: '₹42,80,000' },
];

export const PayrunsPage: React.FC = () => {
  const [payruns] = useState(mockPayruns);
  const navigate = useNavigate();

  const columns: Column<typeof mockPayruns[0]>[] = [
    { header: 'Payrun Name', accessor: 'name', render: item => <span className="font-bold text-slate-900">{item.name}</span> },
    { header: 'Period', accessor: 'period', render: item => <span className="text-sm text-slate-600">{item.period}</span> },
    { header: 'Employees', accessor: 'count', render: item => <span className="font-medium text-slate-700">{item.count}</span> },
    { header: 'Total Amount', accessor: 'amount', render: item => <span className="font-bold text-slate-900">{item.amount}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: item => {
        const variant = item.status === 'Completed' ? 'success' : item.status === 'Processing' ? 'warning' : 'neutral';
        return <Badge variant={variant}>{item.status}</Badge>;
      } 
    },
    { 
      header: 'Actions', 
      accessor: 'id', 
      render: item => (
        <div className="flex items-center gap-2">
          {item.status === 'Draft' ? (
            <Button variant="ghost" size="sm" className="text-blue-600" title="Continue Draft">
              Continue
            </Button>
          ) : (
            <Button variant="ghost" size="sm" title="View Details">
              <Eye className="w-4 h-4 text-slate-500" />
            </Button>
          )}
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Payruns"
        description="Manage batch payroll processing for your organization."
        icon={<Calculator className="w-6 h-6" />}
        action={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/payroll/payruns/new')}>
            Create Payrun
          </Button>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table columns={columns as any} data={payruns} keyExtractor={(item) => item.id} />
      </div>
    </div>
  );
};
