import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DEPARTMENTS, POSITIONS } from '../../features/employees/mockData';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigate('/employees');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-5xl mx-auto">
      <PageHeader
        title="Add New Employee"
        description="Create a new employee profile in the system."
        icon={<UserPlus className="w-6 h-6" />}
        action={
          <Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/employees')}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200/60 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="FULL NAME" required placeholder="John Doe" />
            <Input label="EMAIL ADDRESS" type="email" required placeholder="john@company.com" />
            <Input label="PHONE NUMBER" placeholder="+91 98765 43210" />
            <Input label="DATE OF BIRTH" type="date" />
            <div className="md:col-span-2">
              <Input label="RESIDENTIAL ADDRESS" placeholder="Full address" />
            </div>
            <Input label="EMERGENCY CONTACT NAME" placeholder="Jane Doe" />
            <Input label="EMERGENCY CONTACT PHONE" placeholder="+91 98765 00000" />
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="EMPLOYEE CODE" required placeholder="EMP-001" />
            <Input label="JOINING DATE" type="date" required />
            
            <Select 
              label="DEPARTMENT" 
              required 
              options={[
                { label: 'Select Department', value: '', disabled: true },
                ...DEPARTMENTS.map(d => ({ label: d, value: d }))
              ]} 
              defaultValue=""
            />
            
            <Select 
              label="JOB POSITION" 
              required 
              options={[
                { label: 'Select Position', value: '', disabled: true },
                ...POSITIONS.map(p => ({ label: p, value: p }))
              ]} 
              defaultValue=""
            />
            
            <Select 
              label="MANAGER" 
              options={[
                { label: 'Select Manager', value: '' },
                { label: 'Amit Patel', value: 'Amit Patel' },
                { label: 'Neha Shah', value: 'Neha Shah' }
              ]} 
              defaultValue=""
            />
            
            <Select 
              label="EMPLOYMENT TYPE" 
              required
              options={[
                { label: 'Full Time', value: 'FULL_TIME' },
                { label: 'Part Time', value: 'PART_TIME' },
                { label: 'Contract', value: 'CONTRACT' }
              ]}
              defaultValue="FULL_TIME"
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-xs">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="BANK NAME" placeholder="HDFC Bank" />
            <Input label="ACCOUNT NAME" placeholder="John Doe" />
            <Input label="ACCOUNT NUMBER" placeholder="xxxx-xxxx-1234" />
            <Input label="IFSC CODE" placeholder="HDFC0001234" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={() => navigate('/employees')}>Cancel</Button>
          <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />} isLoading={loading}>
            Save Employee
          </Button>
        </div>
      </form>
    </div>
  );
};
