import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  Search,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface MockEmployee {
  id: string;
  name: string;
  code: string;
  department: string;
  position: string;
  baseSalary: number;
  structure: string;
  contractStatus: 'ACTIVE' | 'DRAFT' | 'EXPIRED';
  hasBankDetails: boolean;
  leavesTaken: number;
}

const INITIAL_EMPLOYEES: MockEmployee[] = [
  { id: 'emp-1', name: 'Rahul Sharma', code: 'EMP-001', department: 'Engineering', position: 'Lead Architect', baseSalary: 185000, structure: 'Standard Engineering CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 1 },
  { id: 'emp-2', name: 'Amit Patel', code: 'EMP-002', department: 'Engineering', position: 'Senior Backend Engineer', baseSalary: 140000, structure: 'Standard Engineering CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 0 },
  { id: 'emp-3', name: 'Neha Shah', code: 'EMP-003', department: 'Human Resources', position: 'HR Operations Lead', baseSalary: 95000, structure: 'Management & Operations CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 2 },
  { id: 'emp-4', name: 'Priya Mehta', code: 'EMP-004', department: 'Finance', position: 'Financial Controller', baseSalary: 125000, structure: 'Management & Operations CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 0 },
  { id: 'emp-5', name: 'Nimesh Patel', code: 'EMP-005', department: 'Product & Design', position: 'Principal UI/UX Designer', baseSalary: 135000, structure: 'Standard Engineering CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 1 },
  { id: 'emp-6', name: 'Sunil Verma', code: 'EMP-006', department: 'Sales', position: 'Enterprise Account Executive', baseSalary: 85000, structure: 'Sales Incentive & Commission', contractStatus: 'ACTIVE', hasBankDetails: false, leavesTaken: 0 },
  { id: 'emp-7', name: 'Deepa Krishnan', code: 'EMP-007', department: 'Marketing', position: 'Growth Marketing Manager', baseSalary: 92000, structure: 'Management & Operations CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 3 },
  { id: 'emp-8', name: 'Vikas Rao', code: 'EMP-008', department: 'Customer Success', position: 'Support Operations Specialist', baseSalary: 65000, structure: 'Management & Operations CTC', contractStatus: 'ACTIVE', hasBankDetails: true, leavesTaken: 0 },
];

export const NewPayrunPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [computationProgress, setComputationProgress] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('');

  // Step 1: Period details
  const [payrunName, setPayrunName] = useState('September 2026 Regular Payroll');
  const [payPeriod, setPayPeriod] = useState('2026-09');
  const [paymentDate, setPaymentDate] = useState('2026-09-30');

  // Step 2: Salary Structure
  const [selectedStructure, setSelectedStructure] = useState('all');
  const [lopDeductionEnabled, setLopDeductionEnabled] = useState(true);

  // Step 3: Employees Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    INITIAL_EMPLOYEES.map((e) => e.id)
  );

  const steps = [
    { id: 1, name: 'Period Setup', desc: 'Define batch parameters' },
    { id: 2, name: 'Structure & Rules', desc: 'Configure salary policy' },
    { id: 3, name: 'Employee Selection', desc: 'Filter & include staff' },
    { id: 4, name: 'Engine Validation', desc: 'Audit & rule compute' },
    { id: 5, name: 'Summary & Confirm', desc: 'Review finalized payrun' },
  ];

  // Filtering employees
  const filteredEmployees = useMemo(() => {
    return INITIAL_EMPLOYEES.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        selectedDepartment === 'ALL' || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDepartment]);

  const toggleSelectAll = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Selected totals
  const selectedEmployees = useMemo(() => {
    return INITIAL_EMPLOYEES.filter((e) => selectedEmployeeIds.includes(e.id));
  }, [selectedEmployeeIds]);

  const totalGross = useMemo(() => {
    return selectedEmployees.reduce((acc, emp) => acc + emp.baseSalary, 0);
  }, [selectedEmployees]);

  const totalDeductions = useMemo(() => {
    return Math.round(totalGross * 0.12); // ~12% PF + PT + Tax estimation
  }, [totalGross]);

  const totalNet = totalGross - totalDeductions;

  // Validation Warnings
  const missingBankCount = useMemo(() => {
    return selectedEmployees.filter((e) => !e.hasBankDetails).length;
  }, [selectedEmployees]);

  const totalLOPs = useMemo(() => {
    return selectedEmployees.reduce((acc, e) => acc + (e.leavesTaken > 1 ? e.leavesTaken - 1 : 0), 0);
  }, [selectedEmployees]);

  const handleNext = () => {
    if (step === 3) {
      // Transition to calculation step
      setStep(4);
      setLoading(true);
      setComputationProgress(10);
      setCurrentStageText('Preparing payroll batch & reading contracts...');

      setTimeout(() => {
        setComputationProgress(35);
        setCurrentStageText('Loading attendance records & calculating LOP deductions...');
      }, 500);

      setTimeout(() => {
        setComputationProgress(70);
        setCurrentStageText('Applying salary rules (Basic, HRA, Transport, PF & TDS)...');
      }, 1000);

      setTimeout(() => {
        setComputationProgress(100);
        setCurrentStageText('Calculation complete. Ready for final review.');
        setLoading(false);
      }, 1500);
    } else {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/payroll/payruns');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Create New Payrun"
        description="Configure parameters, audit attendance, compute salary rules, and disburse payroll."
        icon={<Calculator className="w-6 h-6 text-[#714B67]" />}
        action={
          <Button variant="ghost" onClick={() => navigate('/payroll/payruns')}>
            Cancel & Exit
          </Button>
        }
      />

      {/* Modern 5-Step Stepper */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative">
          {steps.map((s) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#714B67]/10 border border-[#714B67]/30 text-[#714B67]'
                    : isCompleted
                    ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-800'
                    : 'bg-slate-50 border border-slate-200/60 text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#714B67] text-white shadow-xs'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{s.name}</div>
                  <div className="text-[10px] opacity-75 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Card Container */}
      <Card className="border-slate-200/80 shadow-xs min-h-[460px] flex flex-col justify-between overflow-hidden">
        <CardContent className="p-6 sm:p-8 flex-1">
          {/* STEP 1: Period Setup */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn max-w-xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Payroll Period & Batch Parameters</h2>
                <p className="text-xs text-slate-500 mt-1">Specify cycle schedule and scheduled disbursement date.</p>
              </div>

              <Input
                label="PAYRUN BATCH TITLE"
                value={payrunName}
                onChange={(e) => setPayrunName(e.target.value)}
                placeholder="e.g. September 2026 Regular Payroll"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="PAYROLL CYCLE MONTH"
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                  options={[
                    { label: 'September 2026 (01 Sep - 30 Sep)', value: '2026-09' },
                    { label: 'August 2026 (01 Aug - 31 Aug)', value: '2026-08' },
                    { label: 'October 2026 (01 Oct - 31 Oct)', value: '2026-10' },
                  ]}
                />

                <Input
                  label="PAYMENT DISBURSEMENT DATE"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Auto-Synced Attendance Window:</div>
                <div>01 Sep 2026 00:00:00 to 30 Sep 2026 23:59:59 (30 Calendar Days)</div>
              </div>
            </div>
          )}

          {/* STEP 2: Structure & Policy */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn max-w-xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Salary Structures & Deductions</h2>
                <p className="text-xs text-slate-500 mt-1">Determine which compensation formulas and policies will be applied.</p>
              </div>

              <Select
                label="APPLY SALARY STRUCTURES"
                value={selectedStructure}
                onChange={(e) => setSelectedStructure(e.target.value)}
                options={[
                  { label: 'All Active Structures (Auto-detect per Contract)', value: 'all' },
                  { label: 'Standard Engineering CTC Structure', value: 'eng' },
                  { label: 'Management & Operations CTC Structure', value: 'mgmt' },
                  { label: 'Sales Incentive & Commission Structure', value: 'sales' },
                ]}
              />

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Enforce Loss of Pay (LOP) Deductions</div>
                    <div className="text-xs text-slate-500">Automatically calculate per-day deduction for unapproved absences</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lopDeductionEnabled}
                    onChange={(e) => setLopDeductionEnabled(e.target.checked)}
                    className="w-5 h-5 text-[#714B67] rounded cursor-pointer accent-[#714B67]"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Standard Working Days per Month:</span>
                  <span className="font-bold text-slate-800">22 Days (Office Schedule)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Statutory Compliance Enabled
                </div>
                <div>Standard Provident Fund (12%), Professional Tax (₹200), and TDS slabs will automatically compute.</div>
              </div>
            </div>
          )}

          {/* STEP 3: Employee Selection with Real-time Counters */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Include Employees for Payroll</h2>
                  <p className="text-xs text-slate-500">Filter and select staff members eligible for this cycle.</p>
                </div>

                {/* Summary Pill */}
                <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600">Selected: <strong>{selectedEmployees.length}</strong> / {INITIAL_EMPLOYEES.length}</span>
                  <span className="text-emerald-700 font-bold">Est. Net: ₹{(totalNet / 100000).toFixed(2)}L</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search by employee name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startIcon={<Search className="w-4 h-4 text-slate-400" />}
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    options={[
                      { label: 'All Departments', value: 'ALL' },
                      { label: 'Engineering', value: 'Engineering' },
                      { label: 'Human Resources', value: 'Human Resources' },
                      { label: 'Finance', value: 'Finance' },
                      { label: 'Product & Design', value: 'Product & Design' },
                      { label: 'Sales', value: 'Sales' },
                      { label: 'Marketing', value: 'Marketing' },
                    ]}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={toggleSelectAll}
                  leftIcon={
                    selectedEmployeeIds.length === filteredEmployees.length ? (
                      <CheckSquare className="w-4 h-4 text-[#714B67]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )
                  }
                >
                  {selectedEmployeeIds.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Employee Selection List */}
              <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployeeIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#714B67]/5 hover:bg-[#714B67]/10' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-[#714B67] rounded accent-[#714B67] cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-500">
                            {emp.code} • {emp.department} • {emp.position}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">₹{emp.baseSalary.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{emp.structure}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Engine Validation & Computing Animation */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn py-4">
              <div className="text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center mx-auto mb-3">
                  <Calculator className={`w-8 h-8 ${loading ? 'animate-spin' : ''}`} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {loading ? 'Processing Payroll Engine...' : 'Calculation & Rule Audit Complete'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{currentStageText}</p>
              </div>

              {loading ? (
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#714B67] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${computationProgress}%` }}
                    />
                  </div>
                  <div className="text-center text-xs font-bold text-slate-600">{computationProgress}% Completed</div>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {/* Audit Checklist Box */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                    <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                      <span>Payroll Audit Summary</span>
                      <Badge variant="success">All Critical Checks Passed</Badge>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="py-2 flex items-center justify-between text-emerald-800">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {selectedEmployees.length} Employee contracts valid and in-force
                        </span>
                        <span className="font-bold text-emerald-600">Passed</span>
                      </div>

                      <div className="py-2 flex items-center justify-between text-emerald-800">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Salary structures and formulas successfully resolved
                        </span>
                        <span className="font-bold text-emerald-600">Passed</span>
                      </div>

                      {missingBankCount > 0 ? (
                        <div className="py-2 flex items-center justify-between text-amber-800">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            {missingBankCount} employee(s) have missing bank IFSC details (Will default to Cash/Cheque)
                          </span>
                          <span className="font-bold text-amber-600">Warning</span>
                        </div>
                      ) : (
                        <div className="py-2 flex items-center justify-between text-emerald-800">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            All bank accounts verified for direct transfer
                          </span>
                          <span className="font-bold text-emerald-600">Passed</span>
                        </div>
                      )}

                      {totalLOPs > 0 && (
                        <div className="py-2 flex items-center justify-between text-slate-700">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            {totalLOPs} Loss of Pay days factored into net calculation
                          </span>
                          <span className="font-bold text-blue-600">Adjusted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Final Review & Confirmation */}
          {step === 5 && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Ready to Finalize {payrunName}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Review the high-level financial summary before generating payslips and locking this payrun.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Gross Payroll</div>
                  <div className="text-lg font-black text-slate-900 mt-1">₹{totalGross.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedEmployees.length} Employees</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Deductions & Tax</div>
                  <div className="text-lg font-black text-rose-600 mt-1">₹{totalDeductions.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-rose-500 mt-0.5">PF, PT, TDS</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Net Disbursement</div>
                  <div className="text-lg font-black text-emerald-600 mt-1">₹{totalNet.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Total Payable</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Payslips to Generate</div>
                  <div className="text-lg font-black text-[#714B67] mt-1">{selectedEmployees.length}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">PDF Statements</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Target Pay Date: {paymentDate}</div>
                  <div>Disbursement will be tracked under the Payments section upon creation.</div>
                </div>
                <Badge variant="purple">STATUS: COMPUTED</Badge>
              </div>
            </div>
          )}
        </CardContent>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            disabled={step === 1 || loading}
          >
            Previous Step
          </Button>

          {step < 5 ? (
            <Button
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNext}
              disabled={loading || (step === 3 && selectedEmployees.length === 0)}
            >
              {step === 1
                ? 'Proceed to Structure'
                : step === 2
                ? 'Select Employees'
                : step === 3
                ? 'Run Calculation Engine'
                : 'Review Final Summary'}
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={handleFinish}
              isLoading={loading}
            >
              Confirm & Create Payrun
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NewPayrunPage;
