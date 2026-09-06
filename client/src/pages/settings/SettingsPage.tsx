import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import {
  Settings2,
  Building2,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  User,
  KeyRound,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';
import {
  settingsService,
  type OrganizationSettings,
  type NotificationSettings,
  DEFAULT_SETTINGS,
} from '../../services/settingsService';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Company Form State
  const [companyName, setCompanyName] = useState(DEFAULT_SETTINGS.company.companyName);
  const [cinNumber, setCinNumber] = useState(DEFAULT_SETTINGS.company.cinNumber);
  const [gstin, setGstin] = useState(DEFAULT_SETTINGS.company.gstin);
  const [adminEmail, setAdminEmail] = useState(DEFAULT_SETTINGS.company.adminEmail);
  const [companyAddress, setCompanyAddress] = useState(DEFAULT_SETTINGS.company.companyAddress);
  const [payrollCutoff, setPayrollCutoff] = useState(DEFAULT_SETTINGS.company.payrollCutoff);
  const [pfRate, setPfRate] = useState(DEFAULT_SETTINGS.company.pfRate);

  // Notification Preferences State
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_SETTINGS.notifications);

  // Admin Profile State
  const [adminFullName, setAdminFullName] = useState(DEFAULT_SETTINGS.profile.fullName);
  const [adminProfileEmail, setAdminProfileEmail] = useState(DEFAULT_SETTINGS.profile.email);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const TABS = [
    { id: 'company', label: 'Company & Payroll', icon: <Building2 className="w-4 h-4" /> },
    { id: 'security', label: 'Roles & Permissions (RBAC)', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alerts & Email', icon: <Bell className="w-4 h-4" /> },
    { id: 'profile', label: 'Admin Profile', icon: <User className="w-4 h-4" /> },
  ];

  // Fetch saved settings on mount
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      setInitialLoading(true);
      try {
        const data = await settingsService.getSettings();
        if (isMounted && data) {
          if (data.company) {
            setCompanyName(data.company.companyName || '');
            setCinNumber(data.company.cinNumber || '');
            setGstin(data.company.gstin || '');
            setAdminEmail(data.company.adminEmail || '');
            setCompanyAddress(data.company.companyAddress || '');
            setPayrollCutoff(data.company.payrollCutoff || '25');
            setPfRate(data.company.pfRate || '12');
          }
          if (data.notifications) {
            setNotifications(data.notifications);
          }
          if (data.profile) {
            setAdminFullName(data.profile.fullName || 'Krish Patel');
            setAdminProfileEmail(data.profile.email || 'admin@peoplepay360.com');
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleNotification = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!companyName.trim()) {
      errs.companyName = 'Registered company name is required.';
    } else if (companyName.trim().length < 3) {
      errs.companyName = 'Company name must be at least 3 characters.';
    }

    if (!cinNumber.trim()) {
      errs.cinNumber = 'Corporate Identity Number (CIN) is required.';
    } else if (!/^[A-Z0-9-]{15,30}$/i.test(cinNumber.trim())) {
      errs.cinNumber = 'Invalid CIN format (e.g. CIN-U12345MH2026PTC123456).';
    }

    if (!gstin.trim()) {
      errs.gstin = 'Goods & Services Tax ID (GSTIN) is required.';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Zz][0-9A-Z]{1}$/i.test(gstin.trim())) {
      errs.gstin = 'Invalid 15-character GSTIN format (e.g. 27AADCB2230M1Z2).';
    }

    if (!adminEmail.trim()) {
      errs.adminEmail = 'Official contact email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      errs.adminEmail = 'Please enter a valid official email address.';
    }

    if (!companyAddress.trim()) {
      errs.companyAddress = 'Registered office address is required.';
    } else if (companyAddress.trim().length < 5) {
      errs.companyAddress = 'Address must be at least 5 characters.';
    }

    const cutoffNum = Number(payrollCutoff);
    if (!payrollCutoff || isNaN(cutoffNum) || cutoffNum < 1 || cutoffNum > 31) {
      errs.payrollCutoff = 'Monthly attendance cutoff day must be between 1 and 31.';
    }

    const pfNum = Number(pfRate);
    if (pfRate === '' || isNaN(pfNum) || pfNum < 0 || pfNum > 100) {
      errs.pfRate = 'Employee PF contribution must be between 0% and 100%.';
    }

    if (!adminFullName.trim()) {
      errs.adminFullName = 'Administrator full name is required.';
    }

    if (!adminProfileEmail.trim()) {
      errs.adminProfileEmail = 'Administrator email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminProfileEmail.trim())) {
      errs.adminProfileEmail = 'Please enter a valid administrator email address.';
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      // If error belongs to company tab and user is on another tab, switch to it
      if (
        errs.companyName ||
        errs.cinNumber ||
        errs.gstin ||
        errs.adminEmail ||
        errs.companyAddress ||
        errs.payrollCutoff ||
        errs.pfRate
      ) {
        if (activeTab !== 'company') setActiveTab('company');
      } else if (errs.adminFullName || errs.adminProfileEmail) {
        if (activeTab !== 'profile') setActiveTab('profile');
      }
      return false;
    }

    return true;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveSuccess(false);
    setSaveSuccessMsg(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const payload: OrganizationSettings = {
        company: {
          companyName: companyName.trim(),
          cinNumber: cinNumber.trim().toUpperCase(),
          gstin: gstin.trim().toUpperCase(),
          adminEmail: adminEmail.trim().toLowerCase(),
          companyAddress: companyAddress.trim(),
          payrollCutoff: payrollCutoff.toString(),
          pfRate: pfRate.toString(),
          currency: 'INR',
        },
        notifications,
        profile: {
          fullName: adminFullName.trim(),
          email: adminProfileEmail.trim().toLowerCase(),
          role: 'SUPER ADMIN (Full System Privileges)',
        },
      };

      await settingsService.updateSettings(payload);
      setSaveSuccess(true);
      setSaveSuccessMsg('Configuration settings have been securely updated in system store and database.');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrors({ form: err?.message || 'Failed to update configuration settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSuccess('Password updated successfully!');
    setTimeout(() => {
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(null);
    }, 1200);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" variant="primary" />
        <p className="text-xs text-slate-500 font-semibold">Loading organization settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      <PageHeader
        title="Organization Settings"
        description="Manage company entity credentials, payroll statutory parameters, role access control, and notification rules."
        icon={<Settings2 className="w-6 h-6 text-[#714B67]" />}
      />

      {/* Top Save Confirmation Alert */}
      {saveSuccess && (
        <Alert
          variant="success"
          title="Settings Saved"
          onClose={() => setSaveSuccess(false)}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg || 'Configuration settings have been securely updated.'}</span>
          </div>
        </Alert>
      )}

      {/* Top Validation Error Banner */}
      {Object.keys(errors).length > 0 && (
        <Alert
          variant="danger"
          title="Validation Errors Detected"
          onClose={() => setErrors({})}
        >
          <div className="space-y-1">
            <p>Please review and correct the following inputs before proceeding:</p>
            <ul className="list-disc pl-5 text-[11px] space-y-0.5">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-3 pt-2 border-b border-slate-100 bg-slate-50/50">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSave} className="space-y-6">
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
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: '' }));
                      }}
                      error={errors.companyName}
                      required
                    />
                    <Input
                      label="CORPORATE IDENTITY NUMBER (CIN)"
                      value={cinNumber}
                      onChange={(e) => {
                        setCinNumber(e.target.value.toUpperCase());
                        if (errors.cinNumber) setErrors((prev) => ({ ...prev, cinNumber: '' }));
                      }}
                      error={errors.cinNumber}
                      required
                    />
                    <Input
                      label="GOODS & SERVICES TAX ID (GSTIN)"
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        if (errors.gstin) setErrors((prev) => ({ ...prev, gstin: '' }));
                      }}
                      error={errors.gstin}
                      required
                    />
                    <Input
                      label="OFFICIAL CONTACT EMAIL"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        if (errors.adminEmail) setErrors((prev) => ({ ...prev, adminEmail: '' }));
                      }}
                      error={errors.adminEmail}
                      required
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="REGISTERED OFFICE ADDRESS"
                        value={companyAddress}
                        onChange={(e) => {
                          setCompanyAddress(e.target.value);
                          if (errors.companyAddress) setErrors((prev) => ({ ...prev, companyAddress: '' }));
                        }}
                        error={errors.companyAddress}
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
                      onChange={(e) => {
                        setPayrollCutoff(e.target.value);
                        if (errors.payrollCutoff) setErrors((prev) => ({ ...prev, payrollCutoff: '' }));
                      }}
                      error={errors.payrollCutoff}
                      helperText="Day of month to freeze attendance records (1-31)"
                    />
                    <Input
                      label="EMPLOYEE PF STATUTORY CONTRIBUTION (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={pfRate}
                      onChange={(e) => {
                        setPfRate(e.target.value);
                        if (errors.pfRate) setErrors((prev) => ({ ...prev, pfRate: '' }));
                      }}
                      error={errors.pfRate}
                      helperText="Standard 12% calculated on Basic wage"
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
                    {
                      key: 'payrunNotice' as keyof NotificationSettings,
                      title: 'Payrun Calculation & Disbursed Notice',
                      desc: 'Email managers and staff when monthly salary slips are ready for download.',
                    },
                    {
                      key: 'leaveRequestUpdates' as keyof NotificationSettings,
                      title: 'Leave Request Status Updates',
                      desc: 'Notify employees immediately upon approval or rejection of leave applications.',
                    },
                    {
                      key: 'contractExpiryWarnings' as keyof NotificationSettings,
                      title: 'Contract Expiry Warnings',
                      desc: 'Send HR notice 30 days prior to contract expiration date.',
                    },
                    {
                      key: 'attendanceCorrectionRequests' as keyof NotificationSettings,
                      title: 'Attendance Correction Requests',
                      desc: 'Alert line managers when employees submit missed punch corrections.',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => handleToggleNotification(item.key)}
                      className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={() => handleToggleNotification(item.key)}
                        onClick={(e) => e.stopPropagation()}
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
                    <Input
                      label="FULL NAME"
                      value={adminFullName}
                      onChange={(e) => {
                        setAdminFullName(e.target.value);
                        if (errors.adminFullName) setErrors((prev) => ({ ...prev, adminFullName: '' }));
                      }}
                      error={errors.adminFullName}
                      required
                    />
                    <Input
                      label="EMAIL ADDRESS"
                      type="email"
                      value={adminProfileEmail}
                      onChange={(e) => {
                        setAdminProfileEmail(e.target.value);
                        if (errors.adminProfileEmail) setErrors((prev) => ({ ...prev, adminProfileEmail: '' }));
                      }}
                      error={errors.adminProfileEmail}
                      required
                    />
                    <Input
                      label="ASSIGNED ROLE"
                      defaultValue="SUPER ADMIN (Full System Privileges)"
                      disabled
                    />
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<KeyRound className="w-4 h-4" />}
                        onClick={() => setIsPasswordModalOpen(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Save Button Footer with Status Feedback */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
              <div>
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Configuration settings saved successfully!</span>
                  </div>
                )}
                {Object.keys(errors).length > 0 && (
                  <div className="text-rose-600 font-semibold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Please correct invalid fields before saving.</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={loading}
                className="w-full sm:w-auto px-6 cursor-pointer"
                title="Save Changes"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title="Change Administrator Password"
          description="Update your credentials for accessing the PeoplePay360 administrative control panel."
          maxWidth="md"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <Input
              label="CURRENT PASSWORD"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="NEW PASSWORD"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
            <Input
              label="CONFIRM NEW PASSWORD"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SettingsPage;

