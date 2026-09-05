import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PieChart, Download, FileText, Users, Calculator, Banknote } from 'lucide-react';

const mockReports = [
  { id: 'rep1', title: 'Monthly Payroll Summary', description: 'Comprehensive breakdown of gross pay, deductions, and net pay across all departments.', icon: <Calculator className="w-6 h-6 text-blue-500" /> },
  { id: 'rep2', title: 'Department Cost Distribution', description: 'Analysis of payroll expenses distributed by individual departments.', icon: <PieChart className="w-6 h-6 text-purple-500" /> },
  { id: 'rep3', title: 'Employee Attendance & Leaves', description: 'Detailed report on attendance rates, LOPs, and leave balances.', icon: <Users className="w-6 h-6 text-emerald-500" /> },
  { id: 'rep4', title: 'Tax & Compliance', description: 'Statutory deductions (PF, PT, TDS) for compliance filing.', icon: <FileText className="w-6 h-6 text-orange-500" /> },
  { id: 'rep5', title: 'Payment Reconciliation', description: 'Bank transfer statuses, failed payments, and reference IDs.', icon: <Banknote className="w-6 h-6 text-indigo-500" /> },
];

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Reports & Analytics"
        description="Generate and download insights for HR and Payroll data."
        icon={<PieChart className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockReports.map(report => (
          <Card key={report.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {report.icon}
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-sm text-slate-500 mb-6">{report.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-xs">View Data</Button>
                <Button variant="primary" className="flex-1 text-xs" leftIcon={<Download className="w-4 h-4" />}>CSV / PDF</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
