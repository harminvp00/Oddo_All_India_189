import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { ScheduleService } from '../../services/scheduleService';
import type { WorkingSchedule, ScheduleDay, PaginationMeta, ScheduleType } from '../../types';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Power,
  Eye,
  Clock,
  Zap,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 7, name: 'Sunday', short: 'Sun' },
];

interface DayFormState {
  enabled: boolean;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

const DEFAULT_DAYS: DayFormState[] = [
  { enabled: true, dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { enabled: true, dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { enabled: true, dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { enabled: true, dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { enabled: true, dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { enabled: false, dayOfWeek: 6, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
  { enabled: false, dayOfWeek: 7, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
];

function calculateDayHours(startTime?: string | null, endTime?: string | null, breakMinutes = 0): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalStartMinutes = startH * 60 + startM;
  const totalEndMinutes = endH * 60 + endM;
  const netMinutes = totalEndMinutes - totalStartMinutes - breakMinutes;
  if (netMinutes <= 0) return 0;
  return Number((netMinutes / 60).toFixed(2));
}

export const SchedulesPage: React.FC = () => {
  // State
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkingSchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<WorkingSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formType, setFormType] = useState<ScheduleType>('FIXED');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formDays, setFormDays] = useState<DayFormState[]>(DEFAULT_DAYS);
  const [formErrors, setFormErrors] = useState<{ name?: string; days?: string; api?: string }>({});
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load Working Schedules
  const fetchSchedules = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await ScheduleService.listSchedules({
        search: searchTerm.trim() || undefined,
        isActive: statusFilter,
        page,
        limit,
      });

      if (res.success) {
        let items = res.data;
        if (typeFilter !== 'all') {
          items = items.filter((s) => s.scheduleType === typeFilter);
        }
        setSchedules(items);
        if (res.meta) {
          setPaginationMeta(res.meta);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch working schedules. Please check backend connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, statusFilter, typeFilter, page, limit]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSchedules(true);
  };

  // KPIs
  const totalSchedules = paginationMeta.total || schedules.length;
  const activeCount = schedules.filter((s) => s.isActive).length;
  const inactiveCount = schedules.filter((s) => !s.isActive).length;
  const totalEmployees = schedules.reduce((sum, s) => sum + (s.employeeCount || 0), 0);
  const avgWeeklyHours =
    schedules.length > 0
      ? (schedules.reduce((sum, s) => sum + (s.weeklyHours || 0), 0) / schedules.length).toFixed(1)
      : '0.0';

  // Live calculation of Weekly Hours in Form
  const formWeeklyHours = formDays
    .filter((d) => d.enabled)
    .reduce((sum, d) => sum + calculateDayHours(d.startTime, d.endTime, d.breakMinutes), 0)
    .toFixed(1);

  // Preset Handlers
  const applyPreset = (preset: 'standard' | 'flexible' | 'parttime') => {
    if (preset === 'standard') {
      setFormName('Standard 40h (Mon-Fri 09:00 - 18:00)');
      setFormType('FIXED');
      setFormDays([
        { enabled: true, dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: false, dayOfWeek: 6, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: false, dayOfWeek: 7, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      ]);
    } else if (preset === 'flexible') {
      setFormName('Flexible 35h (Mon-Fri 10:00 - 18:00)');
      setFormType('FLEXIBLE');
      setFormDays([
        { enabled: true, dayOfWeek: 1, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 2, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 3, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 4, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: true, dayOfWeek: 5, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
        { enabled: false, dayOfWeek: 6, startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
        { enabled: false, dayOfWeek: 7, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      ]);
    } else if (preset === 'parttime') {
      setFormName('Part-Time 20h (Mon-Fri Mornings)');
      setFormType('FIXED');
      setFormDays([
        { enabled: true, dayOfWeek: 1, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: true, dayOfWeek: 2, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: true, dayOfWeek: 3, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: true, dayOfWeek: 4, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: true, dayOfWeek: 5, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: false, dayOfWeek: 6, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
        { enabled: false, dayOfWeek: 7, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      ]);
    }
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormType('FIXED');
    setFormIsActive(true);
    setFormDays(DEFAULT_DAYS);
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (sched: WorkingSchedule) => {
    setSelectedSchedule(sched);
    setFormName(sched.name);
    setFormType(sched.scheduleType);
    setFormIsActive(sched.isActive);
    setFormErrors({});

    try {
      // Fetch complete schedule days
      const detail = await ScheduleService.getScheduleById(sched.id);
      if (detail.success && detail.data.scheduleDays) {
        const daysMap = new Map(detail.data.scheduleDays.map((d) => [d.dayOfWeek, d]));
        const updatedDays = DAYS_OF_WEEK.map((dw) => {
          const matched = daysMap.get(dw.day);
          return {
            enabled: !!matched,
            dayOfWeek: dw.day,
            startTime: matched?.startTime || '09:00',
            endTime: matched?.endTime || '18:00',
            breakMinutes: matched?.breakMinutes ?? 60,
          };
        });
        setFormDays(updatedDays);
      } else {
        setFormDays(DEFAULT_DAYS);
      }
    } catch {
      setFormDays(DEFAULT_DAYS);
    }

    setIsEditModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = async (sched: WorkingSchedule) => {
    setSelectedSchedule(sched);
    setIsViewModalOpen(true);
    try {
      const detail = await ScheduleService.getScheduleById(sched.id);
      if (detail.success) {
        setSelectedSchedule(detail.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Create Schedule
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeDays = formDays.filter((d) => d.enabled);

    const errors: { name?: string; days?: string } = {};
    if (!formName.trim()) errors.name = 'Schedule name is required';
    if (activeDays.length === 0) errors.days = 'Schedule must contain at least 1 active working day';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      const res = await ScheduleService.createSchedule({
        name: formName,
        scheduleType: formType,
        isActive: formIsActive,
        scheduleDays: activeDays.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakMinutes: d.breakMinutes,
        })),
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setToastMessage({ type: 'success', text: `Working schedule "${res.data.name}" created successfully!` });
        fetchSchedules(true);
      }
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to create working schedule' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Schedule
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    const activeDays = formDays.filter((d) => d.enabled);

    const errors: { name?: string; days?: string } = {};
    if (!formName.trim()) errors.name = 'Schedule name is required';
    if (activeDays.length === 0) errors.days = 'Schedule must contain at least 1 active working day';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormSubmitting(true);
    setFormErrors({});
    try {
      const res = await ScheduleService.updateSchedule(selectedSchedule.id, {
        name: formName,
        scheduleType: formType,
        isActive: formIsActive,
        scheduleDays: activeDays.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          breakMinutes: d.breakMinutes,
        })),
      });

      if (res.success) {
        setIsEditModalOpen(false);
        setToastMessage({ type: 'success', text: `Working schedule "${res.data.name}" updated successfully!` });
        fetchSchedules(true);
      }
    } catch (err: any) {
      setFormErrors({ api: err.message || 'Failed to update working schedule' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (sched: WorkingSchedule) => {
    try {
      const res = await ScheduleService.toggleScheduleStatus(sched.id, sched.isActive);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Schedule "${sched.name}" marked as ${!sched.isActive ? 'Active' : 'Inactive'}`,
        });
        setSchedules((prev) =>
          prev.map((s) => (s.id === sched.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to change schedule status' });
    }
  };

  // Delete / Archive Schedule
  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    setIsDeleting(true);
    try {
      const res = await ScheduleService.deleteSchedule(scheduleToDelete.id);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: res.data.message || `Schedule "${scheduleToDelete.name}" processed successfully.`,
        });
        setScheduleToDelete(null);
        fetchSchedules(true);
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Failed to delete working schedule' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-slideDown shadow-2xl">
          <Alert
            variant={toastMessage.type === 'success' ? 'success' : 'danger'}
            title={toastMessage.type === 'success' ? 'Success' : 'Error'}
            className="border shadow-lg"
          >
            {toastMessage.text}
          </Alert>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Working Schedules"
        description="Configure weekly working timetables, shifts, break durations, and staff contract schedule rules connected directly to PostgreSQL."
        icon={<CalendarDays className="w-6 h-6 text-indigo-600" />}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddModal}
            >
              Add Schedule
            </Button>
          </div>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Schedules</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalSchedules}</span>
            <span className="text-xs text-slate-500 font-medium">Defined shifts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Status</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-slate-400">/ {inactiveCount} Inactive</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Weekly Hours</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{avgWeeklyHours}</span>
            <span className="text-xs text-slate-500 font-medium">hrs / week avg</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Staff</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalEmployees}</span>
            <span className="text-xs text-slate-500 font-medium">Total employees</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" title="Backend Connection Issue">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchSchedules()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search schedules by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Schedule Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Shift Types</option>
            <option value="FIXED">Fixed Hours</option>
            <option value="FLEXIBLE">Flexible Hours</option>
          </select>

          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter('true');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'true'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter('false');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'false'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Rows Per Page */}
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm font-medium text-slate-500">Loading working schedules from database...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Working Schedules Found"
              description={
                searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No schedules match your filter criteria. Try resetting search or filters.'
                  : 'Get started by creating your first weekly working schedule.'
              }
              action={
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddModal}
                >
                  Create Schedule
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Schedule Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Weekly Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Staff Count</th>
                  <th className="py-3.5 px-4">Contracts</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {schedules.map((sched) => (
                  <tr
                    key={sched.id}
                    className="hover:bg-indigo-50/20 transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {sched.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            ID: #{sched.id} • {sched.dayCount ? `${sched.dayCount} working days` : 'Configured'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        sched.scheduleType === 'FIXED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {sched.scheduleType}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>{sched.weeklyHours}</span>
                        <span className="text-xs text-slate-400 font-normal">hrs/wk</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(sched)}
                        title="Click to toggle status"
                        className="inline-flex items-center gap-1.5 group/btn cursor-pointer"
                      >
                        <Badge variant={sched.isActive ? 'success' : 'neutral'}>
                          {sched.isActive ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {sched.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{sched.employeeCount || 0}</span>
                        <span className="text-xs text-slate-400">staff</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{sched.contractCount || 0}</span>
                        <span className="text-xs text-slate-400">contracts</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Schedule Details"
                          onClick={() => handleOpenViewModal(sched)}
                        >
                          <Eye className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit Schedule"
                          onClick={() => handleOpenEditModal(sched)}
                        >
                          <Edit2 className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={sched.isActive ? 'Deactivate Schedule' : 'Activate Schedule'}
                          onClick={() => handleToggleStatus(sched)}
                        >
                          <Power
                            className={`w-4 h-4 ${
                              sched.isActive ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'
                            }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete Schedule"
                          onClick={() => setScheduleToDelete(sched)}
                        >
                          <Trash2 className="w-4 h-4 text-rose-500 hover:text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {paginationMeta.total > 0 && (
          <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {Math.min((page - 1) * limit + 1, paginationMeta.total)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(page * limit, paginationMeta.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{paginationMeta.total}</span> schedules
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <div className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
                {page} / {paginationMeta.totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                disabled={page >= paginationMeta.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE SCHEDULE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !formSubmitting && setIsAddModalOpen(false)}
        title="Create Working Schedule"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {formErrors.api && (
            <Alert variant="danger" title="Creation Failed">
              {formErrors.api}
            </Alert>
          )}

          {/* Quick Presets */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('standard')}
                className="px-2.5 py-1 text-xs font-semibold bg-white text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-50 shadow-xs"
              >
                Standard 40h
              </button>
              <button
                type="button"
                onClick={() => applyPreset('flexible')}
                className="px-2.5 py-1 text-xs font-semibold bg-white text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-50 shadow-xs"
              >
                Flexible 35h
              </button>
              <button
                type="button"
                onClick={() => applyPreset('parttime')}
                className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 shadow-xs"
              >
                Part-Time 20h
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="SCHEDULE NAME"
                placeholder="e.g. Standard 40h (Mon-Fri 09:00 - 18:00)"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                }}
                required
                disabled={formSubmitting}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Select
                label="SCHEDULE TYPE"
                value={formType}
                onChange={(e) => setFormType(e.target.value as ScheduleType)}
                options={[
                  { label: 'FIXED — Strict shift start/end times', value: 'FIXED' },
                  { label: 'FLEXIBLE — Flexible working interval', value: 'FLEXIBLE' },
                ]}
                disabled={formSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sched_create_is_active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                disabled={formSubmitting}
              />
              <label htmlFor="sched_create_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Schedule is Active
              </label>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Calculated: {formWeeklyHours} hrs/week</span>
            </div>
          </div>

          {/* Days Timetable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Weekly Working Days Timetable
              </span>
              {formErrors.days && (
                <span className="text-xs text-rose-500 font-medium">{formErrors.days}</span>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/40">
              {formDays.map((dayState, idx) => {
                const dayMeta = DAYS_OF_WEEK.find((d) => d.day === dayState.dayOfWeek)!;
                const netHours = dayState.enabled
                  ? calculateDayHours(dayState.startTime, dayState.endTime, dayState.breakMinutes)
                  : 0;

                return (
                  <div
                    key={dayState.dayOfWeek}
                    className={`p-3 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                      dayState.enabled ? 'bg-white' : 'bg-slate-50/60 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-32">
                      <input
                        type="checkbox"
                        id={`day_${dayState.dayOfWeek}`}
                        checked={dayState.enabled}
                        onChange={(e) => {
                          const updated = [...formDays];
                          updated[idx].enabled = e.target.checked;
                          setFormDays(updated);
                        }}
                        className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                        disabled={formSubmitting}
                      />
                      <label
                        htmlFor={`day_${dayState.dayOfWeek}`}
                        className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                      >
                        {dayMeta.name}
                      </label>
                    </div>

                    {dayState.enabled ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Start:</span>
                          <input
                            type="time"
                            value={dayState.startTime}
                            onChange={(e) => {
                              const updated = [...formDays];
                              updated[idx].startTime = e.target.value;
                              setFormDays(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            disabled={formSubmitting}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">End:</span>
                          <input
                            type="time"
                            value={dayState.endTime}
                            onChange={(e) => {
                              const updated = [...formDays];
                              updated[idx].endTime = e.target.value;
                              setFormDays(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            disabled={formSubmitting}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Break (min):</span>
                          <input
                            type="number"
                            min="0"
                            max="240"
                            step="5"
                            value={dayState.breakMinutes}
                            onChange={(e) => {
                              const updated = [...formDays];
                              updated[idx].breakMinutes = Number(e.target.value);
                              setFormDays(updated);
                            }}
                            className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            disabled={formSubmitting}
                          />
                        </div>

                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {netHours} hrs
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">Off Day / Weekend</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formSubmitting}
              leftIcon={formSubmitting ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
            >
              {formSubmitting ? 'Saving...' : 'Create Working Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT SCHEDULE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !formSubmitting && setIsEditModalOpen(false)}
        title={`Edit Schedule: ${selectedSchedule?.name || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          {formErrors.api && (
            <Alert variant="danger" title="Update Failed">
              {formErrors.api}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="SCHEDULE NAME"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                }}
                required
                disabled={formSubmitting}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Select
                label="SCHEDULE TYPE"
                value={formType}
                onChange={(e) => setFormType(e.target.value as ScheduleType)}
                options={[
                  { label: 'FIXED — Strict shift start/end times', value: 'FIXED' },
                  { label: 'FLEXIBLE — Flexible working interval', value: 'FLEXIBLE' },
                ]}
                disabled={formSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sched_edit_is_active"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                disabled={formSubmitting}
              />
              <label htmlFor="sched_edit_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Schedule is Active
              </label>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Calculated: {formWeeklyHours} hrs/week</span>
            </div>
          </div>

          {/* Days Timetable */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Weekly Working Days Timetable
            </span>

            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/40">
              {formDays.map((dayState, idx) => {
                const dayMeta = DAYS_OF_WEEK.find((d) => d.day === dayState.dayOfWeek)!;
                const netHours = dayState.enabled
                  ? calculateDayHours(dayState.startTime, dayState.endTime, dayState.breakMinutes)
                  : 0;

                return (
                  <div
                    key={dayState.dayOfWeek}
                    className={`p-3 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                      dayState.enabled ? 'bg-white' : 'bg-slate-50/60 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-32">
                      <input
                        type="checkbox"
                        id={`edit_day_${dayState.dayOfWeek}`}
                        checked={dayState.enabled}
                        onChange={(e) => {
                          const updated = [...formDays];
                          updated[idx].enabled = e.target.checked;
                          setFormDays(updated);
                        }}
                        className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                        disabled={formSubmitting}
                      />
                      <label
                        htmlFor={`edit_day_${dayState.dayOfWeek}`}
                        className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                      >
                        {dayMeta.name}
                      </label>
                    </div>

                    {dayState.enabled ? (
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Start:</span>
                          <input
                            type="time"
                            value={dayState.startTime}
                            onChange={(e) => {
                              const updated = [...formDays];
                              updated[idx].startTime = e.target.value;
                              setFormDays(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            disabled={formSubmitting}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">End:</span>
                          <input
                            type="time"
                            value={dayState.endTime}
                            onChange={(e) => {
                              const updated = [...formDays];
                              updated[idx].endTime = e.target.value;
                              setFormDays(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            disabled={formSubmitting}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Break (min):</span>
                          <input
                            type="number"
                            min="0"
                            max="240"
                            step="5"
                            value={dayState.breakMinutes}
                            onChange={(e) => {
                              const updated = [...formDays];
                              updated[idx].breakMinutes = Number(e.target.value);
                              setFormDays(updated);
                            }}
                            className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                            disabled={formSubmitting}
                          />
                        </div>

                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {netHours} hrs
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">Off Day / Weekend</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={formSubmitting}
              leftIcon={formSubmitting ? <Spinner size="sm" /> : <Edit2 className="w-4 h-4" />}
            >
              {formSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW SCHEDULE DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Schedule Overview & Timetable"
        maxWidth="lg"
      >
        {selectedSchedule && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-indigo-100/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedSchedule.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-700">
                    {selectedSchedule.scheduleType}
                  </span>
                  <Badge variant={selectedSchedule.isActive ? 'success' : 'neutral'}>
                    {selectedSchedule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="font-bold text-xs text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                    {selectedSchedule.weeklyHours} hrs/week
                  </span>
                </div>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daily Shift Breakdown
              </span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {DAYS_OF_WEEK.map((dw) => {
                  const day = selectedSchedule.scheduleDays?.find((d) => d.dayOfWeek === dw.day);
                  return (
                    <div
                      key={dw.day}
                      className={`p-3 flex items-center justify-between text-xs ${
                        day ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                      }`}
                    >
                      <span className="font-bold w-28 text-slate-800">{dw.name}</span>
                      {day ? (
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-slate-700 font-semibold">
                            {day.startTime} - {day.endTime}
                          </span>
                          <span className="text-slate-500">Break: {day.breakMinutes}m</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {day.dayHours ?? calculateDayHours(day.startTime, day.endTime, day.breakMinutes)} hrs
                          </span>
                        </div>
                      ) : (
                        <span className="italic">Off Day</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Employees</span>
                <div className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {selectedSchedule.employeeCount || 0}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500 uppercase">Linked Contracts</span>
                <div className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-900">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {selectedSchedule.contractCount || 0}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                leftIcon={<Edit2 className="w-4 h-4" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(selectedSchedule);
                }}
              >
                Edit Schedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!scheduleToDelete}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Schedule: "${scheduleToDelete?.name}"?`}
        description={
          scheduleToDelete &&
          ((scheduleToDelete.employeeCount || 0) > 0 || (scheduleToDelete.contractCount || 0) > 0)
            ? `Note: This schedule has ${scheduleToDelete.employeeCount || 0} linked employees and ${
                scheduleToDelete.contractCount || 0
              } contracts. In accordance with database integrity rules, it will be safely DEACTIVATED instead of hard-deleted.`
            : `Are you sure you want to permanently delete the schedule "${scheduleToDelete?.name}"? This action cannot be undone.`
        }
        confirmText={isDeleting ? 'Processing...' : 'Proceed with Delete'}
        variant="danger"
      />
    </div>
  );
};
