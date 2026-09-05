import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import {
  Settings2,
  Building2,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  User,
  Sliders,
  Sparkles,
  Lock,
  Globe,
  KeyRound,
} from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('PeoplePay360 Technologies Pvt. Ltd.');
  const [cinNumber, setCinNumber] = useState('CIN-U12345MH2026PTC123456');
  const [gstin, setGstin] = useState('27AADCB2230M1Z2');
  const [adminEmail, setAdminEmail] = useState('admin@peoplepay360.com');
  const [companyAddress, setCompanyAddress] = useState('Level 4, Infinity Tower, BKC, Mumbai - 400051');
  const [payrollCutoff, setPayrollCutoff] = useState('25');
  const [pfRate, setPfRate] = useState('12');

  const TABS = [
    { id: 'company', label: 'Company & Payroll', icon: <Building2 className="w-4 h-4" /> },
    { id: 'security', label: 'Roles & Permissions (RBAC)', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alerts & Email', icon: <Bell className="w-4 h-4" /> },
    { id: 'profile', label: 'Admin Profile', icon: <User className="w-4 h-4" /> },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 700);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Organization Settings"
        description="Manage company entity credentials, payroll statutory parameters, role access control, and notification rules."
        icon={<Settings2 className="w-6 h-6 text-[#714B67]" />}
      />

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-3 pt-2 border-b border-slate-100 bg-slate-50/50">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Configuration settings have been securely updated in system store.
              </div>
            )}

            {/* TAB 1: Company & Payroll */}
            {activeTab === 'company' && (
              <div className="space-y-6 animate-fadeIn">
                <Card className="border-slate-200/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Corporate Entity Profile
                    </CardTitle>
                    <p className="text-xs text-slate-500">Legal registration details appearing on employee payslips</p>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="REGISTERED COMPANY NAME"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                    <Input
                      label="CORPORATE IDENTITY NUMBER (CIN)"
                      value={cinNumber}
                      onChange={(e) => setCinNumber(e.target.value)}
                      required
                    />
                    <Input
                      label="GOODS & SERVICES TAX ID (GSTIN)"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      required
                    />
                    <Input
                      label="OFFICIAL CONTACT EMAIL"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="REGISTERED OFFICE ADDRESS"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Payroll & Statutory Rules
                    </CardTitle>
                    <p className="text-xs text-slate-500">Global cutoff dates and statutory deduction baselines</p>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="DEFAULT OPERATING CURRENCY"
                      defaultValue="INR - Indian Rupee (₹)"
                      disabled
                    />
                    <Input
                      label="MONTHLY ATTENDANCE CUTOFF DAY"
                      type="number"
                      min="1"
                      max="31"
                      value={payrollCutoff}
                      onChange={(e) => setPayrollCutoff(e.target.value)}
                      helperText="Day of month to freeze attendance records"
                    />
                    <Input
                      label="EMPLOYEE PF STATUTORY CONTRIBUTION"
                      type="number"
                      min="0"
                      max="100"
                      value={pfRate}
                      onChange={(e) => setPfRate(e.target.value)}
                      helperText="Standard 12% calculated on Basic"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 2: Roles & Permissions Matrix */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Permissions defined for each system user persona.</p>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-3">Module / Capability</th>
                        <th className="p-3 text-center">ADMIN</th>
                        <th className="p-3 text-center">HR MANAGER</th>
                        <th className="p-3 text-center">HR PAYROLL USER</th>
                        <th className="p-3 text-center">EMPLOYEE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { module: 'Employee Directory & Profiles', admin: true, hr: true, payroll: true, emp: 'Self' },
                        { module: 'Employment Contracts & Wages', admin: true, hr: true, payroll: true, emp: false },
                        { module: 'Attendance & Check-in / Out', admin: true, hr: true, payroll: true, emp: 'Self' },
                        { module: 'Time Off Approvals & Allocations', admin: true, hr: true, payroll: false, emp: 'Self' },
                        { module: 'Salary Rules & CTC Structures', admin: true, hr: false, payroll: true, emp: false },
                        { module: 'Payrun Processing & Compute', admin: true, hr: false, payroll: true, emp: false },
                        { module: 'Payslip Generation & Bank Export', admin: true, hr: false, payroll: true, emp: 'Self' },
                        { module: 'Organization Settings & RBAC', admin: true, hr: false, payroll: false, emp: false },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-900">{row.module}</td>
                          <td className="p-3 text-center">
                            {row.admin ? (
                              <Badge variant="success">Full Access</Badge>
                            ) : (
                              <Badge variant="neutral">None</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {row.hr ? (
                              <Badge variant="teal">Manage</Badge>
                            ) : (
                              <Badge variant="neutral">None</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {row.payroll ? (
                              <Badge variant="purple">Process</Badge>
                            ) : (
                              <Badge variant="neutral">None</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {row.emp === 'Self' ? (
                              <Badge variant="info">Self View</Badge>
                            ) : (
                              <Badge variant="neutral">Restricted</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Email & Alert Dispatch Preferences</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Automated communications sent to managers and staff.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Payrun Calculation & Disbursed Notice', desc: 'Email managers and staff when monthly salary slips are ready for download.', checked: true },
                    { title: 'Leave Request Status Updates', desc: 'Notify employees immediately upon approval or rejection of leave applications.', checked: true },
                    { title: 'Contract Expiry Warnings', desc: 'Send HR notice 30 days prior to contract expiration date.', checked: true },
                    { title: 'Attendance Correction Requests', desc: 'Alert line managers when employees submit missed punch corrections.', checked: true },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="w-4 h-4 text-[#714B67] rounded accent-[#714B67] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Admin Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn max-w-xl">
                <Card className="border-slate-200/80 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Logged-in Administrator Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="FULL NAME" defaultValue="Krish Patel" />
                    <Input label="EMAIL ADDRESS" defaultValue="admin@peoplepay360.com" />
                    <Input label="ASSIGNED ROLE" defaultValue="SUPER ADMIN (Full System Privileges)" disabled />
                    <div className="pt-2">
                      <Button variant="outline" size="sm" leftIcon={<KeyRound className="w-4 h-4" />}>
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Save Button Footer */}
            <div className="flex justify-end pt-6 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={loading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
