import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { EmployeesPage } from "../pages/employees/EmployeesPage";
import { NewEmployeePage } from "../pages/employees/NewEmployeePage";
import { EmployeeDetailPage } from "../pages/employees/EmployeeDetailPage";
import { DepartmentsPage } from "../pages/departments/DepartmentsPage";
import { PositionsPage } from "../pages/positions/PositionsPage";
import { ContractsPage } from "../pages/contracts/ContractsPage";
import { SchedulesPage } from "../pages/schedules/SchedulesPage";
import { AttendancePage } from "../pages/attendance/AttendancePage";
import { TimeOffPage } from "../pages/time-off/TimeOffPage";
import { SalaryStructuresPage } from "../pages/payroll/SalaryStructuresPage";
import { SalaryRulesPage } from "../pages/payroll/SalaryRulesPage";
import { PayrunsPage } from "../pages/payroll/PayrunsPage";
import { NewPayrunPage } from "../pages/payroll/NewPayrunPage";
import { PayslipsPage } from "../pages/payroll/PayslipsPage";
import { PaymentsPage } from "../pages/payments/PaymentsPage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { UsersPage } from "../pages/users/UsersPage";
import type { UserRole } from "../types";
import { ShieldAlert, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "../components/ui/Button";

// Route Guard Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Role Authorization Guard Component
const RoleGuard: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, switchPersona } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 animate-fadeIn">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your current persona (<strong>{user?.role?.replace(/_/g, ' ') || 'EMPLOYEE'}</strong>) does not have authorization to view this module.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 text-left">
            <p className="font-semibold text-slate-800">Required Permissions:</p>
            <p className="mt-0.5 font-mono text-[11px] text-indigo-600">{allowedRoles.join(', ')}</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => switchPersona('ADMIN')}
              className="w-full justify-center"
            >
              Switch to Administrator Persona
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="w-full justify-center" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Shell Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Employees Routes */}
            <Route path="employees">
              <Route index element={<EmployeesPage />} />
              <Route path="new" element={<NewEmployeePage />} />
              <Route path=":id" element={<EmployeeDetailPage />} />
            </Route>

            {/* Departments & Positions */}
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="positions" element={<PositionsPage />} />
            
            {/* Contracts & Schedules */}
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            
            {/* Attendance & Time Off */}
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="time-off">
              <Route index element={<TimeOffPage />} />
              <Route path=":tab" element={<TimeOffPage />} />
            </Route>

            {/* Payroll Module - Protected by RoleGuard */}
            <Route
              path="salary-structures"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']}>
                  <SalaryStructuresPage />
                </RoleGuard>
              }
            />
            <Route
              path="salary-rules"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']}>
                  <SalaryRulesPage />
                </RoleGuard>
              }
            />
            <Route
              path="payroll/payruns"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']}>
                  <PayrunsPage />
                </RoleGuard>
              }
            />
            <Route
              path="payroll/payruns/new"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']}>
                  <NewPayrunPage />
                </RoleGuard>
              }
            />
            <Route path="payslips" element={<PayslipsPage />} />

            {/* Other */}
            <Route
              path="users"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <UsersPage />
                </RoleGuard>
              }
            />
            <Route
              path="payments"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']}>
                  <PaymentsPage />
                </RoleGuard>
              }
            />
            <Route
              path="reports"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']}>
                  <ReportsPage />
                </RoleGuard>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
