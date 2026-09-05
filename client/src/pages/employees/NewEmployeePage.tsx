import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { employeeService } from '../../services/employeeService';
import { DepartmentService } from '../../services/departmentService';
import { PositionService } from '../../services/positionService';
import { ScheduleService } from '../../services/scheduleService';
import type { 
  Department, 
  JobPosition, 
  WorkingSchedule, 
  Employee, 
  CreateEmployeeDTO,
  EmployeeType,
  EmploymentStatus 
} from '../../types';
import { AvatarUpload } from '../../components/ui/AvatarUpload';
import { setStoredAvatar } from '../../utils/avatarUtils';
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Building2, 
  Briefcase, 
  CreditCard, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  ShieldCheck,
  Camera
} from 'lucide-react';

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();

  // Reference data loaded from live backend
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<CreateEmployeeDTO>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: todayStr,
    employeeCode: '',
    employeeType: 'FULL_TIME',
    employmentStatus: 'ACTIVE',
    departmentId: '',
    positionId: '',
    managerId: '',
    scheduleId: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    ifscCode: '',
    avatarUrl: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load live departments, positions, schedules, and managers
  useEffect(() => {
    async function loadOptions() {
      try {
        setInitialLoading(true);
        const [deptRes, posRes, schedRes, empRes] = await Promise.all([
          DepartmentService.listDepartments({ limit: 100, isActive: 'true' }),
          PositionService.listPositions({ limit: 100, isActive: 'true' }),
          ScheduleService.listSchedules({ limit: 100, isActive: 'true' }),
          employeeService.listEmployees({ limit: 100, status: 'ACTIVE' }),
        ]);

        if (deptRes.success) setDepartments(deptRes.data);
        if (posRes.success) setPositions(posRes.data);
        if (schedRes.success) setSchedules(schedRes.data);
        setManagers(empRes.items || []);

        // Pre-select defaults if available
        if (deptRes.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            departmentId: prev.departmentId || deptRes.data[0].id,
          }));
        }
        if (posRes.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            positionId: prev.positionId || posRes.data[0].id,
          }));
        }
        if (schedRes.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            scheduleId: prev.scheduleId || schedRes.data[0].id,
          }));
        }
      } catch (err: any) {
        console.error('Failed to load employee creation options:', err);
        setError('Failed to fetch organizational metadata from server.');
      } finally {
        setInitialLoading(false);
      }
    }

    loadOptions();
  }, []);

  const handleChange = (field: keyof CreateEmployeeDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and Last name are mandatory.');
      return;
    }

    if (!formData.hireDate) {
      setError('Joining / Hire date is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload: CreateEmployeeDTO = {
        ...formData,
        employeeCode: formData.employeeCode?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        managerId: formData.managerId || undefined,
        scheduleId: formData.scheduleId || undefined,
        bankAccountName: formData.bankAccountName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankName: formData.bankName?.trim() || undefined,
        ifscCode: formData.ifscCode?.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      };

      const created = await employeeService.createEmployee(payload);

      // Persist profile picture locally for instant rendering
      if (avatarUrl) {
        setStoredAvatar(created.id, avatarUrl);
        setStoredAvatar(created.employeeCode, avatarUrl);
      }

      setSuccessMsg(`Employee ${created.name} (${created.employeeCode}) onboarded successfully!`);

      // Redirect after short delay
      setTimeout(() => {
        navigate('/employees');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create employee:', err);
      setError(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Failed to create employee profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-5xl mx-auto">
      <PageHeader
        title="Add New Employee"
        description="Onboard a new team member with automated code generation, working shifts, and payroll provisioning."
        icon={<UserPlus className="w-6 h-6 text-indigo-600" />}
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
            onClick={() => navigate('/employees')}
            className="bg-white font-bold text-xs"
          >
            Back to Directory
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" title="Employee Creation Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" title="Success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {initialLoading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/70 shadow-xs">
          <Spinner size="lg" />
          <p className="text-xs font-bold text-slate-600">Loading organizational metadata (Departments, Positions, Shifts)...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 0: Profile Photo & Avatar */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-slate-900">Profile Photograph</CardTitle>
                <p className="text-[11px] text-slate-500 font-medium">Upload employee profile image or specify a photo URL</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                initials={`${formData.firstName?.[0] || 'E'}${formData.lastName?.[0] || 'P'}`.toUpperCase()}
                onAvatarChange={(newUrl) => setAvatarUrl(newUrl)}
              />
            </CardContent>
          </Card>

          {/* Card 1: Personal Information */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-slate-900">Personal & Contact Information</CardTitle>
                <p className="text-[11px] text-slate-500 font-medium">Basic identity details for payroll and system communications</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="FIRST NAME"
                required
                placeholder="e.g. Rahul"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
              <Input
                label="LAST NAME"
                required
                placeholder="e.g. Sharma"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
              <Input
                label="WORK EMAIL ADDRESS"
                type="email"
                placeholder="rahul.sharma@peoplepay360.com"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                helperText="A system login user account will automatically be created/linked"
              />
              <Input
                label="PHONE NUMBER"
                placeholder="+91 98765 43210"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              <Input
                label="DATE OF BIRTH"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Card 2: Employment & Hierarchy Details */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-slate-900">Employment & Organizational Hierarchy</CardTitle>
                <p className="text-[11px] text-slate-500 font-medium">Assign department, job title, working shift, and reporting manager</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="EMPLOYEE CODE (OPTIONAL)"
                placeholder="Leave blank for auto-generation (e.g. EMP0008)"
                value={formData.employeeCode || ''}
                onChange={(e) => handleChange('employeeCode', e.target.value)}
                helperText="Auto-assigned sequentially if left empty"
              />

              <Input
                label="JOINING / HIRE DATE"
                type="date"
                required
                value={formData.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
              />

              <Select
                label="DEPARTMENT"
                required
                value={formData.departmentId || ''}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                options={[
                  { label: 'Select Department', value: '' },
                  ...departments.map((d) => ({
                    label: `${d.name} (${d.code})`,
                    value: d.id,
                  })),
                ]}
              />

              <Select
                label="JOB POSITION / DESIGNATION"
                required
                value={formData.positionId || ''}
                onChange={(e) => handleChange('positionId', e.target.value)}
                options={[
                  { label: 'Select Job Position', value: '' },
                  ...positions.map((p) => ({
                    label: p.title,
                    value: p.id,
                  })),
                ]}
              />

              <Select
                label="WORKING SCHEDULE / SHIFT"
                value={formData.scheduleId || ''}
                onChange={(e) => handleChange('scheduleId', e.target.value)}
                options={[
                  { label: 'Select Schedule', value: '' },
                  ...schedules.map((s) => ({
                    label: `${s.name} (${s.weeklyHours}h/wk)`,
                    value: s.id,
                  })),
                ]}
              />

              <Select
                label="REPORTING MANAGER (OPTIONAL)"
                value={formData.managerId || ''}
                onChange={(e) => handleChange('managerId', e.target.value)}
                options={[
                  { label: 'None (Top Level / Self Managed)', value: '' },
                  ...managers.map((m) => ({
                    label: `${m.name} (${m.employeeCode})`,
                    value: m.id,
                  })),
                ]}
              />

              <Select
                label="EMPLOYEE TYPE"
                required
                value={formData.employeeType || 'FULL_TIME'}
                onChange={(e) => handleChange('employeeType', e.target.value as EmployeeType)}
                options={[
                  { label: 'Full Time', value: 'FULL_TIME' },
                  { label: 'Part Time', value: 'PART_TIME' },
                  { label: 'Contractor', value: 'CONTRACT' },
                  { label: 'Intern', value: 'INTERN' },
                  { label: 'Temporary', value: 'TEMPORARY' },
                ]}
              />

              <Select
                label="EMPLOYMENT STATUS"
                required
                value={formData.employmentStatus || 'ACTIVE'}
                onChange={(e) => handleChange('employmentStatus', e.target.value as EmploymentStatus)}
                options={[
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'On Leave', value: 'ON_LEAVE' },
                  { label: 'Suspended', value: 'SUSPENDED' },
                  { label: 'Terminated', value: 'TERMINATED' },
                ]}
              />
            </CardContent>
          </Card>

          {/* Card 3: Bank & Payroll Information */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-slate-900">Bank & Salary Account Details</CardTitle>
                <p className="text-[11px] text-slate-500 font-medium">Required for automated monthly payrun processing and direct bank transfers</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="BANK NAME"
                placeholder="e.g. HDFC Bank, ICICI Bank"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
              />
              <Input
                label="ACCOUNT HOLDER NAME"
                placeholder="e.g. Rahul Sharma"
                value={formData.bankAccountName || ''}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
              />
              <Input
                label="ACCOUNT NUMBER"
                placeholder="e.g. 5010049281923"
                value={formData.bankAccountNumber || ''}
                onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
              />
              <Input
                label="IFSC CODE"
                placeholder="e.g. HDFC0001234"
                value={formData.ifscCode || ''}
                onChange={(e) => handleChange('ifscCode', e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/employees')}
              disabled={submitting}
              className="text-slate-600 font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              leftIcon={submitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
              className="font-bold text-sm px-6"
            >
              {submitting ? 'Saving Employee...' : 'Save & Onboard Employee'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewEmployeePage;
