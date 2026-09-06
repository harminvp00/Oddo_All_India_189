import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import {
  PieChart,
  Download,
  FileText,
  Users,
  Calculator,
  Banknote,
  TrendingUp,
  Building2,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  downloadReportPdf,
  downloadExecutiveSummaryPdf,
  REPORT_DATA_MAP,
  type ReportDataset,
} from '../../utils/reportPdf';

interface ReportModule {
  id: string;
  title: string;
  category: 'PAYROLL' | 'WORKFORCE' | 'COMPLIANCE';
  description: string;
  recordCount: string;
  lastGenerated: string;
  icon: React.ReactNode;
}

const REPORT_MODULES: ReportModule[] = [
  {
    id: 'rep-1',
    title: 'Monthly Payroll Expense Summary',
    category: 'PAYROLL',
    description: 'Comprehensive breakdown of gross pay, statutory PF/PT/TDS deductions, and net payouts across all departments.',
    recordCount: '124 Employees',
    lastGenerated: 'Today at 10:30 AM',
    icon: <Calculator className="w-5 h-5 text-[#714B67]" />,
  },
  {
    id: 'rep-2',
    title: 'Department Cost & Headcount Distribution',
    category: 'WORKFORCE',
    description: 'Comparative analysis of compensation spend, average wage, and headcount allocation per department.',
    recordCount: '6 Departments',
    lastGenerated: 'Yesterday',
    icon: <Building2 className="w-5 h-5 text-teal-700" />,
  },
  {
    id: 'rep-3',
    title: 'Attendance & Loss of Pay (LOP) Audit',
    category: 'WORKFORCE',
    description: 'Detailed roster of employee check-in compliance, leave balance utilization, and salary deductions.',
    recordCount: '124 Records',
    lastGenerated: '05 Sep 2026',
    icon: <Users className="w-5 h-5 text-indigo-600" />,
  },
  {
    id: 'rep-4',
    title: 'Statutory Tax & PF Compliance (Form 16/24Q)',
    category: 'COMPLIANCE',
    description: 'Tax deductions at source, Provident Fund employer/employee contributions, and statutory liability filings.',
    recordCount: '₹4.8L Liabilities',
    lastGenerated: '30 Aug 2026',
    icon: <FileText className="w-5 h-5 text-amber-600" />,
  },
  {
    id: 'rep-5',
    title: 'Bank Payment Remittance & Reconciliation',
    category: 'PAYROLL',
    description: 'Direct salary NEFT disbursement audit, UTR transaction status, and return/failure reconciliation.',
    recordCount: '124 Transfers',
    lastGenerated: '30 Aug 2026',
    icon: <Banknote className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: 'rep-6',
    title: 'Employment Contract & Wage Variance',
    category: 'COMPLIANCE',
    description: 'Historical wage increases, contract renewals, and schedule compensation variance across quarters.',
    recordCount: '89 In-Force Contracts',
    lastGenerated: '15 Aug 2026',
    icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
  },
];

const DEPT_SPEND_DATA = [
  { name: 'Engineering', spend: '₹22.4L', pct: 49, count: 52 },
  { name: 'Product & Design', spend: '₹7.8L', pct: 17, count: 18 },
  { name: 'Sales & Marketing', spend: '₹6.5L', pct: 14, count: 24 },
  { name: 'Finance & Legal', spend: '₹4.5L', pct: 10, count: 14 },
  { name: 'Human Resources', spend: '₹4.0L', pct: 9, count: 16 },
];

export const ReportsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState('2026-09');
  const [previewReport, setPreviewReport] = useState<ReportDataset | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const getPeriodLabel = (val: string) => {
    if (val === '2026-09') return 'September 2026';
    if (val === '2026-08') return 'August 2026';
    if (val === 'YTD') return 'FY 2026-27 YTD';
    return val;
  };

  const handleDownloadPdf = (reportId: string, reportTitle: string) => {
    try {
      const periodLabel = getPeriodLabel(dateRange);
      const filename = downloadReportPdf(reportId, periodLabel);
      setDownloadSuccessMsg(`Downloaded "${reportTitle}" as PDF (${filename}) successfully!`);
    } catch (err: any) {
      console.error('Failed to download report PDF:', err);
    }
  };

  const handleDownloadExecutivePdf = () => {
    try {
      const periodLabel = getPeriodLabel(dateRange);
      const filename = downloadExecutiveSummaryPdf(periodLabel);
      setDownloadSuccessMsg(`Downloaded Executive Master Report as PDF (${filename}) successfully!`);
    } catch (err: any) {
      console.error('Failed to download executive PDF:', err);
    }
  };

  const handleViewData = (reportId: string) => {
    const data = REPORT_DATA_MAP[reportId] || REPORT_DATA_MAP['rep-1'];
    setPreviewReport(data);
  };

  const filteredReports = REPORT_MODULES.filter(
    (rep) => selectedCategory === 'ALL' || rep.category === selectedCategory
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Reports & Analytics Center"
        description="Extract enterprise intelligence, workforce demographics, statutory compliance filings, and payroll ledgers."
        icon={<PieChart className="w-6 h-6 text-[#714B67]" />}
        action={
          <Button
            variant="primary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadExecutivePdf}
            title="Download Executive Master Report (PDF)"
          >
            Export Executive PDF
          </Button>
        }
      />

      {/* Success Notification Alert */}
      {downloadSuccessMsg && (
        <Alert
          variant="success"
          title="PDF Generated & Downloaded"
          onClose={() => setDownloadSuccessMsg(null)}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
        </Alert>
      )}

      {/* Analytics Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payroll Cost Trend Chart */}
        <Card className="lg:col-span-2 border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Monthly Payroll Spend Trend (FY 2026-27)
              </CardTitle>
              <p className="text-xs text-slate-500">Gross spend vs Net disbursements</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#714B67]" /> Gross
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Net Pay
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* SVG Visual Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
              {[
                { month: 'Apr', gross: 38, net: 34 },
                { month: 'May', gross: 39, net: 35 },
                { month: 'Jun', gross: 41, net: 37 },
                { month: 'Jul', gross: 43.2, net: 38.6 },
                { month: 'Aug', gross: 44.1, net: 39.4 },
                { month: 'Sep', gross: 45.2, net: 40.4 },
              ].map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{item.gross}L
                  </div>
                  <div className="w-full flex items-end justify-center gap-1.5 h-32">
                    <div
                      className="w-3.5 bg-[#714B67] rounded-t transition-all group-hover:brightness-110"
                      style={{ height: `${(item.gross / 50) * 100}%` }}
                    />
                    <div
                      className="w-3.5 bg-teal-600 rounded-t transition-all group-hover:brightness-110"
                      style={{ height: `${(item.net / 50) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{item.month}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 text-xs text-slate-500">
              <span>Average Monthly Run-rate: <strong>₹41.8L</strong></span>
              <span className="text-emerald-600 font-semibold">+18.9% YoY Growth</span>
            </div>
          </CardContent>
        </Card>

        {/* Department Cost Distribution Card */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Department Cost Allocation
            </CardTitle>
            <p className="text-xs text-slate-500">Share of monthly compensation budget</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {DEPT_SPEND_DATA.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{dept.name}</span>
                  <span className="font-bold text-slate-900">{dept.spend} ({dept.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#714B67] h-full rounded-full"
                    style={{ width: `${dept.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Filter and Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          {['ALL', 'PAYROLL', 'WORKFORCE', 'COMPLIANCE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#714B67] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full sm:w-48 text-xs font-semibold"
            options={[
              { label: 'September 2026', value: '2026-09' },
              { label: 'August 2026', value: '2026-08' },
              { label: 'FY 2026-27 YTD', value: 'YTD' },
            ]}
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className="border-slate-200/80 shadow-xs hover:border-[#714B67]/40 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {report.icon}
                </div>
                <Badge
                  variant={
                    report.category === 'PAYROLL'
                      ? 'purple'
                      : report.category === 'WORKFORCE'
                      ? 'teal'
                      : 'warning'
                  }
                >
                  {report.category}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 mt-3">
                {report.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                {report.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Scope: <strong>{report.recordCount}</strong></span>
                <span>{report.lastGenerated}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => handleViewData(report.id)}
                  title="View Data Roster"
                >
                  View Data
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleDownloadPdf(report.id, report.title)}
                  title="Download PDF Report"
                >
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Report Data Preview Modal */}
      {previewReport && (
        <Modal
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={previewReport.title}
          description={`${previewReport.subtitle} • Period: ${getPeriodLabel(dateRange)}`}
          maxWidth="full"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="text-xs text-slate-500 text-left">
                {previewReport.notes || 'All entries electronically verified by PeoplePay360.'}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewReport(null)}
                >
                  Close Preview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleDownloadPdf(previewReport.id, previewReport.title)}
                  title="Download PDF Statement"
                >
                  Download PDF
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {previewReport.kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {kpi.label}
                  </div>
                  <div className="text-base font-extrabold text-[#714B67]">
                    {kpi.value}
                  </div>
                  {kpi.subtext && (
                    <div className="text-[10px] text-slate-500">
                      {kpi.subtext}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Table View */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#714B67] text-white font-bold sticky top-0 z-10">
                    <tr>
                      {previewReport.columns.map((col) => (
                        <th
                          key={col.key}
                          className={`py-2.5 px-3 whitespace-nowrap text-[11px] ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          }`}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {previewReport.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {previewReport.columns.map((col) => {
                          const val = String(row[col.key] ?? '—');
                          const isStatus = col.key === 'status' || col.key === 'result';
                          const isSuccess =
                            val.includes('PAID') ||
                            val.includes('SUCCESS') ||
                            val.includes('COMPLIANT') ||
                            val.includes('ACTIVE') ||
                            val.includes('SETTLED');
                          const isDanger = val.includes('LOP') || val.includes('REJECTED');

                          return (
                            <td
                              key={col.key}
                              className={`py-2 px-3 whitespace-nowrap ${
                                col.align === 'right'
                                  ? 'text-right font-mono'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {isStatus ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isSuccess
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isDanger
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {val}
                                </span>
                              ) : (
                                <span className="text-slate-800 font-medium">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Total Row */}
                    {previewReport.totalRow && (
                      <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                        {previewReport.columns.map((col) => {
                          const val = String(previewReport.totalRow![col.key] ?? '');
                          return (
                            <td
                              key={col.key}
                              className={`py-2.5 px-3 whitespace-nowrap text-slate-900 ${
                                col.align === 'right'
                                  ? 'text-right font-mono'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ReportsPage;

