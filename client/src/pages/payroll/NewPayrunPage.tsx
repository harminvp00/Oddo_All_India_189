import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Calculator, ArrowRight, ArrowLeft, Check, CheckCircle2 } from 'lucide-react';

export const NewPayrunPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, name: 'Setup' },
    { id: 2, name: 'Review Inputs' },
    { id: 3, name: 'Calculate' },
    { id: 4, name: 'Confirm' }
  ];

  const handleNext = () => {
    if (step === 3) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep(step + 1);
      }, 1500); // Simulate calculation delay
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/payroll/payruns');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-4xl mx-auto">
      <PageHeader
        title="Create Payrun"
        description="Follow the steps to process payroll."
        icon={<Calculator className="w-6 h-6" />}
        action={
          <Button variant="ghost" onClick={() => navigate('/payroll/payruns')}>
            Cancel
          </Button>
        }
      />

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--brand)] rounded-full -z-10 transition-all duration-500" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }} />
          
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-50/80 px-2 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 ${
                step > s.id 
                  ? 'bg-[var(--brand)] border-[var(--brand)] text-white' 
                  : step === s.id 
                    ? 'bg-white border-[var(--brand)] text-[var(--brand)]' 
                    : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs font-bold ${step >= s.id ? 'text-slate-800' : 'text-slate-400'}`}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm min-h-[400px] flex flex-col">
        <CardContent className="p-8 flex-1">
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Batch Details</h2>
              <Input label="PAYRUN NAME" defaultValue="September 2026 Salary" />
              <Select 
                label="PAY PERIOD" 
                options={[
                  { label: '01 Sep 2026 - 30 Sep 2026', value: 'Sep' },
                  { label: '01 Aug 2026 - 31 Aug 2026', value: 'Aug' }
                ]}
              />
              <Select 
                label="TARGET EMPLOYEES" 
                options={[
                  { label: 'All Active Employees (124)', value: 'All' },
                  { label: 'Engineering Department Only', value: 'Eng' }
                ]}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Review Attendance & Leaves</h2>
              <p className="text-sm text-slate-500 mb-4">The system has automatically synced attendance and leave data for the selected period.</p>
              
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 text-orange-800">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <div className="font-bold text-sm">3 Employees have pending leave requests</div>
                  <div className="text-xs opacity-80 mt-1">These should be approved or rejected before finalizing the calculation to avoid incorrect payouts.</div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-4">
                <div className="font-medium text-slate-700 text-sm flex justify-between mb-2">
                  <span>Total Employees to Process</span>
                  <span className="font-bold">124</span>
                </div>
                <div className="font-medium text-slate-700 text-sm flex justify-between">
                  <span>Loss of Pay (LOP) Days</span>
                  <span className="font-bold text-rose-600">12 Days Total</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn space-y-4">
              <Calculator className="w-16 h-16 text-[var(--brand)] opacity-50 mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-slate-900">Calculating Payroll...</h2>
              <p className="text-slate-500 max-w-md">
                The engine is applying salary rules, deducting LOP, computing taxes, and generating payslips for 124 employees. This might take a few moments.
              </p>
              {loading && (
                <div className="w-64 h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-[var(--brand)] animate-progress rounded-full" style={{ width: '60%', transition: 'width 1s ease-in-out' }} />
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900">Calculation Successful</h2>
                <p className="text-slate-500 mt-2">Please review the summary below before confirming.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Gross Pay</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">₹45,20,000</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-rose-50">
                  <div className="text-xs font-semibold text-rose-600 uppercase">Total Deductions</div>
                  <div className="text-xl font-bold text-rose-900 mt-1">₹3,40,000</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-emerald-50">
                  <div className="text-xs font-semibold text-emerald-600 uppercase">Net Payable</div>
                  <div className="text-xl font-bold text-emerald-900 mt-1">₹41,80,000</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-blue-50">
                  <div className="text-xs font-semibold text-blue-600 uppercase">Payslips Gen.</div>
                  <div className="text-xl font-bold text-blue-900 mt-1">124</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
          <Button 
            variant="ghost" 
            leftIcon={<ArrowLeft className="w-4 h-4" />} 
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || step === 3 || loading}
          >
            Previous
          </Button>
          
          {step < 4 ? (
            <Button 
              variant="primary" 
              rightIcon={<ArrowRight className="w-4 h-4" />} 
              onClick={handleNext}
              isLoading={loading}
              disabled={step === 3} // wait for auto-advance
            >
              {step === 1 ? 'Next: Review Inputs' : step === 2 ? 'Run Calculation' : 'Processing...'}
            </Button>
          ) : (
            <Button 
              variant="primary" 
              leftIcon={<Check className="w-4 h-4" />} 
              onClick={handleFinish}
              isLoading={loading}
            >
              Confirm & Generate Payslips
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
