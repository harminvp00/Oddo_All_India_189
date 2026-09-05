import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { employeeService } from '../../services/employeeService';
import type { Employee, EmploymentStatus } from '../../types';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Calendar, 
  CreditCard,
  UserCheck,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployee() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await employeeService.getEmployeeById(id);
        setEmployee(data);
      } catch (err: any) {
        console.error('Failed to load employee details:', err);
        setError(err?.response?.data?.message || 'Employee profile not found or access denied.');
      } finally {
        setLoading(false);
      }
    }
    loadEmployee();
  }, [id]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance History' },
    { id: 'contract', label: 'Contract & Schedule' },
    { id: 'payroll', label: 'Bank & Payroll' },
  ];

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-bold text-slate-600">Loading employee profile from database...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto p-6">
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
        <Alert variant="danger" title="Not Found">
          {error || 'Employee profile not found.'}
        </Alert>
      </div>
    );
  }

  const initials = `${employee.firstName[0] || ''}${employee.lastName[0] || ''}`.toUpperCase();

  const statusVariantMap: Record<EmploymentStatus, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'> = {
    ACTIVE: 'success',
    ON_LEAVE: 'warning',
    SUSPENDED: 'danger',
    TERMINATED: 'neutral',
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900" />
        
        <div className="relative mt-10 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end">
            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg shrink-0">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center">
                {initials}
              </div>
            </div>
            <div className="pb-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-extrabold text-slate-900">{employee.name}</h1>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                  {employee.employeeCode}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5 items-center mt-2 justify-center sm:justify-start text-xs font-medium text-slate-600">
                <Badge variant={statusVariantMap[employee.employmentStatus] || 'neutral'}>
                  {employee.employmentStatus.replace('_', ' ')}
                </Badge>
                {employee.position && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <Briefcase className="w-3.5 h-3.5 text-violet-500" /> {employee.position.title}
                  </span>
                )}
                {employee.department && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" /> {employee.department.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
              onClick={() => navigate('/employees')}
              className="bg-white font-bold text-xs"
            >
              Back to List
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        <div className="px-3 pt-3">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        
        <div className="p-6 bg-slate-50/40 min-h-[350px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fadeIn">
              {/* Contact Information */}
              <Card className="border-slate-200/70 shadow-none rounded-2xl">
                <CardContent className="p-5 space-y-3.5">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" /> Contact Details
                  </h3>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Email Address</div>
                    <div className="font-bold text-slate-900 mt-0.5">{employee.email || 'Not provided'}</div>
                  </div>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Phone Number</div>
                    <div className="font-bold text-slate-900 mt-0.5">{employee.phone || 'Not provided'}</div>
                  </div>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Date of Birth</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Hierarchy */}
              <Card className="border-slate-200/70 shadow-none rounded-2xl">
                <CardContent className="p-5 space-y-3.5">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-violet-500" /> Employment Hierarchy
                  </h3>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Joining Date</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Reporting Manager</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {employee.manager ? `${employee.manager.name} (${employee.manager.employeeCode})` : 'Top Level (Direct)'}
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Employee Type</div>
                    <div className="font-bold text-slate-900 mt-0.5">{employee.employeeType.replace('_', ' ')}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Schedule Card */}
              <Card className="border-slate-200/70 shadow-none rounded-2xl">
                <CardContent className="p-5 space-y-3.5">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Working Shift & Schedule
                  </h3>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Assigned Shift</div>
                    <div className="font-bold text-slate-900 mt-0.5">{employee.schedule?.name || 'Standard Schedule'}</div>
                  </div>
                  <div className="text-sm text-slate-700 font-medium">
                    <div className="text-xs text-slate-400">Weekly Standard Hours</div>
                    <div className="font-bold text-emerald-600 mt-0.5">{employee.schedule?.weeklyHours || 40} hours / week</div>
                  </div>
                </CardContent>
              </Card>

              {/* Bank & Salary Details */}
              <Card className="border-slate-200/70 shadow-none rounded-2xl">
                <CardContent className="p-5 space-y-3.5">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Bank & Settlement Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Bank Name</div>
                      <div className="font-bold text-slate-900 mt-0.5">{employee.bankName || 'Not configured'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Account Number</div>
                      <div className="font-bold text-slate-900 mt-0.5">{employee.bankAccountNumber || 'Not configured'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">IFSC Code</div>
                      <div className="font-bold text-slate-900 mt-0.5">{employee.ifscCode || 'Not configured'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Account Name</div>
                      <div className="font-bold text-slate-900 mt-0.5">{employee.bankAccountName || employee.name}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-bold">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Records Linked</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Total attendance entries recorded in PostgreSQL: <strong className="text-slate-800">{employee.totalAttendance || 0} days</strong>.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attendance')}
                className="mt-2 text-xs font-bold"
              >
                View in Live Attendance Kiosk
              </Button>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Contract & Shift Schedule</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Assigned to: <strong className="text-slate-800">{employee.schedule?.name || 'Default 40h Standard'}</strong> ({employee.employeeType.replace('_', ' ')}).
              </p>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Bank & Payment Accounts</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bank: {employee.bankName || 'HDFC Bank'} | A/C: {employee.bankAccountNumber || 'Provided at onboarding'} | IFSC: {employee.ifscCode || 'HDFC0001234'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
