import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { mockEmployees } from '../../features/employees/mockData';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Briefcase, Calendar } from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const employee = mockEmployees.find(emp => emp.id === id) || mockEmployees[0];

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'contract', label: 'Contract' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'timeoff', label: 'Time Off' },
    { id: 'salary', label: 'Salary Rules' },
    { id: 'payslips', label: 'Payslips' },
    { id: 'payments', label: 'Payments' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-6xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />
        
        <div className="relative mt-8 flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end">
            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md">
              <div className="w-full h-full rounded-xl bg-blue-100 text-blue-700 font-extrabold text-3xl flex items-center justify-center">
                {employee.avatar}
              </div>
            </div>
            <div className="pb-1 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-slate-900">{employee.name}</h1>
              <div className="flex flex-wrap gap-2 items-center mt-2 justify-center sm:justify-start">
                <Badge variant={employee.status === 'Active' ? 'success' : 'neutral'}>{employee.status}</Badge>
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> {employee.position}
                </span>
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> {employee.department}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/employees')} className="flex-1 sm:flex-none">
              Back
            </Button>
            <Button variant="primary" leftIcon={<Edit className="w-4 h-4" />} className="flex-1 sm:flex-none">
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="px-2 pt-2">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        
        <div className="p-6 bg-slate-50/50 min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              <Card className="border-slate-200/60 shadow-none">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Contact Information</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" /> {employee.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" /> {employee.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" /> {employee.address}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60 shadow-none">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Employment Summary</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" /> Joined on {employee.joiningDate}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="w-4 h-4 flex justify-center text-slate-400 font-bold">M</span>
                    Manager: {employee.manager}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60 shadow-none md:col-span-2">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Bank Details & Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Bank Name</div>
                      <div className="font-medium text-slate-800">{employee.bankName || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Account Number</div>
                      <div className="font-medium text-slate-800">{employee.bankAccount || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">IFSC Code</div>
                      <div className="font-medium text-slate-800">{employee.ifsc || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Emergency Contact</div>
                      <div className="font-medium text-slate-800">{employee.emergencyContact || 'Not provided'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{TABS.find(t => t.id === activeTab)?.label} Data</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md">
                This section will display the {activeTab} information related to {employee.name}.
                Frontend routing is prepared for the corresponding feature components.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
