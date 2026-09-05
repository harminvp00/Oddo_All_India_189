import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Settings2, Building2, Shield, Bell, Save } from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);

  const TABS = [
    { id: 'company', label: 'Company Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Roles', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully (Mock)');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-5xl mx-auto">
      <PageHeader
        title="Settings"
        description="Configure application preferences, company details, and security."
        icon={<Settings2 className="w-6 h-6" />}
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="px-2 pt-2 border-b border-slate-100">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6">
          <form onSubmit={handleSave}>
            {activeTab === 'company' && (
              <div className="space-y-6 animate-fadeIn">
                <Card className="border-slate-200/60 shadow-none">
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="COMPANY NAME" defaultValue="PeoplePay360 Inc." />
                    <Input label="REGISTRATION NUMBER" defaultValue="CIN-U12345MH2026PTC123456" />
                    <Input label="TAX ID / GSTIN" defaultValue="27AADCB2230M1Z2" />
                    <Input label="CONTACT EMAIL" type="email" defaultValue="admin@peoplepay360.com" />
                    <div className="md:col-span-2">
                      <Input label="COMPANY ADDRESS" defaultValue="Level 4, Infinity Tower, BKC, Mumbai - 400051" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-none">
                  <CardHeader>
                    <CardTitle>Payroll Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="DEFAULT CURRENCY" defaultValue="INR (₹)" disabled />
                    <Input label="FINANCIAL YEAR START" type="month" defaultValue="2026-04" />
                    <Input label="PAYROLL CUTOFF DATE" type="number" min="1" max="31" defaultValue="25" helperText="Day of the month to freeze attendance data" />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-fadeIn flex flex-col items-center justify-center py-12 text-center">
                <Shield className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Security Configuration</h3>
                <p className="text-slate-500 max-w-md">Role-based access control (RBAC), SSO settings, and password policies are managed by the identity provider in this demo.</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fadeIn flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Email & Alert Preferences</h3>
                <p className="text-slate-500 max-w-md">Configure which events trigger email alerts for administrators and employees.</p>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />} isLoading={loading}>
                  Save Settings
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
