import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CalendarDays, Plus, Edit, Clock } from 'lucide-react';

const mockSchedules = [
  { id: 's1', name: 'Standard Mon-Fri', hours: '40h/week', days: 'Mon, Tue, Wed, Thu, Fri', status: 'Active' },
  { id: 's2', name: 'Support 24/7 Shift A', hours: '42h/week', days: 'Mon, Tue, Wed, Sat, Sun', status: 'Active' },
  { id: 's3', name: 'Part-Time Morning', hours: '20h/week', days: 'Mon, Wed, Fri', status: 'Active' },
];

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState(mockSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Working Schedules"
        description="Define organizational working hours and shifts."
        icon={<CalendarDays className="w-6 h-6" />}
        action={
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Add Schedule
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map(schedule => (
          <Card key={schedule.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--brand)]" />
            <CardContent className="p-6 pt-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-900">{schedule.name}</h3>
                <Badge variant={schedule.status === 'Active' ? 'success' : 'neutral'}>{schedule.status}</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" /> {schedule.hours}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {schedule.days.split(', ').map(day => (
                    <span key={day} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
                  Edit Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Editor">
        <div className="space-y-4">
          <Input label="SCHEDULE NAME" placeholder="e.g. Standard Mon-Fri" defaultValue="Standard Mon-Fri" />
          
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-800 tracking-wide mb-3">WORKING DAYS & HOURS</label>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div key={day} className="flex items-center gap-3 p-3 mb-2 bg-slate-50 border border-slate-100 rounded-xl">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[var(--brand)]" />
                <span className="text-sm font-semibold text-slate-700 w-24">{day}</span>
                <Input type="time" defaultValue="09:00" containerClassName="w-24" />
                <span className="text-slate-400 text-xs">to</span>
                <Input type="time" defaultValue="18:00" containerClassName="w-24" />
                <Input type="text" placeholder="Break: 1 hr" containerClassName="flex-1" defaultValue="1hr break" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Save Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
