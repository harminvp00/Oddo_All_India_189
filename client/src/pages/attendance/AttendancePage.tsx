import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import type { AttendanceRecord, AttendanceStatus, CorrectionDTO } from '../../types';
import { 
  CalendarClock, 
  Search, 
  Edit3, 
  Eye, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Timer,
  UserCheck,
  Calendar,
  Sparkles,
  Filter,
  X
} from 'lucide-react';

const statusVariantMap: Record<AttendanceStatus, 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'> = {
  PRESENT: 'success',
  LATE: 'warning',
  HALF_DAY: 'primary',
  ABSENT: 'danger',
  CORRECTED: 'info',
};

export const getEffectiveStatus = (record: AttendanceRecord): AttendanceStatus => {
  if (record.status === 'CORRECTED') return 'CORRECTED';
  if (record.checkIn && !record.checkOut) return record.status || 'PRESENT';

  const hours = Number(record.workedHours ?? 0);
  if (hours >= 8) return 'PRESENT';
  if (hours >= 4) return record.status === 'LATE' ? 'LATE' : 'HALF_DAY';
  return 'ABSENT';
};

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  
  // State for attendance records list
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Clock & Punch State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [punchLoading, setPunchLoading] = useState<boolean>(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null);

  // Modals state
  const [viewRecord, setViewRecord] = useState<AttendanceRecord | null>(null);
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);
  const [correctionForm, setCorrectionForm] = useState<{
    checkInDate: string;
    checkInTime: string;
    checkOutDate: string;
    checkOutTime: string;
    status: AttendanceStatus;
    workedHours: string;
    correctionNote: string;
  }>({
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    status: 'CORRECTED',
    workedHours: '',
    correctionNote: '',
  });
  const [correctionSubmitting, setCorrectionSubmitting] = useState<boolean>(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if current user is admin/HR
  const isManagerOrAdmin = useMemo(() => {
    return user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'HR_PAYROLL_MANAGER';
  }, [user?.role]);

  // Derive today's string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [userTodayRecord, setUserTodayRecord] = useState<AttendanceRecord | null>(() => {
    if (!user?.employeeId) return null;
    try {
      const cached = localStorage.getItem(`peoplepay_attendance_${user.employeeId}_${todayStr}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const saveUserTodayRecord = useCallback((rec: AttendanceRecord | null) => {
    setUserTodayRecord(rec);
    if (user?.employeeId && rec) {
      try {
        localStorage.setItem(`peoplepay_attendance_${user.employeeId}_${todayStr}`, JSON.stringify(rec));
      } catch {}
    }
  }, [user?.employeeId, todayStr]);

  // Fetch logged-in user's today attendance independently of table filters
  const fetchUserTodayAttendance = useCallback(async () => {
    if (!user?.employeeId) return;
    try {
      const res = await attendanceService.getAttendanceList({
        employeeId: String(user.employeeId),
        startDate: todayStr,
        endDate: todayStr,
        limit: 1,
      });
      if (res.items && res.items.length > 0) {
        saveUserTodayRecord(res.items[0]);
      }
    } catch (err) {
      console.error('Failed to fetch user today attendance:', err);
    }
  }, [user?.employeeId, todayStr, saveUserTodayRecord]);

  useEffect(() => {
    fetchUserTodayAttendance();
  }, [fetchUserTodayAttendance]);

  // Load attendance data from backend for table display
  const loadAttendance = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await attendanceService.getAttendanceList({
        page,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setRecords(res.items || []);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total || 0);

      // If the returned list contains today's record for this user, keep userTodayRecord synchronized
      if (user?.employeeId) {
        const found = (res.items || []).find((r) => {
          const matchEmp = String(r.employeeId) === String(user.employeeId);
          const recordDate = r.attendanceDate.split('T')[0];
          return matchEmp && recordDate === todayStr;
        });
        if (found) {
          saveUserTodayRecord(found);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch attendance records:', err);
      setAlertInfo({
        type: 'danger',
        message: err?.response?.data?.message || 'Failed to load attendance records from server.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, startDate, endDate, user?.employeeId, todayStr, saveUserTodayRecord]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Derive today's record for currently logged-in user (independent of table filters)
  const todayUserRecord = useMemo(() => {
    if (userTodayRecord) return userTodayRecord;
    if (!user?.employeeId) return null;
    return (
      records.find((r) => {
        const matchEmp = String(r.employeeId) === String(user.employeeId);
        const recordDate = r.attendanceDate.split('T')[0];
        return matchEmp && recordDate === todayStr;
      }) || null
    );
  }, [userTodayRecord, records, user?.employeeId, todayStr]);

  // Elapsed time for active shift
  const activeShiftElapsed = useMemo(() => {
    if (!todayUserRecord?.checkIn || todayUserRecord.checkOut) return null;
    const checkInTime = new Date(todayUserRecord.checkIn).getTime();
    const diffMs = Math.max(0, currentTime.getTime() - checkInTime);
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }, [todayUserRecord, currentTime]);

  // Handle Punch In (Check-in) with frontend validation
  const handleCheckIn = async () => {
    if (todayUserRecord?.checkIn) {
      setAlertInfo({
        type: 'warning',
        message: 'You have already punched in for today.',
      });
      return;
    }

    setPunchLoading(true);
    setAlertInfo(null);
    try {
      const record = await attendanceService.checkIn();
      saveUserTodayRecord(record);
      setAlertInfo({
        type: 'success',
        message: `Check-in recorded successfully at ${formatTime(record.checkIn || new Date().toISOString())}!`,
      });
      await loadAttendance(true);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setAlertInfo({
        type: 'danger',
        message: err?.response?.data?.message || err?.message || 'Failed to record check-in.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  // Handle Punch Out (Check-out) with frontend validation
  const handleCheckOut = async () => {
    if (!todayUserRecord?.checkIn) {
      setAlertInfo({
        type: 'warning',
        message: 'You must check in before checking out.',
      });
      return;
    }
    if (todayUserRecord?.checkOut) {
      setAlertInfo({
        type: 'warning',
        message: 'Shift already completed. You have already checked out for today.',
      });
      return;
    }

    setPunchLoading(true);
    setAlertInfo(null);
    try {
      const record = await attendanceService.checkOut();
      saveUserTodayRecord(record);
      setAlertInfo({
        type: 'success',
        message: `Check-out recorded successfully! Worked: ${record.workedHours} hrs, Overtime: ${record.overtimeHours} hrs.`,
      });
      await loadAttendance(true);
    } catch (err: any) {
      console.error('Check-out error:', err);
      setAlertInfo({
        type: 'danger',
        message: err?.response?.data?.message || err?.message || 'Failed to record check-out.',
      });
    } finally {
      setPunchLoading(false);
    }
  };

  // Calculate check-out time based on check-in time and duration in hours
  const calculateEndTime = (dateStr: string, timeStr: string, hours: number): string => {
    try {
      if (!timeStr || !dateStr) return '';
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      const endMs = d.getTime() + hours * 3600000;
      const endD = new Date(endMs);
      return `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  // Open Correction Modal
  const openCorrectionModal = (record: AttendanceRecord) => {
    setCorrectingRecord(record);
    setCorrectionError(null);

    const checkInD = record.checkIn ? new Date(record.checkIn) : null;
    const checkOutD = record.checkOut ? new Date(record.checkOut) : null;
    const initialStatus = record.status === 'CORRECTED' ? 'CORRECTED' : getEffectiveStatus(record);
    const initialHours =
      record.workedHours !== undefined ? String(record.workedHours) : initialStatus === 'ABSENT' ? '0' : '8.00';

    setCorrectionForm({
      checkInDate: checkInD ? checkInD.toISOString().split('T')[0] : record.attendanceDate.split('T')[0],
      checkInTime: checkInD ? checkInD.toTimeString().substring(0, 5) : initialStatus === 'ABSENT' ? '' : '09:00',
      checkOutDate: checkOutD ? checkOutD.toISOString().split('T')[0] : record.attendanceDate.split('T')[0],
      checkOutTime:
        checkOutD
          ? checkOutD.toTimeString().substring(0, 5)
          : checkInD && Number(initialHours) > 0
          ? calculateEndTime(record.attendanceDate.split('T')[0], checkInD.toTimeString().substring(0, 5), Number(initialHours))
          : '',
      status: initialStatus,
      workedHours: initialHours,
      correctionNote: record.correctionNote || '',
    });
  };

  // Synchronize worked hours and status when check-in date changes
  const handleCheckInDateChange = (date: string) => {
    setCorrectionError(null);
    setCorrectionForm((prev) => {
      const updated = { ...prev, checkInDate: date };
      if (updated.checkInTime && updated.checkOutDate && updated.checkOutTime) {
        const start = new Date(`${date}T${updated.checkInTime}:00`);
        const end = new Date(`${updated.checkOutDate}T${updated.checkOutTime}:00`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const diffHours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100;
          updated.workedHours = diffHours.toFixed(2);
          if (updated.status !== 'CORRECTED') {
            updated.status = diffHours >= 8 ? 'PRESENT' : diffHours >= 4 ? 'HALF_DAY' : 'ABSENT';
          }
        }
      }
      return updated;
    });
  };

  // Synchronize worked hours and status when check-in time changes
  const handleCheckInTimeChange = (time: string) => {
    setCorrectionError(null);
    setCorrectionForm((prev) => {
      const updated = { ...prev, checkInTime: time };
      if (updated.checkInDate && updated.checkOutDate && updated.checkOutTime) {
        const start = new Date(`${updated.checkInDate}T${time}:00`);
        const end = new Date(`${updated.checkOutDate}T${updated.checkOutTime}:00`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const diffHours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100;
          updated.workedHours = diffHours.toFixed(2);
          if (updated.status !== 'CORRECTED') {
            updated.status = diffHours >= 8 ? 'PRESENT' : diffHours >= 4 ? 'HALF_DAY' : 'ABSENT';
          }
        }
      }
      return updated;
    });
  };

  // Synchronize worked hours and status when check-out date changes
  const handleCheckOutDateChange = (date: string) => {
    setCorrectionError(null);
    setCorrectionForm((prev) => {
      const updated = { ...prev, checkOutDate: date };
      if (updated.checkInDate && updated.checkInTime && updated.checkOutTime) {
        const start = new Date(`${updated.checkInDate}T${updated.checkInTime}:00`);
        const end = new Date(`${date}T${updated.checkOutTime}:00`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const diffHours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100;
          updated.workedHours = diffHours.toFixed(2);
          if (updated.status !== 'CORRECTED') {
            updated.status = diffHours >= 8 ? 'PRESENT' : diffHours >= 4 ? 'HALF_DAY' : 'ABSENT';
          }
        }
      }
      return updated;
    });
  };

  // Synchronize worked hours and status when check-out time changes
  const handleCheckOutTimeChange = (time: string) => {
    setCorrectionError(null);
    setCorrectionForm((prev) => {
      const updated = { ...prev, checkOutTime: time };
      if (updated.checkInDate && updated.checkInTime && updated.checkOutDate) {
        const start = new Date(`${updated.checkInDate}T${updated.checkInTime}:00`);
        const end = new Date(`${updated.checkOutDate}T${time}:00`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const diffHours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100;
          updated.workedHours = diffHours.toFixed(2);
          if (updated.status !== 'CORRECTED') {
            updated.status = diffHours >= 8 ? 'PRESENT' : diffHours >= 4 ? 'HALF_DAY' : 'ABSENT';
          }
        }
      }
      return updated;
    });
  };

  // Synchronize hours and time outputs when status is changed
  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setCorrectionError(null);
    setCorrectionForm((prev) => {
      let newHours = prev.workedHours;
      let newInTime = prev.checkInTime;
      let newOutTime = prev.checkOutTime;

      if (newStatus === 'PRESENT') {
        newHours = '8.00';
        if (!newInTime) newInTime = '09:00';
        if (prev.checkInDate) {
          newOutTime = calculateEndTime(prev.checkInDate, newInTime, 8);
        }
      } else if (newStatus === 'HALF_DAY') {
        newHours = '4.00';
        if (!newInTime) newInTime = '09:00';
        if (prev.checkInDate) {
          newOutTime = calculateEndTime(prev.checkInDate, newInTime, 4);
        }
      } else if (newStatus === 'ABSENT') {
        newHours = '0';
        newInTime = '';
        newOutTime = '';
      } else if (newStatus === 'LATE') {
        newHours = '7.25';
        newInTime = '09:45';
        if (prev.checkInDate) {
          newOutTime = '17:00';
        }
      }

      return {
        ...prev,
        status: newStatus,
        workedHours: newHours,
        checkInTime: newInTime,
        checkOutTime: newOutTime,
      };
    });
  };

  // Synchronize status and check-out time when worked hours are entered/changed
  const handleWorkedHoursChange = (value: string) => {
    setCorrectionError(null);
    const hoursNum = parseFloat(value);

    setCorrectionForm((prev) => {
      let newStatus = prev.status;
      let newOutTime = prev.checkOutTime;

      if (!isNaN(hoursNum)) {
        if (prev.status !== 'CORRECTED') {
          if (hoursNum >= 8) {
            newStatus = 'PRESENT';
          } else if (hoursNum >= 4) {
            newStatus = prev.status === 'LATE' ? 'LATE' : 'HALF_DAY';
          } else {
            newStatus = 'ABSENT';
          }
        }

        if (prev.checkInDate && prev.checkInTime && hoursNum > 0 && hoursNum <= 24) {
          newOutTime = calculateEndTime(prev.checkInDate, prev.checkInTime, hoursNum);
        } else if (hoursNum === 0) {
          newOutTime = '';
        }
      }

      return {
        ...prev,
        workedHours: value,
        status: newStatus,
        checkOutTime: newOutTime,
      };
    });
  };

  // Submit Correction Form with comprehensive validations
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingRecord) return;

    // 1. Mandatory compliance note validation
    if (!correctionForm.correctionNote.trim()) {
      setCorrectionError('A detailed correction note is required by system compliance.');
      return;
    }

    // 2. Worked hours format and range validation
    const hoursNum = parseFloat(correctionForm.workedHours);
    if (correctionForm.workedHours === '' || isNaN(hoursNum)) {
      setCorrectionError('Please specify valid worked hours.');
      return;
    }

    if (hoursNum < 0) {
      setCorrectionError('Worked hours cannot be negative.');
      return;
    }

    if (hoursNum > 24) {
      setCorrectionError('Worked hours cannot exceed 24 hours in a single day.');
      return;
    }

    // 3. Time validation & chronology checks
    let fullCheckIn: string | undefined = undefined;
    let fullCheckOut: string | undefined = undefined;

    if (correctionForm.status !== 'ABSENT') {
      if (!correctionForm.checkInDate || !correctionForm.checkInTime) {
        setCorrectionError('Check-in date and time are required for non-absent records.');
        return;
      }
    }

    if (correctionForm.checkInDate && correctionForm.checkInTime) {
      const inDate = new Date(`${correctionForm.checkInDate}T${correctionForm.checkInTime}:00`);
      if (isNaN(inDate.getTime())) {
        setCorrectionError('Invalid Check-In date or time format.');
        return;
      }
      fullCheckIn = inDate.toISOString();
    }

    if (correctionForm.checkOutDate && correctionForm.checkOutTime) {
      const outDate = new Date(`${correctionForm.checkOutDate}T${correctionForm.checkOutTime}:00`);
      if (isNaN(outDate.getTime())) {
        setCorrectionError('Invalid Check-Out date or time format.');
        return;
      }
      fullCheckOut = outDate.toISOString();

      if (fullCheckIn) {
        const inDate = new Date(fullCheckIn);
        if (outDate <= inDate) {
          setCorrectionError('Invalid Attendance Time: Check-out time must be strictly after check-in time.');
          return;
        }

        const durationHrs = (outDate.getTime() - inDate.getTime()) / 3600000;
        if (hoursNum > durationHrs + 0.05) {
          setCorrectionError(
            `Worked hours (${hoursNum.toFixed(2)} hrs) cannot exceed the time duration between Check-In and Check-Out (${durationHrs.toFixed(2)} hrs).`
          );
          return;
        }
      }
    }

    // 4. Hours vs Status Sync Validation
    if (correctionForm.status === 'ABSENT' && hoursNum > 0) {
      setCorrectionError('Validation Error: Absent status must have 0 worked hours. For recorded hours, select Present (≥ 8h) or Half Day (4–7.99h).');
      return;
    }

    if (correctionForm.status === 'HALF_DAY' && (hoursNum < 4 || hoursNum >= 8)) {
      setCorrectionError('Validation Error: Half Day status requires between 4.0 and less than 8.0 worked hours (≥ 8h is Present, < 4h is Absent).');
      return;
    }

    if (correctionForm.status === 'PRESENT' && hoursNum < 8) {
      setCorrectionError('Validation Error: Present status requires at least 8.0 worked hours. For 4 to 7.99 hours, choose Half Day.');
      return;
    }

    if (correctionForm.status === 'LATE' && (hoursNum <= 0 || hoursNum > 8)) {
      setCorrectionError('Validation Error: Late arrival shift requires worked hours between 0.1 and 8.0 hours.');
      return;
    }

    setCorrectionSubmitting(true);
    setCorrectionError(null);

    try {
      const payload: CorrectionDTO = {
        checkIn: fullCheckIn,
        checkOut: fullCheckOut,
        status: correctionForm.status,
        workedHours: hoursNum,
        correctionNote: correctionForm.correctionNote.trim(),
      };

      await attendanceService.correctAttendance(correctingRecord.id, payload);

      setAlertInfo({
        type: 'success',
        message: `Attendance record #${correctingRecord.id} successfully updated and marked as corrected.`,
      });

      setCorrectingRecord(null);
      await Promise.all([loadAttendance(true), fetchUserTodayAttendance()]);
    } catch (err: any) {
      console.error('Failed to correct attendance:', err);
      setCorrectionError(err?.response?.data?.message || err?.message || 'Failed to submit correction.');
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  // Helper date/time formatters
  const formatTime = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return iso;
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso.split('T')[0] + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  // Filtered records based on local search query (client-side quick filter over current page)
  const displayedRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((r) => {
      const empName = r.employee
        ? `${r.employee.firstName} ${r.employee.lastName} ${r.employee.employeeCode}`.toLowerCase()
        : '';
      const dateStr = r.attendanceDate.toLowerCase();
      const statusStr = (getEffectiveStatus(r) || r.status).toLowerCase();
      return empName.includes(q) || dateStr.includes(q) || statusStr.includes(q);
    });
  }, [records, searchQuery]);

  // Compute KPI counts from current records
  const stats = useMemo(() => {
    const present = records.filter((r) => getEffectiveStatus(r) === 'PRESENT').length;
    const late = records.filter((r) => getEffectiveStatus(r) === 'LATE').length;
    const halfDay = records.filter((r) => getEffectiveStatus(r) === 'HALF_DAY').length;
    const absent = records.filter((r) => getEffectiveStatus(r) === 'ABSENT').length;
    const totalOT = records.reduce((acc, r) => acc + (Number(r.overtimeHours) || 0), 0);

    return {
      present,
      late,
      halfDay,
      absent,
      totalOT: Math.round(totalOT * 100) / 100,
    };
  }, [records]);

  // Define Table Columns
  const columns: Column<AttendanceRecord>[] = [
    {
      header: 'Employee',
      accessor: 'employeeId',
      render: (item) => {
        const name = item.employee
          ? `${item.employee.firstName} ${item.employee.lastName}`
          : `Employee #${item.employeeId}`;
        const code = item.employee?.employeeCode || '';
        const initials = item.employee
          ? `${item.employee.firstName[0] || ''}${item.employee.lastName[0] || ''}`.toUpperCase()
          : 'EM';

        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight">{name}</div>
              {code && <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{code}</div>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Date',
      accessor: 'attendanceDate',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(item.attendanceDate)}</span>
        </div>
      ),
    },
    {
      header: 'Check In',
      accessor: 'checkIn',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <LogIn className="w-3.5 h-3.5 text-emerald-500" />
          <span>{formatTime(item.checkIn)}</span>
        </div>
      ),
    },
    {
      header: 'Check Out',
      accessor: 'checkOut',
      render: (item) => {
        if (!item.checkOut) {
          return item.checkIn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              In Progress
            </span>
          ) : (
            <span className="text-slate-400 text-xs">-</span>
          );
        }
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>{formatTime(item.checkOut)}</span>
          </div>
        );
      },
    },
    {
      header: 'Worked Hours',
      accessor: 'workedHours',
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs text-slate-900">{Number(item.workedHours || 0).toFixed(2)} hrs</span>
          {Number(item.overtimeHours) > 0 && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded inline-block w-max">
              +{Number(item.overtimeHours).toFixed(2)} OT
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => {
        const effectiveStatus = getEffectiveStatus(item);
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={statusVariantMap[effectiveStatus] || 'neutral'}>
              {effectiveStatus.replace('_', ' ')}
            </Badge>
            {item.correctionNote && (
              <span 
                className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold flex items-center justify-center cursor-help"
                title={`Corrected Note: ${item.correctionNote}`}
              >
                i
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            onClick={() => setViewRecord(item)}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {isManagerOrAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 h-auto text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => openCorrectionModal(item)}
              title="Edit / Correct Record"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Attendance Management"
          description="Real-time employee check-in/out tracking, shift calculations, and HR corrections."
          icon={<CalendarClock className="w-6 h-6 text-indigo-600" />}
        />
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAttendance(true)}
            disabled={refreshing || loading}
            leftIcon={<RefreshCw className={`w-4 h-4 text-indigo-600 ${refreshing ? 'animate-spin' : ''}`} />}
            className="bg-white hover:bg-slate-50 font-bold text-xs"
          >
            {refreshing ? 'Syncing...' : 'Sync Live'}
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertInfo && (
        <Alert
          variant={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        >
          {alertInfo.message}
        </Alert>
      )}

      {/* Live Punch Kiosk Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background glow styling */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Live Clock & Greeting */}
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Biometric Punch Station</span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </h2>
              <span className="text-sm font-semibold text-indigo-200">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <p className="text-indigo-100/90 text-sm max-w-xl leading-relaxed">
              Welcome, <span className="font-bold text-white">{user?.name || 'Employee'}</span>. Clock your working hours accurately for automated timesheets, shift calculations, and payroll compliance.
            </p>

            {/* Today's Punch Summary */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-indigo-200">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Today's Check In: </span>
                <strong className="text-white font-bold">{formatTime(todayUserRecord?.checkIn)}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Today's Check Out: </span>
                <strong className="text-white font-bold">{formatTime(todayUserRecord?.checkOut)}</strong>
              </div>
              {activeShiftElapsed && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  <Timer className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Current Shift: </span>
                  <strong className="text-amber-100 font-mono font-bold">{activeShiftElapsed}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Punch Actions */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col items-stretch justify-center gap-3">
            {!todayUserRecord?.checkIn ? (
              <button
                onClick={handleCheckIn}
                disabled={punchLoading}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base shadow-lg shadow-emerald-900/40 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {punchLoading ? (
                  <Spinner size="sm" className="border-white" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Punch In (Check In)</span>
                  </>
                )}
              </button>
            ) : !todayUserRecord.checkOut ? (
              <button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-base shadow-lg shadow-rose-900/40 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {punchLoading ? (
                  <Spinner size="sm" className="border-white" />
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    <span>Punch Out (Check Out)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Shift Completed for Today</span>
                </div>
                <p className="text-xs text-emerald-100/80 mt-1">
                  Total worked: <span className="font-bold text-white">{todayUserRecord.workedHours} hrs</span>
                  {Number(todayUserRecord.overtimeHours) > 0 && ` (${todayUserRecord.overtimeHours} hrs OT)`}
                </p>
              </div>
            )}

            {!user?.employeeId && (
              <p className="text-[11px] text-amber-200/90 text-center">
                Note: Ensure your user account is linked with an active employee profile in User Management.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Records</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CalendarClock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Present</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.present}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Late Arrivals</div>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">{stats.late}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Half Day</div>
              <div className="text-2xl font-extrabold text-violet-700 mt-1">{stats.halfDay}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Timer className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Overtime Hours</div>
              <div className="text-2xl font-extrabold text-indigo-700 mt-1">{stats.totalOT}h</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search Box */}
          <div className="lg:col-span-4">
            <Input
              label="Search"
              placeholder="Search employee, ID, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Present', value: 'PRESENT' },
                { label: 'Late', value: 'LATE' },
                { label: 'Half Day', value: 'HALF_DAY' },
                { label: 'Absent', value: 'ABSENT' },
                { label: 'Corrected', value: 'CORRECTED' },
              ]}
            />
          </div>

          {/* Start Date */}
          <div className="lg:col-span-2">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              placeholder="From Date"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-2">
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              placeholder="To Date"
            />
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-1 flex justify-end pb-1">
            {(statusFilter !== 'all' || startDate || endDate || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:bg-rose-50"
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
            <Spinner size="md" />
            <p className="text-xs font-semibold">Loading attendance records from PostgreSQL...</p>
          </div>
        ) : displayedRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Attendance Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              No punch records match your current filters. Check in above or adjust your date/status filters.
            </p>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={displayedRecords}
              keyExtractor={(item) => item.id}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div>
                  Page <span className="font-bold text-slate-900">{page}</span> of{' '}
                  <span className="font-bold text-slate-900">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title="Attendance Record Details"
      >
        {viewRecord && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold">Employee</div>
                <div className="font-extrabold text-slate-900 text-base">
                  {viewRecord.employee ? `${viewRecord.employee.firstName} ${viewRecord.employee.lastName}` : `ID: ${viewRecord.employeeId}`}
                </div>
                {viewRecord.employee?.employeeCode && (
                  <div className="text-xs font-semibold text-indigo-600">{viewRecord.employee.employeeCode}</div>
                )}
              </div>
              <Badge variant={statusVariantMap[getEffectiveStatus(viewRecord)] || 'neutral'}>
                {getEffectiveStatus(viewRecord).replace('_', ' ')}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-slate-400 font-medium">Attendance Date</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{formatDate(viewRecord.attendanceDate)}</div>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-slate-400 font-medium">Total Worked</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{Number(viewRecord.workedHours || 0).toFixed(2)} hrs</div>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-slate-400 font-medium">Check-In Timestamp</div>
                <div className="font-bold text-emerald-600 text-sm mt-0.5">{formatTime(viewRecord.checkIn)}</div>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-slate-400 font-medium">Check-Out Timestamp</div>
                <div className="font-bold text-rose-600 text-sm mt-0.5">{formatTime(viewRecord.checkOut)}</div>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-slate-400 font-medium">Overtime Hours</div>
                <div className="font-bold text-amber-600 text-sm mt-0.5">{Number(viewRecord.overtimeHours || 0).toFixed(2)} hrs</div>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-slate-400 font-medium">Record ID</div>
                <div className="font-bold text-slate-700 text-sm mt-0.5 font-mono">#{viewRecord.id}</div>
              </div>
            </div>

            {viewRecord.correctionNote && (
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs">
                <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  HR Correction Note:
                </div>
                <div className="text-blue-800 leading-relaxed">{viewRecord.correctionNote}</div>
                {viewRecord.correctedBy && (
                  <div className="text-[11px] text-blue-600 mt-2">Corrected by User #{viewRecord.correctedBy}</div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setViewRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* HR Attendance Correction Modal */}
      <Modal
        isOpen={!!correctingRecord}
        onClose={() => setCorrectingRecord(null)}
        title="Attendance Record Correction (HR/Admin)"
      >
        {correctingRecord && (
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Compliance Audit Notice: </span>
                Modifications to employee biometric logs are logged for payroll verification. A detailed correction note is required.
              </div>
            </div>

            {correctionError && (
              <Alert variant="danger" onClose={() => setCorrectionError(null)}>
                {correctionError}
              </Alert>
            )}

            <div className="text-xs text-slate-600 font-semibold">
              Employee:{' '}
              <strong className="text-slate-900">
                {correctingRecord.employee
                  ? `${correctingRecord.employee.firstName} ${correctingRecord.employee.lastName} (${correctingRecord.employee.employeeCode})`
                  : `ID: ${correctingRecord.employeeId}`}
              </strong>
            </div>

            {/* Check-In Timestamps */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="CHECK-IN DATE"
                type="date"
                value={correctionForm.checkInDate}
                onChange={(e) => handleCheckInDateChange(e.target.value)}
                required={correctionForm.status !== 'ABSENT'}
              />
              <Input
                label="CHECK-IN TIME"
                type="time"
                value={correctionForm.checkInTime}
                onChange={(e) => handleCheckInTimeChange(e.target.value)}
                required={correctionForm.status !== 'ABSENT'}
              />
            </div>

            {/* Check-Out Timestamps */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="CHECK-OUT DATE"
                type="date"
                value={correctionForm.checkOutDate}
                onChange={(e) => handleCheckOutDateChange(e.target.value)}
              />
              <Input
                label="CHECK-OUT TIME"
                type="time"
                value={correctionForm.checkOutTime}
                onChange={(e) => handleCheckOutTimeChange(e.target.value)}
              />
            </div>

            {/* Status & Worked Hours Override */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="STATUS"
                value={correctionForm.status}
                onChange={(e) => handleStatusChange(e.target.value as AttendanceStatus)}
                options={[
                  { label: 'Present (≥ 8.0 hrs)', value: 'PRESENT' },
                  { label: 'Half Day (4.0 – 7.99 hrs)', value: 'HALF_DAY' },
                  { label: 'Late Arrival', value: 'LATE' },
                  { label: 'Absent (< 4.0 hrs)', value: 'ABSENT' },
                  { label: 'Corrected (Manual Override)', value: 'CORRECTED' },
                ]}
              />
              <Input
                label="WORKED HOURS"
                type="number"
                step="0.01"
                min="0"
                max="24"
                placeholder="e.g. 8.0"
                value={correctionForm.workedHours}
                onChange={(e) => handleWorkedHoursChange(e.target.value)}
                required
              />
            </div>

            {/* Status & Hours Sync Helper / Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-600 font-medium">Synced Status Rule:</span>
                <Badge variant={statusVariantMap[correctionForm.status] || 'neutral'}>
                  {correctionForm.status.replace('_', ' ')}
                </Badge>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {Number(correctionForm.workedHours || 0) >= 8
                  ? 'Full Day (≥ 8.0 hrs)'
                  : Number(correctionForm.workedHours || 0) >= 4
                  ? 'Half Day (4.0 – 7.99 hrs)'
                  : 'Absent (< 4.0 hrs)'}
              </span>
            </div>

            {/* Correction Note (Mandatory) */}
            <Textarea
              label="CORRECTION REASON / AUDIT NOTE"
              required
              rows={3}
              placeholder="Explain reason for adjustment (e.g. Employee forgot to punch out due to offsite client meeting)..."
              value={correctionForm.correctionNote}
              onChange={(e) => setCorrectionForm({ ...correctionForm, correctionNote: e.target.value })}
              helperText="Required by backend compliance policy."
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCorrectingRecord(null)}
                disabled={correctionSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={correctionSubmitting}
                leftIcon={correctionSubmitting ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                {correctionSubmitting ? 'Saving...' : 'Apply Correction'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AttendancePage;
