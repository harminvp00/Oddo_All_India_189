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
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Briefcase, 
  CreditCard, 
  Sparkles,
  IndianRupee,
  Dice5,
} from 'lucide-react';

export const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMaxDobStr = (): string => {
  const now = new Date();
  const year = now.getFullYear() - 18;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMinDobStr = (): string => {
  const now = new Date();
  const year = now.getFullYear() - 60;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const parts = dobString.split('-');
  if (parts.length !== 3) return 0;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }
  return age;
}

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();

  // Reference data loaded from live backend
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Helper to generate unique random employee codes
  const generateRandomCode = useCallback(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${randomNum}`;
  }, []);

  // Form State
  const todayStr = getTodayStr();
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
    wage: 85000,
    salaryStructureId: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateSingleField = (field: keyof CreateEmployeeDTO): string | null => {
    const today = getTodayStr();

    switch (field) {
      case 'firstName': {
        const val = formData.firstName?.trim();
        if (!val) return 'First name is required.';
        if (val.length > 80) return 'First name cannot exceed 80 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'First name can only contain letters and spaces.';
        return null;
      }
      case 'lastName': {
        const val = formData.lastName?.trim();
        if (!val) return 'Last name is required.';
        if (val.length > 80) return 'Last name cannot exceed 80 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(val)) return 'Last name can only contain letters and spaces.';
        return null;
      }
      case 'email': {
        const val = formData.email?.trim();
        if (val) {
          if (val.length > 120) return 'Email address cannot exceed 120 characters.';
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(val)) return 'Please enter a valid email address (e.g. name@domain.com).';
        }
        return null;
      }
      case 'phone': {
        const val = formData.phone?.trim();
        if (val) {
          if (!/^\d{10}$/.test(val)) {
            return 'Phone number must be exactly 10 digits.';
          }
        }
        return null;
      }
      case 'dateOfBirth': {
        const val = formData.dateOfBirth;
        if (val) {
          if (val > today) {
            return 'Date of birth cannot be greater than current date.';
          }
          const age = calculateAge(val);
          if (age < 18) {
            return 'Employee must be at least 18 years old.';
          }
          if (age > 60) {
            return 'Employee maximum age limit is 60 years.';
          }
        }
        return null;
      }
      case 'hireDate': {
        const val = formData.hireDate;
        if (!val) return 'Joining / Hire date is required.';
        if (val < today) {
          return 'Joining / Hire date cannot be earlier than current date.';
        }
        return null;
      }
      case 'employeeCode': {
        const val = formData.employeeCode?.trim();
        if (val) {
          if (val.length > 30) return 'Employee Code cannot exceed 30 characters.';
          if (!/^[A-Za-z0-9_-]+$/.test(val)) {
            return 'Employee Code can only contain letters, numbers, hyphens, and underscores.';
          }
        }
        return null;
      }
      case 'departmentId': {
        if (!formData.departmentId) return 'Please select a department.';
        return null;
      }
      case 'positionId': {
        if (!formData.positionId) return 'Please select a job position.';
        return null;
      }
      case 'employeeType': {
        if (!formData.employeeType) return 'Please select an employee type.';
        return null;
      }
      case 'employmentStatus': {
        if (!formData.employmentStatus) return 'Please select an employment status.';
        return null;
      }
      case 'wage': {
        const val = formData.wage;
        if (val === undefined || val === null || String(val).trim() === '') {
          return 'Monthly gross wage is required.';
        }
        const num = Number(val);
        if (isNaN(num) || num <= 0) {
          return 'Wage must be a valid positive number greater than 0.';
        }
        if (num > 10000000) {
          return 'Wage exceeds maximum permitted limit (₹1,00,00,000).';
        }
        return null;
      }
      case 'salaryStructureId': {
        if (!formData.salaryStructureId) return 'Please select a statutory salary structure.';
        return null;
      }
      case 'bankName': {
        const val = formData.bankName?.trim();
        if (val && val.length > 120) return 'Bank name cannot exceed 120 characters.';
        return null;
      }
      case 'bankAccountName': {
        const val = formData.bankAccountName?.trim();
        if (val && val.length > 120) return 'Account holder name cannot exceed 120 characters.';
        return null;
      }
      case 'bankAccountNumber': {
        const val = formData.bankAccountNumber?.trim();
        if (val) {
          if (val.length > 50) return 'Bank account number cannot exceed 50 characters.';
          if (!/^\d{9,30}$/.test(val.replace(/\s+/g, ''))) {
            return 'Bank account number should typically contain 9 to 30 digits.';
          }
        }
        return null;
      }
      case 'ifscCode': {
        const val = formData.ifscCode?.trim();
        if (val) {
          if (val.length > 20) return 'IFSC code cannot exceed 20 characters.';
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(val)) {
            return 'Invalid IFSC format. Expected 4 letters, 0, then 6 alphanumeric characters (e.g. HDFC0001234).';
          }
        }
        return null;
      }
      default:
        return null;
    }
  };

  const handleBlur = (field: keyof CreateEmployeeDTO) => {
    const fieldError = validateSingleField(field);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) {
        next[field] = fieldError;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const validateForm = (): boolean => {
    const fieldsToValidate: (keyof CreateEmployeeDTO)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'hireDate',
      'employeeCode',
      'departmentId',
      'positionId',
      'employeeType',
      'employmentStatus',
      'wage',
      'salaryStructureId',
      'bankName',
      'bankAccountName',
      'bankAccountNumber',
      'ifscCode',
    ];

    const newErrors: Record<string, string> = {};
    for (const field of fieldsToValidate) {
      const err = validateSingleField(field);
      if (err) {
        newErrors[field] = err;
      }
    }

    setErrors(newErrors);

    const errorCount = Object.keys(newErrors).length;
    if (errorCount > 0) {
      const firstError = Object.values(newErrors)[0];
      setError(
        errorCount === 1
          ? firstError
          : `Please fix the ${errorCount} error${errorCount > 1 ? 's' : ''} highlighted in the form.`
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validateForm()) {
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
      };

      const created = await employeeService.createEmployee(payload);

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

      {/* Styled Header Banner matching View Employee Page */}
      <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-[#714B67] via-[#5b3c53] to-slate-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-100 text-[11px] font-semibold mb-1.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Employee Onboarding Wizard</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Create Employee Profile</h2>
          <p className="text-xs text-purple-200/90 mt-0.5 font-medium">Fill in personal identity, shift allocations, and salary structure details.</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Validation Error" onClose={() => setError(null)}>
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
          {/* Card 1: Personal Information */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Personal & Contact Information</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium leading-normal">Basic identity details for payroll and system communications</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="FIRST NAME"
                required
                maxLength={80}
                placeholder="e.g. Rahul"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                error={errors.firstName}
              />
              <Input
                label="LAST NAME"
                required
                maxLength={80}
                placeholder="e.g. Sharma"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                error={errors.lastName}
              />
              <Input
                label="WORK EMAIL ADDRESS"
                type="email"
                maxLength={120}
                placeholder="rahul.sharma@peoplepay360.com"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={errors.email}
                helperText="A system login user account will automatically be created/linked"
              />
              <Input
                label="PHONE NUMBER"
                placeholder="9876543210"
                maxLength={10}
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                error={errors.phone}
                helperText="10-digit mobile number"
              />
              <Input
                label="DATE OF BIRTH (AGE: 18 - 60 YEARS)"
                type="date"
                min={getMinDobStr()}
                max={getMaxDobStr()}
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                onBlur={() => handleBlur('dateOfBirth')}
                error={errors.dateOfBirth}
                helperText="Employee must be at least 18 years old and not older than 60 years"
              />
            </CardContent>
          </Card>

          {/* Card 2: Employment & Hierarchy Details */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Employment & Organizational Hierarchy</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium leading-normal">Assign department, job title, working shift, and reporting manager</p>
                </div>
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
                  maxLength={30}
                  value={formData.employeeCode || ''}
                  onChange={(e) => handleChange('employeeCode', e.target.value)}
                  onBlur={() => handleBlur('employeeCode')}
                  error={errors.employeeCode}
                  helperText="Unique identifier for HR records, attendance kiosk, and payslips"
                />
              </div>

              <Input
                label="JOINING / HIRE DATE"
                type="date"
                required
                min={todayStr}
                value={formData.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
                onBlur={() => handleBlur('hireDate')}
                error={errors.hireDate}
                helperText="Hire date cannot be earlier than today"
              />

              <Select
                label="DEPARTMENT"
                required
                value={formData.departmentId || ''}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                onBlur={() => handleBlur('departmentId')}
                error={errors.departmentId}
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
                onBlur={() => handleBlur('positionId')}
                error={errors.positionId}
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
                onBlur={() => handleBlur('scheduleId')}
                error={errors.scheduleId}
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
                onBlur={() => handleBlur('employeeType')}
                error={errors.employeeType}
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
                onBlur={() => handleBlur('employmentStatus')}
                error={errors.employmentStatus}
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
            <CardHeader className="border-b border-slate-100 bg-emerald-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 text-center">Salary Compensation & Initial Contract</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium">Define monthly gross compensation and statutory salary structure for instant payroll readiness</p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                Automated Contract
              </span>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Input
                    label="MONTHLY GROSS WAGE / SALARY (₹ INR)"
                    type="number"
                    required
                    min="1"
                    max="10000000"
                    step="500"
                    placeholder="e.g. 85000"
                    value={formData.wage ?? ''}
                    onChange={(e) => handleChange('wage', e.target.value === '' ? '' : Number(e.target.value))}
                    onBlur={() => handleBlur('wage')}
                    error={errors.wage}
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
                  label="STATUTORY SALARY STRUCTURE"
                  required
                  value={formData.salaryStructureId || ''}
                  onChange={(e) => handleChange('salaryStructureId', e.target.value)}
                  onBlur={() => handleBlur('salaryStructureId')}
                  error={errors.salaryStructureId}
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
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Bank & Salary Account Details</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium leading-normal">Required for automated monthly payrun processing and direct bank transfers</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="BANK NAME"
                maxLength={120}
                placeholder="e.g. HDFC Bank, ICICI Bank"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                onBlur={() => handleBlur('bankName')}
                error={errors.bankName}
              />
              <Input
                label="ACCOUNT HOLDER NAME"
                maxLength={120}
                placeholder="e.g. Rahul Sharma"
                value={formData.bankAccountName || ''}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
                onBlur={() => handleBlur('bankAccountName')}
                error={errors.bankAccountName}
              />
              <Input
                label="ACCOUNT NUMBER"
                maxLength={50}
                placeholder="e.g. 5010049281923"
                value={formData.bankAccountNumber || ''}
                onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                onBlur={() => handleBlur('bankAccountNumber')}
                error={errors.bankAccountNumber}
              />
              <Input
                label="IFSC CODE"
                maxLength={20}
                placeholder="e.g. HDFC0001234"
                value={formData.ifscCode || ''}
                onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('ifscCode')}
                error={errors.ifscCode}
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
