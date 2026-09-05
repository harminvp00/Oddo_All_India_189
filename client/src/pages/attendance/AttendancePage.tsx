import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { CalendarClock, Search, Edit, Eye } from 'lucide-react';
import { DEPARTMENTS } from '../../features/employees/mockData';

const mockAttendance = [
  { id: 'a1', employee: 'Rahul Sharma', department: 'Engineering', date: '2026-09-05', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h', status: 'Present' },
  { id: 'a2', employee: 'Amit Patel', department: 'Engineering', date: '2026-09-05', checkIn: '09:30 AM', checkOut: '06:30 PM', hours: '9h', status: 'Late' },
  { id: 'a3', employee: 'Neha Shah', department: 'Human Resources', date: '2026-09-05', checkIn: '-', checkOut: '-', hours: '0h', status: 'Absent' },
  { id: 'a4', employee: 'Nimesh Patel', department: 'Finance', date: '2026-09-05', checkIn: '-', checkOut: '-', hours: '0h', status: 'On Leave' },
  { id: 'a5', employee: 'Priya Mehta', department: 'Sales', date: '2026-09-05', checkIn: '09:00 AM', checkOut: '01:00 PM', hours: '4h', status: 'Half Day' },
];

export const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState(mockAttendance);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  const [formData, setFormData] = useState({ checkIn: '', checkOut: '', status: '' });

  const filteredData = attendance.filter(a => {
    const matchesSearch = a.employee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter ? a.department === deptFilter : true;
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({ checkIn: record.checkIn, checkOut: record.checkOut, status: record.status });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAttendance(attendance.map(a => 
      a.id === editingRecord.id 
        ? { ...a, ...formData } 
        : a
    ));
    setIsModalOpen(false);
  };

  const columns: Column<typeof mockAttendance[0]>[] = [
    {
      header: 'Employee',
      accessor: 'employee',
      render: (item) => <span className="font-bold text-slate-900">{item.employee}</span>
    },
    {
      header: 'Date',
      accessor: 'date',
    },
    {
      header: 'Check In',
      accessor: 'checkIn',
    },
    {
      header: 'Check Out',
      accessor: 'checkOut',
    },
    {
      header: 'Worked Hours',
      accessor: 'hours',
      render: (item) => <span className="font-medium text-slate-700">{item.hours}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => {
        const variant = 
          item.status === 'Present' ? 'success' : 
          item.status === 'Late' ? 'warning' : 
          item.status === 'Absent' ? 'danger' : 
          item.status === 'On Leave' ? 'info' : 'neutral';
        return <Badge variant={variant}>{item.status}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
            <Edit className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Attendance Tracking"
        description="Monitor daily attendance, check-ins, and late arrivals."
        icon={<CalendarClock className="w-6 h-6" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Present', value: '112', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Late', value: '5', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Absent', value: '2', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'On Leave', value: '5', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl border border-slate-100 shadow-xs ${stat.bg}`}>
            <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search by employee..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full md:w-48">
          <Select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[
              { label: 'All Departments', value: '' },
              ...DEPARTMENTS.map(d => ({ label: d, value: d }))
            ]}
          />
        </div>
        <div className="w-full md:w-48">
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Present', value: 'Present' },
              { label: 'Late', value: 'Late' },
              { label: 'Absent', value: 'Absent' },
              { label: 'Half Day', value: 'Half Day' },
              { label: 'On Leave', value: 'On Leave' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <Table 
          columns={columns as any}
          data={filteredData}
          keyExtractor={(item) => item.id}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Attendance">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">
            Employee: {editingRecord?.employee} <br />
            Date: {editingRecord?.date}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="CHECK IN" 
              value={formData.checkIn}
              onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
            />
            <Input 
              label="CHECK OUT" 
              value={formData.checkOut}
              onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
            />
          </div>
          <Select 
            label="STATUS" 
            options={[
              { label: 'Present', value: 'Present' },
              { label: 'Late', value: 'Late' },
              { label: 'Absent', value: 'Absent' },
              { label: 'Half Day', value: 'Half Day' },
              { label: 'On Leave', value: 'On Leave' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
