import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Building2, 
  Briefcase, 
  CalendarDays,
  CalendarClock,
  Users,
  CheckCircle2, 
  ArrowRight,
  Database,
  Plus,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DepartmentService } from '../services/departmentService';
import { PositionService } from '../services/positionService';
import { ScheduleService } from '../services/scheduleService';
import { Link } from 'react-router-dom';
import type { Department, JobPosition, WorkingSchedule } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [deptRes, posRes, schedRes] = await Promise.all([
          DepartmentService.listDepartments({ limit: 100 }),
          PositionService.listPositions({ limit: 100 }),
          ScheduleService.listSchedules({ limit: 100 }),
        ]);
        if (deptRes.success) setDepartments(deptRes.data);
        if (posRes.success) setPositions(posRes.data);
        if (schedRes.success) setSchedules(schedRes.data);
      } catch (err) {
        console.error('Failed to load dashboard live stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const totalDepts = departments.length;
  const activeDepts = departments.filter(d => d.isActive).length;
  const totalPos = positions.length;
  const activePos = positions.filter(p => p.isActive).length;
  const totalSched = schedules.length;
  const activeSched = schedules.filter(s => s.isActive).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-100 text-xs font-semibold mb-3 border border-white/10">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            PostgreSQL Live Backend Connected
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
          </h1>
          <p className="text-indigo-100/90 text-sm mt-2 leading-relaxed">
            Manage organizational hierarchy, departments, job positions, and weekly working schedules seamlessly with real-time PostgreSQL synchronization.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to="/attendance"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <CalendarClock className="w-4 h-4 text-indigo-600" />
              <span>Punch In / Attendance</span>
            </Link>
            <Link
              to="/employees"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Users className="w-4 h-4 text-indigo-200" />
              <span>Employees</span>
            </Link>
            <Link
              to="/departments"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4 text-indigo-200" />
              <span>Departments</span>
            </Link>
            <Link
              to="/positions"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <Briefcase className="w-4 h-4 text-white" />
              <span>Job Positions</span>
            </Link>
            <Link
              to="/schedules"
              className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold text-xs sm:text-sm transition-all active:scale-95"
            >
              <CalendarDays className="w-4 h-4 text-amber-300" />
              <span>Working Schedules</span>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/users"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold text-xs sm:text-sm transition-all active:scale-95"
              >
                <Users className="w-4 h-4 text-emerald-300" />
                <span>Manage Users</span>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Departments */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Departments</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalDepts}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? '...' : `${activeDepts} Active in DB`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Job Positions */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Positions</span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalPos}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? '...' : `${activePos} Active Designations`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Working Schedules */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working Schedules</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalSched}</div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? '...' : `${activeSched} Active Shifts`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Actions */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80 bg-slate-50/50">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</span>
            <div className="space-y-1.5 mt-2">
              <Link to="/departments" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white py-1.5" leftIcon={<Plus className="w-3.5 h-3.5 text-indigo-600" />}>
                  Add Department
                </Button>
              </Link>
              <Link to="/positions" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white py-1.5" leftIcon={<Plus className="w-3.5 h-3.5 text-violet-600" />}>
                  Add Position
                </Button>
              </Link>
              <Link to="/schedules" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white py-1.5" leftIcon={<Plus className="w-3.5 h-3.5 text-amber-600" />}>
                  Add Schedule
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Departments List */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-sm">Departments</CardTitle>
            </div>
            <Link to="/departments" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {departments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No departments found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {departments.slice(0, 4).map((dept) => (
                  <div key={dept.id} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center">
                        {dept.code}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{dept.name}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Job Positions List */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-sm">Job Positions</CardTitle>
            </div>
            <Link to="/positions" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {positions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No job positions found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {positions.slice(0, 4).map((pos) => (
                  <div key={pos.id} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 font-bold flex items-center justify-center">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[130px]">{pos.title}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pos.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pos.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Working Schedules List */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-sm">Working Schedules</CardTitle>
            </div>
            <Link to="/schedules" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {schedules.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No schedules found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {schedules.slice(0, 4).map((sched) => (
                  <div key={sched.id} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[130px]">{sched.name}</div>
                        <div className="text-[10px] text-slate-400">{sched.weeklyHours} hrs/wk</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sched.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sched.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
