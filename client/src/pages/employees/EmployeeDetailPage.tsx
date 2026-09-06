import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Spinner } from '../../components/ui/Spinner';
import { Alert } from '../../components/ui/Alert';
import { employeeService } from '../../services/employeeService';
import { contractService } from '../../services/contractService';
import { ContractModal } from '../contracts/ContractModal';
import { Modal } from '../../components/ui/Modal';
import { AvatarUpload } from '../../components/ui/AvatarUpload';
import { getStoredAvatar, setStoredAvatar } from '../../utils/avatarUtils';
import type { Employee, EmploymentStatus, Contract, EmployeeSummary } from '../../types';
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
  FileText,
  Plus,
  IndianRupee,
  CheckCircle2,
  CalendarDays,
  Layers,
  Activity,
  Award,
  Camera,
  Pencil,
  Archive,
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [employeeContracts, setEmployeeContracts] = useState<Contract[]>([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [empData, summaryData, contractsRes] = await Promise.all([
        employeeService.getEmployeeById(id),
        employeeService.getEmployeeSummary(id).catch(() => null),
        contractService.listContracts({ employeeId: id, limit: 20 }).catch(() => ({ items: [], meta: {} as any })),
      ]);
      setEmployee(empData);
      setAvatarUrl(empData?.avatarUrl || getStoredAvatar(id) || (empData?.employeeCode ? getStoredAvatar(empData.employeeCode) : null) || null);
      setSummary(summaryData);
      setEmployeeContracts(contractsRes?.items || []);
    } catch (err: any) {
      console.error('Failed to load employee details:', err);
      setError(err?.response?.data?.message || 'Employee profile not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSavePhoto = (newPhoto: string | null) => {
    if (!id || !employee) return;
    setAvatarUrl(newPhoto);
    if (newPhoto) {
      setStoredAvatar(id, newPhoto);
      setStoredAvatar(employee.employeeCode, newPhoto);
    }
    setIsPhotoModalOpen(false);
  };

  const handleArchive = async () => {
    if (!employee) return;
    if (!window.confirm(`Are you sure you want to archive/terminate employee "${employee.name}"?`)) {
      return;
    }
    try {
      await employeeService.deleteEmployee(employee.id);
      navigate('/employees');
    } catch (err: any) {
      console.error('Failed to archive employee:', err);
      alert(err?.response?.data?.message || err?.message || 'Failed to archive employee.');
    }
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance History' },
    { id: 'contract', label: 'Contracts & Overlap' },
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

  const initials = `${employee.firstName?.[0] || employee.name?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || 'EM';

  const statusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'> = {
    ACTIVE: 'success',
    ON_LEAVE: 'warning',
    SUSPENDED: 'danger',
    TERMINATED: 'neutral',
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-6xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs overflow-hidden">
        {/* Cover Banner */}
        <div className="h-32 sm:h-36 w-full bg-gradient-to-r from-[#714B67] via-[#5b3c53] to-slate-900 relative" />

        {/* Profile Card Body */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar floating over banner */}
              <div className="relative -mt-14 sm:-mt-16 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-xl shrink-0 ring-4 ring-white z-10 mx-auto sm:mx-0 group">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#714B67] to-slate-800 text-white font-extrabold text-2xl flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="absolute inset-1.5 rounded-xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                  title="Change profile picture"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Edit</span>
                </button>
              </div>

              {/* Identity & Badges: completely on the white card background */}
              <div className="pt-2 pb-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {employee.name}
                  </h1>
                  <span className="text-xs font-bold text-[#714B67] bg-[#714B67]/10 border border-[#714B67]/20 px-2.5 py-0.5 rounded-lg font-mono shadow-2xs">
                    {employee.employeeCode}
                  </span>
                  <Badge variant={statusVariantMap[employee.employmentStatus] || 'neutral'}>
                    {employee.employmentStatus ? employee.employmentStatus.replace('_', ' ') : 'ACTIVE'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-3.5 mt-2.5 justify-center sm:justify-start text-xs font-semibold text-slate-600">
                  {employee.position && (
                    <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{employee.position.title}</span>
                    </span>
                  )}
                  {employee.department && (
                    <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                      <Building2 className="w-3.5 h-3.5 text-violet-600" />
                      <span>{employee.department.name}</span>
                    </span>
                  )}
                  {employee.email && (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{employee.email}</span>
                    </span>
                  )}
                  {employee.phone && (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{employee.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0 justify-center sm:justify-end pb-1">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Pencil className="w-4 h-4" />}
                onClick={() => navigate(`/employees/${employee.id}/edit`)}
                className="bg-[#714B67] hover:bg-[#5b3c53] text-white font-bold text-xs"
                title="Edit employee details"
              >
                Edit Employee
              </Button>
              {employee.employmentStatus === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Archive className="w-4 h-4 text-rose-500" />}
                  onClick={handleArchive}
                  className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
                  title="Archive employee profile"
                >
                  Archive
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Camera className="w-4 h-4 text-slate-500" />}
                onClick={() => setIsPhotoModalOpen(true)}
                className="bg-white font-bold text-xs"
                title="Update profile picture"
              >
                Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
                onClick={() => navigate('/employees')}
                className="bg-white font-bold text-xs"
                title="Back to list"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 360° Employee Hub Summary Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 animate-fadeIn">
          {/* Active Compensation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Compensation</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900">
                {summary.activeContract ? `₹${summary.activeContract.wage?.toLocaleString('en-IN')}` : 'No Active CTC'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {summary.activeContract ? summary.activeContract.salaryStructureName : 'Under Draft / Unassigned'}
              </div>
            </div>
          </div>

          {/* Attendance Days */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Attendance Logged</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900">{summary.counts?.attendanceDays ?? 0} Days</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Verified Check-ins</div>
            </div>
          </div>

          {/* Leave Quota & Balance */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Leave Balance</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900">{summary.counts?.remainingLeaveDays ?? 0} Days Left</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {summary.counts?.approvedLeaves ?? 0} leaves approved
              </div>
            </div>
          </div>

          {/* Payslips & Contracts Count */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Payroll & Records</span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-slate-900">{summary.counts?.payslips ?? 0} Payslips</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {summary.counts?.contracts ?? 0} contracts issued
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <div className="font-bold text-slate-900 mt-0.5">{employee.employeeType ? employee.employeeType.replace('_', ' ') : '-'}</div>
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
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Employment Contracts</h3>
                  <p className="text-xs text-slate-500">Active contracts, salary structures, and overlap history for this employee.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsContractModalOpen(true)}
                >
                  Issue New Contract
                </Button>
              </div>

              {employeeContracts.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200/70 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Contracts Issued Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click "Issue New Contract" above to define wage, salary structure, and effective dates for {employee.name}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employeeContracts.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {c.contractNumber}
                        </span>
                        <Badge
                          variant={
                            c.status === 'ACTIVE'
                              ? 'success'
                              : c.status === 'DRAFT'
                              ? 'neutral'
                              : c.status === 'EXPIRED'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <div className="text-xs text-slate-400">Monthly Compensation</div>
                        <div className="font-black text-lg text-emerald-600 mt-0.5">
                          ₹{Number(c.wage).toLocaleString('en-IN')}{' '}
                          <span className="text-xs text-slate-400 font-normal">INR / month</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <div className="text-slate-400">Structure</div>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {c.salaryStructure?.name || 'Standard CTC'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Period</div>
                          <div className="font-bold text-slate-800 mt-0.5">
                            {c.startDate} → {c.endDate || 'Open-ended'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Issue Contract Modal */}
      {isContractModalOpen && (
        <ContractModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          onSuccess={loadData}
          defaultEmployeeId={employee.id}
        />
      )}

      {/* Change Photo Modal */}
      {isPhotoModalOpen && (
        <Modal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          title={`Update Profile Photo: ${employee.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              initials={initials}
              onAvatarChange={handleSavePhoto}
            />
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setIsPhotoModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeDetailPage;
