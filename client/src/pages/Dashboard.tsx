import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  CalendarClock, 
  Banknote, 
  Clock,
  AlertTriangle,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { brand } from '../config/brand';

const KPI_DATA = [
  { label: 'Total Employees', value: '124', icon: <Users className="w-5 h-5 text-blue-600" />, trend: '+4 this month' },
  { label: 'Present Today', value: '112', icon: <UserCheck className="w-5 h-5 text-emerald-600" />, trend: '90% attendance' },
  { label: 'On Leave', value: '8', icon: <UserMinus className="w-5 h-5 text-orange-600" />, trend: '3 sick leave' },
  { label: 'Pending Leave', value: '14', icon: <CalendarClock className="w-5 h-5 text-purple-600" />, trend: 'Needs approval' },
  { label: 'Monthly Payroll', value: '₹4.2M', icon: <Banknote className="w-5 h-5 text-slate-600" />, trend: '+2% vs last' },
  { label: 'Pending Payments', value: '3', icon: <Clock className="w-5 h-5 text-rose-600" />, trend: 'Due today' },
];

const RECENT_EMPLOYEES = [
  { name: 'Neha Shah', position: 'Software Engineer', date: '2 days ago' },
  { name: 'Amit Patel', position: 'Product Manager', date: '5 days ago' },
  { name: 'Priya Mehta', position: 'HR Executive', date: '1 week ago' },
];

const PAYROLL_ALERTS = [
  { message: '3 employees missing bank details', type: 'error' },
  { message: '2 contracts expiring soon', type: 'warning' },
  { message: 'Pending payroll approvals', type: 'info' },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Good morning, {user?.name?.split(' ')[0] || 'Rahul'}</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Here's what's happening across your organization.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_DATA.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow border-slate-200/60">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-slate-50 rounded-lg">{kpi.icon}</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{kpi.value}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{kpi.label}</div>
                <div className="text-[10px] font-medium text-slate-400 mt-1">{kpi.trend}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 border-slate-200/60">
          <CardHeader>
            <CardTitle>Attendance & Leave Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* CSS-based Mock Chart */}
            <div className="h-64 flex items-end gap-2 pt-4">
              {[60, 80, 45, 90, 75, 100, 85].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group">
                  <div className="w-full bg-[var(--brand-soft)] rounded-t-md relative h-full flex items-end">
                    <div 
                      className="w-full bg-[var(--brand)] rounded-t-md transition-all duration-500 hover:bg-[var(--brand-hover)] cursor-pointer"
                      style={{ height: `${h}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded transition-opacity">
                      {h}%
                    </div>
                  </div>
                  <div className="text-center text-[10px] font-semibold text-slate-400 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Action Items */}
        <Card className="border-slate-200/60 flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <CardTitle>Attention Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {PAYROLL_ALERTS.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.type === 'error' ? 'bg-rose-500' : 
                    alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">{alert.message}</p>
                    <button className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-wider mt-1 hover:underline">
                      Review Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle>Recent Onboarding</CardTitle>
            <button className="text-xs font-bold text-[var(--brand)] flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {RECENT_EMPLOYEES.map((emp, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{emp.name}</div>
                      <div className="text-xs text-slate-500 font-medium">{emp.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{emp.date}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card className="border-slate-200/60">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { name: 'Engineering', count: 45, width: '45%', color: 'bg-blue-500' },
                { name: 'Sales', count: 32, width: '32%', color: 'bg-emerald-500' },
                { name: 'Marketing', count: 28, width: '28%', color: 'bg-purple-500' },
                { name: 'HR & Admin', count: 19, width: '19%', color: 'bg-orange-500' },
              ].map((dept, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700">{dept.name}</span>
                    <span className="text-slate-500">{dept.count} Employees</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${dept.color} h-2 rounded-full`} style={{ width: dept.width }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
