import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { timeOffService } from '../../services/timeOffService';
import type { LeaveType, CreateLeaveTypeDTO, LeaveUnit } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface LeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  typeToEdit?: LeaveType | null;
}

export const LeaveTypeModal: React.FC<LeaveTypeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  typeToEdit,
}) => {
  const isEditing = Boolean(typeToEdit);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState<LeaveUnit>('DAY');
  const [requiresAllocation, setRequiresAllocation] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [payrollDeductible, setPayrollDeductible] = useState(false);
  const [maxConsecutiveUnits, setMaxConsecutiveUnits] = useState<number | string>('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (typeToEdit) {
      setName(typeToEdit.name);
      setCode(typeToEdit.code);
      setUnit(typeToEdit.unit);
      setRequiresAllocation(typeToEdit.requiresAllocation);
      setRequiresApproval(typeToEdit.requiresApproval);
      setPayrollDeductible(typeToEdit.payrollDeductible);
      setMaxConsecutiveUnits(typeToEdit.maxConsecutiveUnits ?? '');
      setIsActive(typeToEdit.isActive);
    } else {
      setName('');
      setCode('');
      setUnit('DAY');
      setRequiresAllocation(true);
      setRequiresApproval(true);
      setPayrollDeductible(false);
      setMaxConsecutiveUnits('');
      setIsActive(true);
    }
    setError(null);
  }, [isOpen, typeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError('Name and Code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLeaveTypeDTO = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        unit,
        requiresAllocation,
        requiresApproval,
        payrollDeductible,
        maxConsecutiveUnits: maxConsecutiveUnits ? Number(maxConsecutiveUnits) : null,
        isActive,
      };

      if (isEditing && typeToEdit) {
        await timeOffService.updateLeaveType(typeToEdit.id, payload);
      } else {
        await timeOffService.createLeaveType(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save leave type';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Leave Type Policy' : 'Create New Leave Type Policy'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-start gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="LEAVE TYPE NAME"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Parental Leave"
          />

          <Input
            label="POLICY CODE"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. PAR"
            className="uppercase font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="UNIT"
            value={unit}
            onChange={(e) => setUnit(e.target.value as LeaveUnit)}
            options={[
              { label: 'Days (Full / Half Days)', value: 'DAY' },
              { label: 'Hours', value: 'HOUR' },
            ]}
          />

          <Input
            label="MAX CONSECUTIVE UNITS (OPTIONAL)"
            type="number"
            min="1"
            value={maxConsecutiveUnits}
            onChange={(e) => setMaxConsecutiveUnits(e.target.value)}
            placeholder="No limit"
          />
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresAllocation}
              onChange={(e) => setRequiresAllocation(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Requires Advance Allocation (Leave Balance Quota)
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Requires Manager / HR Approval
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={payrollDeductible}
              onChange={(e) => setPayrollDeductible(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Payroll Deductible (Loss of Pay / Unpaid)
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Policy Changes' : 'Create Policy'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
