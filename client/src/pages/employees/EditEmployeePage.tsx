import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { calculateAge } from './NewEmployeePage';
import { AvatarUpload } from '../../components/ui/AvatarUpload';
import { getStoredAvatar, setStoredAvatar } from '../../utils/avatarUtils';
import type { 
  Department, 
  JobPosition, 
  WorkingSchedule, 
  Employee, 
  UpdateEmployeeDTO,
  EmployeeType,
  EmploymentStatus 
} from '../../types';
import { 
  Pencil, 
  ArrowLeft, 
  Save, 
  Briefcase, 
  CreditCard, 
  Sparkles,
  UserCheck,
  Camera,
} from 'lucide-react';

export const EditEmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateEmployeeDTO>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: '',
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
  });

  const [employeeName, setEmployeeName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setInitialLoading(true);
        const [empData, deptRes, posRes, schedRes, empRes] = await Promise.all([
          employeeService.getEmployeeById(id),
          DepartmentService.listDepartments({ limit: 100, isActive: 'true' }),
          PositionService.listPositions({ limit: 100, isActive: 'true' }),
          ScheduleService.listSchedules({ limit: 100, isActive: 'true' }),
          employeeService.listEmployees({ limit: 100, status: 'ACTIVE' }),
        ]);

        if (deptRes.success) setDepartments(deptRes.data);
        if (posRes.success) setPositions(posRes.data);
        if (schedRes.success) setSchedules(schedRes.data);
        setManagers((empRes.items || []).filter((m) => m.id !== id));

        if (empData) {
          setEmployeeName(empData.name);
          const initialPhoto = empData.avatarUrl || getStoredAvatar(id) || (empData.employeeCode ? getStoredAvatar(empData.employeeCode) : null) || null;
          setAvatarUrl(initialPhoto);
          setFormData({
            firstName: empData.firstName || '',
            lastName: empData.lastName || '',
            email: empData.email || '',
            phone: empData.phone || '',
            dateOfBirth: empData.dateOfBirth ? empData.dateOfBirth.split('T')[0] : '',
            hireDate: empData.hireDate ? empData.hireDate.split('T')[0] : '',
            employeeCode: empData.employeeCode || '',
            employeeType: empData.employeeType || 'FULL_TIME',
            employmentStatus: empData.employmentStatus || 'ACTIVE',
            departmentId: empData.departmentId || '',
            positionId: empData.positionId || '',
            managerId: empData.managerId || '',
            scheduleId: empData.scheduleId || '',
            bankName: empData.bankName || '',
            bankAccountName: empData.bankAccountName || '',
            bankAccountNumber: empData.bankAccountNumber || '',
            ifscCode: empData.ifscCode || '',
            avatarUrl: initialPhoto || undefined,
          });
        }
      } catch (err: any) {
        console.error('Failed to load employee for editing:', err);
        setError('Failed to fetch employee details or organizational metadata.');
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleAvatarChange = (newPhoto: string | null) => {
    setAvatarUrl(newPhoto);
    setFormData((prev) => ({ ...prev, avatarUrl: newPhoto || undefined }));
    if (id) {
      setStoredAvatar(id, newPhoto);
      if (formData.employeeCode) {
        setStoredAvatar(formData.employeeCode, newPhoto);
      }
    }
  };

  const handleChange = (field: keyof UpdateEmployeeDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName?.trim()) {
      setError('First name is required.');
      return false;
    }
    if (formData.firstName.trim().length > 80) {
      setError('First name cannot exceed 80 characters.');
      return false;
    }
    if (!formData.lastName?.trim()) {
      setError('Last name is required.');
      return false;
    }
    if (formData.lastName.trim().length > 80) {
      setError('Last name cannot exceed 80 characters.');
      return false;
    }

    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
    }

    if (formData.phone?.trim()) {
      const phoneRegex = /^[+0-9\s-]{7,30}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Please enter a valid phone number (7 to 30 digits).');
        return false;
      }
    }

    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        setError('Employee must be at least 18 years old.');
        return false;
      }
      if (age > 60) {
        setError('Employee maximum age limit is 60 years.');
        return false;
      }
    }

    if (formData.employeeCode && formData.employeeCode.trim().length > 30) {
      setError('Employee Code cannot exceed 30 characters.');
      return false;
    }

    if (formData.ifscCode?.trim() && formData.ifscCode.trim().length > 20) {
      setError('IFSC code cannot exceed 20 characters.');
      return false;
    }
    if (formData.bankAccountNumber?.trim() && formData.bankAccountNumber.trim().length > 50) {
      setError('Bank account number cannot exceed 50 characters.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSuccessMsg(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload: UpdateEmployeeDTO = {
        ...formData,
        employeeCode: formData.employeeCode?.trim() || undefined,
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        hireDate: formData.hireDate || undefined,
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        managerId: formData.managerId || undefined,
        scheduleId: formData.scheduleId || undefined,
        bankAccountName: formData.bankAccountName?.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber?.trim() || undefined,
        bankName: formData.bankName?.trim() || undefined,
        ifscCode: formData.ifscCode?.trim() || undefined,
      };

      const updated = await employeeService.updateEmployee(id, payload);

      setSuccessMsg(`Employee profile "${updated.name}" updated successfully!`);

      setTimeout(() => {
        navigate(`/employees/${id}`);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update employee:', err);
      setError(err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || 'Failed to update employee profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-5xl mx-auto">
      <PageHeader
        title={`Edit Employee: ${employeeName || 'Profile'}`}
        description="Update employee personal data, working shift, department assignment, or bank details."
        icon={<Pencil className="w-6 h-6 text-indigo-600" />}
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
            onClick={() => navigate(`/employees/${id}`)}
            className="bg-white font-bold text-xs"
          >
            Back to Profile
          </Button>
        }
      />

      {/* Styled Header Banner matching View Employee Page */}
      <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-[#714B67] via-[#5b3c53] to-slate-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-100 text-[11px] font-semibold mb-1.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile Editor</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Edit {employeeName || 'Employee'}</h2>
          <p className="text-xs text-purple-200/90 mt-0.5 font-medium">Modify attributes and commit changes safely to PostgreSQL.</p>
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
          <p className="text-xs font-bold text-slate-600">Loading employee details from database...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 0: Profile Photograph */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                initials={`${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase() || 'EM'}
                onAvatarChange={handleAvatarChange}
              />
            </CardContent>
          </Card>

          {/* Card 1: Personal Information */}
          <Card className="border-slate-200/80 shadow-xs rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-extrabold text-slate-900">Personal & Contact Information</CardTitle>
                  <p className="text-[11px] text-slate-500 font-medium leading-normal">Basic identity details for payroll and system communications</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="FIRST NAME*"
                required
                maxLength={80}
                placeholder="e.g. Rahul"
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
              <Input
                label="LAST NAME*"
                required
                maxLength={80}
                placeholder="e.g. Sharma"
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
              <Input
                label="WORK EMAIL ADDRESS"
                type="email"
                placeholder="rahul.sharma@peoplepay360.com"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Input
                label="PHONE NUMBER"
                placeholder="+91 98765 43210"
                maxLength={30}
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              <Input
                label="DATE OF BIRTH (AGE: 18 - 60 YEARS)"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                helperText="Employee must be between 18 and 60 years of age"
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
              <Input
                label="EMPLOYEE CODE (ID)"
                placeholder="e.g. EMP-1092"
                maxLength={30}
                value={formData.employeeCode || ''}
                onChange={(e) => handleChange('employeeCode', e.target.value)}
              />

              <Input
                label="JOINING / HIRE DATE"
                type="date"
                value={formData.hireDate || ''}
                onChange={(e) => handleChange('hireDate', e.target.value)}
              />

              <Select
                label="DEPARTMENT"
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
              />
              <Input
                label="ACCOUNT HOLDER NAME"
                maxLength={120}
                placeholder="e.g. Rahul Sharma"
                value={formData.bankAccountName || ''}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
              />
              <Input
                label="ACCOUNT NUMBER"
                maxLength={50}
                placeholder="e.g. 5010049281923"
                value={formData.bankAccountNumber || ''}
                onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
              />
              <Input
                label="IFSC CODE"
                maxLength={20}
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
              onClick={() => navigate(`/employees/${id}`)}
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
              {submitting ? 'Updating Employee...' : 'Save & Update Employee'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditEmployeePage;
