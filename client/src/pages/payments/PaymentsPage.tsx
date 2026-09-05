import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Banknote, Search, Download, CheckCircle, RefreshCw } from 'lucide-react';

const mockPayments = [
  { id: 'pay1', employee: 'Rahul Sharma', amount: '₹72,400', date: '2026-09-01', method: 'Bank Transfer', ref: 'TRX-987654321', status: 'Completed' },
  { id: 'pay2', employee: 'Amit Patel', amount: '₹1,05,600', date: '2026-09-01', method: 'Bank Transfer', ref: 'TRX-987654322', status: 'Completed' },
  { id: 'pay3', employee: 'Neha Shah', amount: '₹85,200', date: '2026-09-01', method: 'Bank Transfer', ref: 'TRX-987654323', status: 'Processing' },
  { id: 'pay4', employee: 'Priya Mehta', amount: '₹38,000', date: '-', method: 'Bank Transfer', ref: '-', status: 'Pending' },
];

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = payments.filter(p => 
    p.employee.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.ref.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessAll = () => {
    setPayments(payments.map(p => p.status === 'Pending' ? { ...p, status: 'Processing', date: '2026-09-05', ref: 'TRX-PENDING' } : p));
  };

  const columns: Column<typeof mockPayments[0]>[] = [
    { header: 'Employee', accessor: 'employee', render: item => <span className="font-bold text-slate-900">{item.employee}</span> },
    { header: 'Amount', accessor: 'amount', render: item => <span className="font-medium text-slate-700">{item.amount}</span> },
    { header: 'Date', accessor: 'date' },
    { header: 'Method', accessor: 'method' },
    { header: 'Reference ID', accessor: 'ref', render: item => <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{item.ref}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: item => {
        const variant = item.status === 'Completed' ? 'success' : item.status === 'Processing' ? 'info' : item.status === 'Failed' ? 'danger' : 'warning';
        return <Badge variant={variant}>{item.status}</Badge>;
      } 
    },
    { 
      header: 'Actions', 
      accessor: 'id', 
      render: item => (
        item.status === 'Completed' ? (
          <Button variant="ghost" size="sm" title="Download Receipt">
            <Download className="w-4 h-4 text-slate-500" />
          </Button>
        ) : item.status === 'Pending' ? (
          <Button variant="ghost" size="sm" className="text-blue-600 font-semibold" onClick={() => setPayments(payments.map(p => p.id === item.id ? { ...p, status: 'Processing', date: '2026-09-05', ref: 'TRX-NEW' } : p))}>
            Process
          </Button>
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> In Progress</span>
        )
      ) 
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Payments"
        description="Track salary disbursements and bank transfers."
        icon={<Banknote className="w-6 h-6" />}
        action={
          <Button variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />} onClick={handleProcessAll}>
            Process Pending
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by employee or reference ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Processing', value: 'Processing' },
              { label: 'Pending', value: 'Pending' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table columns={columns as any} data={filteredData} keyExtractor={(item) => item.id} />
      </div>
    </div>
  );
};
