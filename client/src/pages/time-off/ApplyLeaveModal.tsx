import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { timeOffService } from '../../services/timeOffService';
import type { LeaveType, CreateLeaveRequestDTO } from '../../types';
import { AlertTriangle, Calendar, FileText } from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDateStr = (dateStr: string, daysToAdd: number): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestedUnits, setRequestedUnits] = useState<number | string>(1);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadTypes = async () => {
      setIsLoading(true);
      try {
        const types = await timeOffService.listLeaveTypes({ isActive: 'true' });
        setLeaveTypes(types);
        if (types.length > 0) {
          setLeaveTypeId(types[0].id);
        }
      } catch (err) {
        console.error('Failed to load leave types:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTypes();
    const today = getTodayStr();
    setStartDate(today);
    setEndDate(today);
    setRequestedUnits(1);
    setDaysError(null);
    setReason('');
    setError(null);
  }, [isOpen]);

  // Handle start date change and sync end date based on current requestedUnits
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setError(null);

    const today = getTodayStr();
    if (newStart && newStart < today) {
      setError('Start date must be greater than or equal to current date.');
      return;
    }

    const unitsNum = Number(requestedUnits);
    if (!isNaN(unitsNum) && unitsNum > 0 && newStart) {
      const offsetDays = Math.max(0, Math.ceil(unitsNum) - 1);
      const newEnd = addDaysToDateStr(newStart, offsetDays);
      setEndDate(newEnd);
    } else if (newStart && endDate && endDate < newStart) {
      setEndDate(newStart);
    }
  };

  // Handle end date change and recalculate requested units
  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    setError(null);

    const today = getTodayStr();
    if (newEnd && newEnd < today) {
      setError('End date must be greater than or equal to current date.');
      return;
    }

    if (startDate && newEnd) {
      if (newEnd < startDate) {
        setError('End date cannot be before start date.');
        return;
      }
      const d1 = new Date(startDate).getTime();
      const d2 = new Date(newEnd).getTime();
      const diffDays = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      setRequestedUnits(diffDays);
      setDaysError(null);
    }
  };

  // Handle direct changes to requested units and sync end date
  const handleUnitsChange = (valStr: string) => {
    if (valStr === '') {
      setRequestedUnits('');
      setDaysError('Days is required.');
      return;
    }

    // Number-only validation: digits and optional single decimal point
    if (!/^\d*\.?\d*$/.test(valStr)) {
      setDaysError('Only positive numbers are allowed.');
      return;
    }

    const num = Number(valStr);
    if (isNaN(num) || num <= 0) {
      setRequestedUnits(valStr);
      setDaysError('Days must be greater than 0.');
      return;
    }

    setDaysError(null);
    setError(null);
    setRequestedUnits(valStr);

    if (startDate) {
      const offsetDays = Math.max(0, Math.ceil(num) - 1);
      const newEnd = addDaysToDateStr(startDate, offsetDays);
      setEndDate(newEnd);
    }
  };

  const handleUnitsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Disallow exponent 'e', 'E' and negative/positive signs '+', '-'
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleUnitsBlur = () => {
    const num = Number(requestedUnits);
    if (requestedUnits === '' || isNaN(num) || num <= 0) {
      setDaysError('Days must be a valid positive number.');
    } else {
      setDaysError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const today = getTodayStr();

    if (!leaveTypeId) {
      setError('Please select a leave policy.');
      return;
    }
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    if (!endDate) {
      setError('End date is required.');
      return;
    }
    if (startDate < today) {
      setError('Start date must be greater than or equal to current date.');
      return;
    }
    if (endDate < today) {
      setError('End date must be greater than or equal to current date.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    const unitsNum = Number(requestedUnits);
    if (
      requestedUnits === '' ||
      isNaN(unitsNum) ||
      unitsNum <= 0 ||
      !/^\d*\.?\d*$/.test(String(requestedUnits))
    ) {
      setDaysError('Days must be a valid positive number.');
      setError('Requested units must be greater than 0 days.');
      return;
    }

    if (
      selectedType?.maxConsecutiveUnits &&
      unitsNum > Number(selectedType.maxConsecutiveUnits)
    ) {
      setError(
        `Requested duration (${unitsNum} days) exceeds the maximum consecutive limit of ${selectedType.maxConsecutiveUnits} days allowed for ${selectedType.name}.`
      );
      return;
    }

    if (reason.trim().length > 500) {
      setError('Reason cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLeaveRequestDTO = {
        leaveTypeId,
        startDate,
        endDate,
        requestedUnits: unitsNum,
        reason: reason.trim() || undefined,
      };

      await timeOffService.createLeaveRequest(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to submit leave request';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Leave / Time Off Request"
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
          label="LEAVE TYPE"
          required
          value={leaveTypeId}
          onChange={(e) => {
            setLeaveTypeId(e.target.value);
            setError(null);
          }}
          options={[
            { label: 'Select Leave Type...', value: '' },
            ...leaveTypes.map((t) => ({
              label: `${t.name} (${t.code}) - ${t.unit} based`,
              value: t.id,
            })),
          ]}
        />

        {selectedType && (
          <div className="p-2.5 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 border border-indigo-100 flex items-center justify-between">
            <div>
              Requires Approval: <strong>{selectedType.requiresApproval ? 'Yes' : 'Instant (No Approval)'}</strong>
            </div>
            <div>
              Quota / Allocation: <strong>{selectedType.requiresAllocation ? 'Required' : 'Unlimited / LWP'}</strong>
            </div>
            {selectedType.maxConsecutiveUnits && (
              <div>
                Max Consecutive: <strong>{selectedType.maxConsecutiveUnits} days</strong>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="START DATE"
            type="date"
            required
            min={getTodayStr()}
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />

          <Input
            label="END DATE"
            type="date"
            required
            min={startDate && startDate > getTodayStr() ? startDate : getTodayStr()}
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
          />
        </div>

        <Input
          label="TOTAL UNITS / DAYS"
          type="number"
          step="0.5"
          min="0.5"
          required
          value={requestedUnits}
          error={daysError || undefined}
          onKeyDown={handleUnitsKeyDown}
          onChange={(e) => handleUnitsChange(e.target.value)}
          onBlur={handleUnitsBlur}
          helperText="Calculated from date range. You can adjust for half-day requests (e.g. 0.5)."
        />

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            REASON / REMARKS (OPTIONAL)
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.length <= 500) setError(null);
            }}
            placeholder="e.g. Medical checkup, family function, personal vacation..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
          />
          <div className="text-[11px] text-slate-400 text-right mt-0.5">
            {reason.length}/500 characters
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
