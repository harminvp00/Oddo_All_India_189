import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CalendarDays, Check, X } from 'lucide-react';

const mockLeaveTypes = [
  { id: 't1', name: 'Casual Leave', unit: 'Days', approval: 'Yes', allocation: 'Yes', status: 'Active' },
  { id: 't2', name: 'Sick Leave', unit: 'Days', approval: 'Yes', allocation: 'Yes', status: 'Active' },
  { id: 't3', name: 'Unpaid Leave', unit: 'Days', approval: 'Yes', allocation: 'No', status: 'Active' },
];

const mockAllocations = [
  { id: 'a1', employee: 'Rahul Sharma', type: 'Casual Leave', allocated: 20, used: 3, remaining: 17, validity: '2026-12-31' },
  { id: 'a2', employee: 'Amit Patel', type: 'Sick Leave', allocated: 12, used: 12, remaining: 0, validity: '2026-12-31' },
  { id: 'a3', employee: 'Neha Shah', type: 'Casual Leave', allocated: 20, used: 0, remaining: 20, validity: '2026-12-31' },
];

const mockRequestsData = [
  { id: 'r1', employee: 'Rahul Sharma', type: 'Casual Leave', start: '2026-09-10', end: '2026-09-12', days: 3, reason: 'Personal Trip', status: 'Pending' },
  { id: 'r2', employee: 'Priya Mehta', type: 'Sick Leave', start: '2026-09-02', end: '2026-09-03', days: 2, reason: 'Fever', status: 'Approved' },
  { id: 'r3', employee: 'Amit Patel', type: 'Casual Leave', start: '2026-08-15', end: '2026-08-15', days: 1, reason: 'Family Function', status: 'Rejected' },
];

export const TimeOffPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL path
  const getTabFromPath = () => {
    if (location.pathname.includes('allocations')) return 'allocations';
    if (location.pathname.includes('requests')) return 'requests';
    return 'types';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [requests, setRequests] = useState(mockRequestsData);
  const [allocations, setAllocations] = useState(mockAllocations);

  // Sync tab state with URL without hard-refreshing
  useEffect(() => {
    navigate(`/time-off/${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  const handleApprove = (id: string, employee: string, type: string, days: number) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    // Update allocation visually
    setAllocations(allocations.map(a => {
      if (a.employee === employee && a.type === type) {
        return { ...a, used: a.used + days, remaining: a.remaining - days };
      }
      return a;
    }));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
  };

  const typesColumns: Column<typeof mockLeaveTypes[0]>[] = [
    { header: 'Leave Type Name', accessor: 'name', render: item => <span className="font-bold">{item.name}</span> },
    { header: 'Unit', accessor: 'unit' },
    { header: 'Approval Req.', accessor: 'approval' },
    { header: 'Allocation Req.', accessor: 'allocation' },
    { header: 'Status', accessor: 'status', render: item => <Badge variant="success">{item.status}</Badge> }
  ];

  const allocationsColumns: Column<typeof mockAllocations[0]>[] = [
    { header: 'Employee', accessor: 'employee', render: item => <span className="font-bold">{item.employee}</span> },
    { header: 'Leave Type', accessor: 'type', render: item => <span className="text-slate-600">{item.type}</span> },
    { header: 'Allocated', accessor: 'allocated', render: item => <span className="font-bold text-slate-800">{item.allocated}</span> },
    { header: 'Used', accessor: 'used', render: item => <span className="font-medium text-rose-500">{item.used}</span> },
    { header: 'Remaining', accessor: 'remaining', render: item => <span className="font-bold text-emerald-600">{item.remaining}</span> },
    { header: 'Validity', accessor: 'validity' }
  ];

  const requestsColumns: Column<typeof mockRequestsData[0]>[] = [
    { header: 'Employee', accessor: 'employee', render: item => <span className="font-bold">{item.employee}</span> },
    { header: 'Leave Type', accessor: 'type', render: item => <span className="text-slate-600">{item.type}</span> },
    { header: 'Duration', accessor: 'start', render: item => <span className="text-sm">{item.start} to {item.end} ({item.days} days)</span> },
    { header: 'Reason', accessor: 'reason' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: item => {
        const variant = item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning';
        return <Badge variant={variant}>{item.status}</Badge>;
      } 
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        item.status === 'Pending' ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleApprove(item.id, item.employee, item.type, item.days)} title="Approve">
              <Check className="w-4 h-4 text-emerald-500" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleReject(item.id)} title="Reject">
              <X className="w-4 h-4 text-rose-500" />
            </Button>
          </div>
        ) : <span className="text-xs text-slate-400">Processed</span>
      ),
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Time Off Management"
        description="Configure leave types, track allocations, and approve requests."
        icon={<CalendarDays className="w-6 h-6" />}
      />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="px-4 pt-4 border-b border-slate-100">
          <Tabs 
            tabs={[
              { id: 'types', label: 'Time Off Types' },
              { id: 'allocations', label: 'Allocations' },
              { id: 'requests', label: 'Requests' },
            ]} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        </div>
        
        <div className="p-0">
          {activeTab === 'types' && (
            <Table columns={typesColumns as any} data={mockLeaveTypes} keyExtractor={(item) => item.id} />
          )}
          {activeTab === 'allocations' && (
            <Table columns={allocationsColumns as any} data={allocations} keyExtractor={(item) => item.id} />
          )}
          {activeTab === 'requests' && (
            <Table columns={requestsColumns as any} data={requests} keyExtractor={(item) => item.id} />
          )}
        </div>
      </div>
    </div>
  );
};
