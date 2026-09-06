import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { timeOffService } from '../../services/timeOffService';
import { employeeService } from '../../services/employeeService';
import type { LeaveType, Employee, CreateAllocationDTO, AllocationStatus } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface GrantAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GrantAllocationModal: React.FC<GrantAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [allocatedUnits, setAllocatedUnits] = useState<number>(12);
  const [status, setStatus] = useState<AllocationStatus>('APPROVED');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [empRes, types] = await Promise.all([
          employeeService.listEmployees({ limit: 100 }),
          timeOffService.listLeaveTypes({ isActive: 'true' }),
        ]);
        setEmployees(empRes.items || []);
        const allocatableTypes = types.filter((t) => t.requiresAllocation);
        setLeaveTypes(allocatableTypes);
        if (allocatableTypes.length > 0) {
          setLeaveTypeId(allocatableTypes[0].id);
        }
      } catch (err) {
        console.error('Failed to load allocation options:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const currYear = new Date().getFullYear();
    setValidFrom(`${currYear}-01-01`);
    setValidTo(`${currYear}-12-31`);
    setAllocatedUnits(12);
    setStatus('APPROVED');
    setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!leaveTypeId) {
      setError('Please select a leave type.');
      return;
    }
    if (!validFrom || !validTo) {
      setError('Validity date range is required.');
      return;
    }
    if (new Date(validTo) < new Date(validFrom)) {
      setError('Valid To date cannot be before Valid From date.');
      return;
    }
    if (allocatedUnits < 0) {
      setError('Allocated units cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateAllocationDTO = {
        employeeId,
        leaveTypeId,
        validFrom,
        validTo,
        allocatedUnits: Number(allocatedUnits),
        status,
      };

      await timeOffService.createAllocation(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to grant allocation';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grant Employee Leave Allocation / Quota"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-start gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Select
          label="EMPLOYEE"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          options={[
            { label: 'Select Employee...', value: '' },
            ...employees.map((emp) => ({
              label: `${emp.name} (${emp.employeeCode})`,
              value: emp.id,
            })),
          ]}
        />

        <Select
          label="LEAVE TYPE"
          required
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          options={[
            { label: 'Select Leave Type...', value: '' },
            ...leaveTypes.map((t) => ({
              label: `${t.name} (${t.code})`,
              value: t.id,
            })),
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="VALID FROM"
            type="date"
            required
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />

          <Input
            label="VALID TO"
            type="date"
            required
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ALLOCATED UNITS (DAYS)"
            type="number"
            step="0.5"
            min="0"
            required
            value={allocatedUnits}
            onChange={(e) => setAllocatedUnits(Number(e.target.value))}
          />

          <Select
            label="INITIAL STATUS"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value as AllocationStatus)}
            options={[
              { label: 'APPROVED (Active Quota)', value: 'APPROVED' },
              { label: 'DRAFT (Under Review)', value: 'DRAFT' },
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading}>
            Grant Allocation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
