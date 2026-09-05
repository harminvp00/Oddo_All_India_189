import React, { useState, useEffect, useCallback } from 'react';
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
import { contractService } from '../../services/contractService';
import type { 
  Department, 
  JobPosition, 
  WorkingSchedule, 
  Employee, 
  SalaryStructure,
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
  Camera,
  IndianRupee,
  Dice5,
  BadgePercent
} from 'lucide-react';

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();

  // Reference data loaded from live backend
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Helper to generate unique random employee codes
  const generateRandomCode = useCallback(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${randomNum}`;
  }, []);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<CreateEmployeeDTO>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: todayStr,
    employeeCode: generateRandomCode(),
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
    wage: 85000,
    salaryStructureId: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load live departments, positions, schedules, managers, and salary structures
  useEffect(() => {
    async function loadOptions() {
      try {
        setInitialLoading(true);
        const [deptRes, posRes, schedRes, empRes, structRes] = await Promise.all([
          DepartmentService.listDepartments({ limit: 100, isActive: 'true' }),
          PositionService.listPositions({ limit: 100, isActive: 'true' }),
          ScheduleService.listSchedules({ limit: 100, isActive: 'true' }),
          employeeService.listEmployees({ limit: 100, status: 'ACTIVE' }),
          contractService.listSalaryStructures(),
        ]);

        if (deptRes.success) setDepartments(deptRes.data);
        if (posRes.success) setPositions(posRes.data);
        if (schedRes.success) setSchedules(schedRes.data);
        setManagers(empRes.items || []);
        setSalaryStructures(structRes || []);

        // Pre-select defaults if available
        setFormData((prev) => ({
          ...prev,
          departmentId: prev.departmentId || (deptRes.data[0]?.id ?? ''),
          positionId: prev.positionId || (posRes.data[0]?.id ?? ''),
          scheduleId: prev.scheduleId || (schedRes.data[0]?.id ?? ''),
          salaryStructureId: prev.salaryStructureId || (structRes[0]?.id ?? ''),
        }));
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
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                    EMPLOYEE CODE (ID)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange('employeeCode', generateRandomCode())}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title="Generate a new random unique Employee ID"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    <span>🎲 Generate Random ID</span>
                  </button>
                </div>
                <Input
                  placeholder="e.g. EMP-1092"
                  value={formData.employeeCode || ''}
                  onChange={(e) => handleChange('employeeCode', e.target.value)}
                  helperText="Unique identifier for HR records, attendance kiosk, and payslips"
                />
              </div>

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

          {/* Card 3: Salary Compensation & Contract Provisioning */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden border-l-4 border-l-emerald-500">
            <CardHeader className="border-b border-slate-100 bg-emerald-50/40 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900">Salary Compensation & Initial Contract</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium">Define monthly gross compensation and statutory salary structure for instant payroll readiness</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Automated Contract
              </span>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Input
                    label="MONTHLY GROSS WAGE / SALARY (₹ INR)*"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="e.g. 85000"
                    value={formData.wage ?? ''}
                    onChange={(e) => handleChange('wage', Number(e.target.value))}
                    helperText={formData.wage ? `₹${Number(formData.wage).toLocaleString('en-IN')} INR per month (Annual CTC: ₹${(Number(formData.wage) * 12).toLocaleString('en-IN')})` : 'Enter monthly gross CTC'}
                  />

                  {/* Quick Preset Salary Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                    {[35000, 50000, 85000, 110000, 125000, 150000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleChange('wage', amt)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          formData.wage === amt
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        ₹{(amt / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                <Select
                  label="STATUTORY SALARY STRUCTURE*"
                  value={formData.salaryStructureId || ''}
                  onChange={(e) => handleChange('salaryStructureId', e.target.value)}
                  options={[
                    { label: 'Select Salary Structure', value: '' },
                    ...salaryStructures.map((s) => ({
                      label: s.name,
                      value: s.id,
                    })),
                  ]}
                />
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="font-bold text-slate-900">1-Click Automated Employment Contract Provisioning</div>
                  <p className="text-slate-500 leading-relaxed">
                    Upon onboarding, PeoplePay360 will automatically issue an active employment contract with the designated wage and rules, making {formData.firstName || 'the employee'} immediately ready for the next Payrun cycle.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Bank & Payroll Information */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
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
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 font-bold text-sm px-6"
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
