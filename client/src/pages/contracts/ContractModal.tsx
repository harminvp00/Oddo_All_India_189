import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { contractService } from '../../services/contractService';
import { employeeService } from '../../services/employeeService';
import { DepartmentService } from '../../services/departmentService';
import { PositionService } from '../../services/positionService';
import { ScheduleService } from '../../services/scheduleService';
import type {
  Contract,
  CreateContractDTO,
  UpdateContractDTO,
  SalaryStructure,
  Employee,
  Department,
  JobPosition,
  WorkingSchedule,
  ContractStatus,
} from '../../types';
import {
  AlertTriangle,
  Calendar,
  IndianRupee,
  Briefcase,
  Building2,
  Clock,
  User,
  Layers,
} from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractToEdit?: Contract | null;
  defaultEmployeeId?: string;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contractToEdit,
  defaultEmployeeId,
}) => {
  const isEditing = Boolean(contractToEdit);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wage, setWage] = useState<number | string>('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [status, setStatus] = useState<ContractStatus>('ACTIVE');

  // Async options
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);

  // UI status
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Load dropdown datasets on modal open
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      setIsLoadingDropdowns(true);
      try {
        const [empRes, structRes, deptRes, posRes, schedRes] = await Promise.all([
          employeeService.listEmployees({ limit: 100 }),
          contractService.listSalaryStructures(),
          DepartmentService.listDepartments({ limit: 100 }),
          PositionService.listPositions({ limit: 100 }),
          ScheduleService.listSchedules({ limit: 100 }),
        ]);

        setEmployees(empRes.items || []);
        setSalaryStructures(structRes || []);
        setDepartments(deptRes.data || []);
        setPositions(posRes.data || []);
        setSchedules(schedRes.data || []);

        // Pre-select default structure if creating new
        if (!isEditing && structRes && structRes.length > 0 && !salaryStructureId) {
          setSalaryStructureId(structRes[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load form options:', err);
      } finally {
        setIsLoadingDropdowns(false);
      }
    };

    loadOptions();
  }, [isOpen]);

  // Populate or reset form fields
  useEffect(() => {
    if (!isOpen) return;

    setOverlapError(null);
    setGeneralError(null);

    if (contractToEdit) {
      setEmployeeId(contractToEdit.employeeId);
      setContractNumber(contractToEdit.contractNumber);
      setStartDate(contractToEdit.startDate ? contractToEdit.startDate.split('T')[0] : '');
      setEndDate(contractToEdit.endDate ? contractToEdit.endDate.split('T')[0] : '');
      setWage(contractToEdit.wage || '');
      setCurrencyCode(contractToEdit.currencyCode || 'INR');
      setSalaryStructureId(contractToEdit.salaryStructureId || '');
      setDepartmentId(contractToEdit.departmentId || '');
      setPositionId(contractToEdit.positionId || '');
      setScheduleId(contractToEdit.scheduleId || '');
      setStatus(contractToEdit.status || 'ACTIVE');
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setContractNumber(`CTR-${new Date().getFullYear()}-${randomSuffix}`);
      setEmployeeId(defaultEmployeeId || '');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setWage('');
      setCurrencyCode('INR');
      setDepartmentId('');
      setPositionId('');
      setScheduleId('');
      setStatus('ACTIVE');
    }
  }, [isOpen, contractToEdit, defaultEmployeeId]);

  // Auto-sync employee department/position/schedule when employee is selected in new mode
  const handleEmployeeChange = (selectedEmpId: string) => {
    setEmployeeId(selectedEmpId);
    if (!isEditing && selectedEmpId) {
      const selected = employees.find((e) => e.id === selectedEmpId);
      if (selected) {
        if (selected.department?.id) setDepartmentId(selected.department.id);
        if (selected.position?.id) setPositionId(selected.position.id);
        if (selected.schedule?.id) setScheduleId(selected.schedule.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverlapError(null);
    setGeneralError(null);

    if (!employeeId) {
      setGeneralError('Please select an employee.');
      return;
    }
    if (!contractNumber.trim()) {
      setGeneralError('Contract Number is required.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];

    if (!startDate) {
      setGeneralError('Start Date is required.');
      return;
    }
    if (startDate < todayStr && !isEditing) {
      setGeneralError("Start Date cannot be in the past. Please select today's date or a future date.");
      return;
    }
    if (endDate) {
      if (endDate < startDate) {
        setGeneralError('End Date cannot be earlier than Start Date.');
        return;
      }
      if (endDate < todayStr) {
        setGeneralError("End Date cannot be in the past. Please select today's date or a future date.");
        return;
      }
    }
    if (!wage || Number(wage) <= 0) {
      setGeneralError('Wage must be greater than 0.');
      return;
    }
    if (!salaryStructureId) {
      setGeneralError('Please select a Salary Structure.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && contractToEdit) {
        const updatePayload: UpdateContractDTO = {
          contractNumber: contractNumber.trim().toUpperCase(),
          startDate,
          endDate: endDate ? endDate : null,
          wage: Number(wage),
          currencyCode,
          salaryStructureId,
          departmentId: departmentId || null,
          positionId: positionId || null,
          scheduleId: scheduleId || null,
          status,
        };

        await contractService.updateContract(contractToEdit.id, updatePayload);
      } else {
        const createPayload: CreateContractDTO = {
          employeeId,
          contractNumber: contractNumber.trim().toUpperCase(),
          startDate,
          endDate: endDate ? endDate : null,
          wage: Number(wage),
          currencyCode,
          salaryStructureId,
          departmentId: departmentId || null,
          positionId: positionId || null,
          scheduleId: scheduleId || null,
          status,
        };

        await contractService.createContract(createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'An unexpected error occurred.';
      const errorCode = err.response?.data?.code || '';

      if (errorCode === 'CONTRACT_OVERLAP' || errorMsg.toLowerCase().includes('overlap')) {
        setOverlapError(errorMsg);
      } else {
        setGeneralError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Employment Contract' : 'Create New Employment Contract'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Overlap Warning Banner */}
        {overlapError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-bold text-rose-900">Contract Date Overlap Conflict</h4>
              <p className="text-rose-700 mt-1 leading-relaxed">{overlapError}</p>
              <p className="text-xs text-rose-500 mt-2">
                Tip: An employee cannot have multiple overlapping ACTIVE contracts. Change the status to <strong>DRAFT</strong> or adjust the Start/End dates.
              </p>
            </div>
          </div>
        )}

        {/* General Error Banner */}
        {generalError && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Section 1: Target Employee & Contract Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="EMPLOYEE*"
            required
            value={employeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            disabled={isEditing || Boolean(defaultEmployeeId)}
            options={[
              { label: 'Select an Employee...', value: '' },
              ...employees.map((emp) => ({
                label: `${emp.name} (${emp.employeeCode})`,
                value: emp.id,
              })),
            ]}
          />

          <Input
            label="CONTRACT REFERENCE #*"
            required
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value.toUpperCase())}
            placeholder="e.g. CTR-2026-0001"
            className="font-mono text-sm uppercase"
          />
        </div>

        {/* Section 2: Dates & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="START DATE*"
            type="date"
            required
            min={!isEditing ? todayStr : undefined}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            helperText="Cannot be in the past"
          />

          <Input
            label="END DATE (OPTIONAL)"
            type="date"
            min={startDate || todayStr}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Open ended"
            helperText="Cannot be in the past"
          />

          <Select
            label="STATUS*"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as ContractStatus)}
            options={[
              { label: 'ACTIVE (In Force)', value: 'ACTIVE' },
              { label: 'DRAFT (Under Review)', value: 'DRAFT' },
              { label: 'EXPIRED', value: 'EXPIRED' },
              { label: 'TERMINATED', value: 'TERMINATED' },
            ]}
          />
        </div>

        {/* Section 3: Salary Structure & Wage Card */}
        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-3xl border border-slate-200/80 space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-emerald-600" /> Compensation & Salary Structure
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="SALARY STRUCTURE*"
              required
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              options={[
                { label: 'Select Salary Structure...', value: '' },
                ...salaryStructures.map((struct) => ({
                  label: struct.name,
                  value: struct.id,
                })),
              ]}
            />

            <Input
              label="MONTHLY WAGE AMOUNT (₹ INR)*"
              type="number"
              min="0"
              step="500"
              required
              value={wage}
              onChange={(e) => setWage(e.target.value)}
              placeholder="e.g. 75000"
              startIcon={<IndianRupee className="w-4 h-4 text-slate-400" />}
              className="font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Section 4: Department, Position, Schedule Overrides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="DEPARTMENT (OPTIONAL)"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={[
              { label: 'Inherit from Emp', value: '' },
              ...departments.map((dept) => ({
                label: `${dept.name} (${dept.code})`,
                value: dept.id,
              })),
            ]}
          />

          <Select
            label="JOB POSITION (OPTIONAL)"
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            options={[
              { label: 'Inherit from Emp', value: '' },
              ...positions.map((pos) => ({
                label: pos.title,
                value: pos.id,
              })),
            ]}
          />

          <Select
            label="WORKING SCHEDULE (OPTIONAL)"
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
            options={[
              { label: 'Inherit from Emp', value: '' },
              ...schedules.map((sched) => ({
                label: sched.name,
                value: sched.id,
              })),
            ]}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || isLoadingDropdowns}
            className="bg-[#714B67] hover:bg-[#5b3c53] text-white font-bold px-5"
          >
            {isEditing ? 'Save Contract Changes' : 'Issue Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
