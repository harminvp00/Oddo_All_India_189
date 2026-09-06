import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { EmployeesPage } from "../pages/employees/EmployeesPage";
import { NewEmployeePage } from "../pages/employees/NewEmployeePage";
import { EditEmployeePage } from "../pages/employees/EditEmployeePage";
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
              <Route path=":id/edit" element={<EditEmployeePage />} />
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

            {/* Payroll */}
            <Route path="salary-structures" element={<SalaryStructuresPage />} />
            <Route path="salary-rules" element={<SalaryRulesPage />} />
            <Route path="payroll/payruns" element={<PayrunsPage />} />
            <Route path="payroll/payruns/new" element={<NewPayrunPage />} />
            <Route path="payslips" element={<PayslipsPage />} />

            {/* Other */}
            <Route path="users" element={<UsersPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
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
