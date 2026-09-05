import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FileSpreadsheet, Search, Download, Eye } from 'lucide-react';

const mockPayslips = [
  { id: 'ps1', employee: 'Rahul Sharma', period: 'August 2026', gross: '₹80,000', net: '₹72,400', status: 'Paid' },
  { id: 'ps2', employee: 'Amit Patel', period: 'August 2026', gross: '₹1,20,000', net: '₹1,05,600', status: 'Paid' },
  { id: 'ps3', employee: 'Neha Shah', period: 'August 2026', gross: '₹95,000', net: '₹85,200', status: 'Paid' },
  { id: 'ps4', employee: 'Priya Mehta', period: 'August 2026', gross: '₹40,000', net: '₹38,000', status: 'Pending' },
];

export const PayslipsPage: React.FC = () => {
  const [payslips] = useState(mockPayslips);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = payslips.filter(ps => 
    ps.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<typeof mockPayslips[0]>[] = [
    { header: 'Employee', accessor: 'employee', render: item => <span className="font-bold text-slate-900">{item.employee}</span> },
    { header: 'Period', accessor: 'period', render: item => <span className="text-sm text-slate-600">{item.period}</span> },
    { header: 'Gross Salary', accessor: 'gross', render: item => <span className="font-medium text-slate-700">{item.gross}</span> },
    { header: 'Net Salary', accessor: 'net', render: item => <span className="font-bold text-emerald-700">{item.net}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: item => {
        const variant = item.status === 'Paid' ? 'success' : 'warning';
        return <Badge variant={variant}>{item.status}</Badge>;
      } 
    },
    { 
      header: 'Actions', 
      accessor: 'id', 
      render: item => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="View Payslip">
            <Eye className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" title="Download PDF">
            <Download className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Payslips"
        description="View, download, and manage employee payslips."
        icon={<FileSpreadsheet className="w-6 h-6" />}
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
            options={[
              { label: 'All Periods', value: '' },
              { label: 'August 2026', value: 'Aug' },
              { label: 'July 2026', value: 'Jul' }
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
