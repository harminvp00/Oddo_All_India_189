import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Layers, Plus, Edit, Eye, CheckCircle2, ChevronRight, Sliders, Users, FileText } from 'lucide-react';

interface SalaryStructureItem {
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
  rulesCount: number;
  assignedEmployees: number;
  status: 'Active' | 'Draft' | 'Archived';
  rules: { code: string; name: string; category: string; sequence: number }[];
}

const mockStructures: SalaryStructureItem[] = [
  { 
    id: 'st1', 
    name: 'Regular Monthly Professional Salary', 
    code: 'REG_MONTHLY',
    type: 'Monthly', 
    description: 'Standard salary structure for full-time engineering, marketing, and sales staff.',
    rulesCount: 6, 
    assignedEmployees: 10,
    status: 'Active',
    rules: [
      { sequence: 10, code: 'BASIC', name: 'Basic Salary', category: 'Basic' },
      { sequence: 20, code: 'HRA', name: 'House Rent Allowance (HRA)', category: 'Allowance' },
      { sequence: 30, code: 'TRANSPORT', name: 'Transport / Conveyance Allowance', category: 'Allowance' },
      { sequence: 40, code: 'MEDICAL', name: 'Medical Allowance', category: 'Allowance' },
      { sequence: 50, code: 'PF_EMP', name: 'Provident Fund (Employee)', category: 'Deduction' },
      { sequence: 60, code: 'TDS_TAX', name: 'Tax Deducted at Source (TDS)', category: 'Deduction' },
    ]
  },
  { 
    id: 'st2', 
    name: 'Executive & Management Compensation', 
    code: 'EXEC_MGMT',
    type: 'Monthly', 
    description: 'Executive structure with performance bonuses and leadership allowances.',
    rulesCount: 8, 
    assignedEmployees: 2,
    status: 'Active',
    rules: [
      { sequence: 10, code: 'BASIC', name: 'Basic Salary', category: 'Basic' },
      { sequence: 20, code: 'HRA', name: 'Executive House Rent Allowance', category: 'Allowance' },
      { sequence: 25, code: 'MGMT_ALW', name: 'Management Leadership Allowance', category: 'Allowance' },
      { sequence: 30, code: 'PERF_BONUS', name: 'Performance Bonus', category: 'Allowance' },
      { sequence: 50, code: 'PF_EMP', name: 'Provident Fund', category: 'Deduction' },
      { sequence: 60, code: 'TDS_TAX', name: 'TDS High Income Bracket', category: 'Deduction' },
    ]
  },
  { 
    id: 'st3', 
    name: 'Contractual Fixed Hourly / Daily', 
    code: 'CONTRACT_FIXED',
    type: 'Hourly/Fixed', 
    description: 'Direct compensation for external specialist consultants and contractors.',
    rulesCount: 2, 
    assignedEmployees: 2,
    status: 'Active',
    rules: [
      { sequence: 10, code: 'FIXED_WAGE', name: 'Fixed Contract Wage', category: 'Basic' },
      { sequence: 50, code: 'TDS_194J', name: 'Section 194J TDS Deduction', category: 'Deduction' },
    ]
  },
];

export const SalaryStructuresPage: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructureItem[]>(mockStructures);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructureItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'Monthly',
    description: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newStructure: SalaryStructureItem = {
      id: `st-${Date.now()}`,
      name: form.name,
      code: form.code.toUpperCase(),
      type: form.type,
      description: form.description,
      rulesCount: 4,
      assignedEmployees: 0,
      status: 'Active',
      rules: [
        { sequence: 10, code: 'BASIC', name: 'Basic Salary', category: 'Basic' },
        { sequence: 20, code: 'HRA', name: 'HRA Allowance', category: 'Allowance' },
        { sequence: 50, code: 'PF', name: 'PF Deduction', category: 'Deduction' },
      ]
    };
    setStructures([...structures, newStructure]);
    setIsModalOpen(false);
    setForm({ name: '', code: '', type: 'Monthly', description: '' });
  };

  const columns: Column<SalaryStructureItem>[] = [
    {
      header: 'Structure Details',
      accessor: 'name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5EFF4] text-[#714B67] flex items-center justify-center font-bold text-xs shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{item.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">{item.code} • {item.description}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Payment Type',
      accessor: 'type',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {item.type}
        </span>
      )
    },
    {
      header: 'Salary Rules',
      accessor: 'rulesCount',
      render: (item) => (
        <Badge variant="purple">{item.rulesCount} Computed Rules</Badge>
      )
    },
    {
      header: 'Assigned Staff',
      accessor: 'assignedEmployees',
      render: (item) => (
        <span className="text-xs font-bold text-slate-900">{item.assignedEmployees} Employees</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => <Badge variant={item.status === 'Active' ? 'success' : 'neutral'}>{item.status}</Badge>
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedStructure(item)}
            title="Inspect Rules"
            className="text-[#714B67] hover:bg-[#F5EFF4] text-xs font-bold"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View Rules
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Salary Structures"
        description="Organized collections of sequenced salary computation rules driving automatic payslip calculations."
        icon={<Layers className="w-6 h-6 text-[#714B67]" />}
        action={
          <Button 
            variant="primary" 
            leftIcon={<Plus className="w-4 h-4" />} 
            onClick={() => setIsModalOpen(true)}
          >
            Create Structure
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Structures</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{structures.length} Configured</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F5EFF4] text-[#714B67]">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Rules Mapped</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">16 Salary Rules</div>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50 text-[#017E84]">
              <Sliders className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Covered Workforce</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">12 Active Contracts</div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <Table 
          columns={columns as any}
          data={structures}
          keyExtractor={(item) => item.id}
        />
      </div>

      {/* View Structure Rules Detail Drawer / Modal */}
      {selectedStructure && (
        <Modal
          isOpen={Boolean(selectedStructure)}
          onClose={() => setSelectedStructure(null)}
          title={`Structure: ${selectedStructure.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <p className="text-slate-600">{selectedStructure.description}</p>
              <div className="mt-2 flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                <span>CODE: {selectedStructure.code}</span>
                <span>TYPE: {selectedStructure.type}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sequenced Salary Rules</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {selectedStructure.rules.map((rule, idx) => (
                  <div key={rule.code} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded bg-[#F5EFF4] text-[#714B67] font-bold text-[11px] flex items-center justify-center font-mono">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{rule.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Rule Code: {rule.code} • Seq: {rule.sequence}</div>
                      </div>
                    </div>
                    <Badge variant={rule.category === 'Basic' ? 'purple' : rule.category === 'Allowance' ? 'teal' : 'danger'}>
                      {rule.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedStructure(null)}>
                Close Viewer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Structure Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Salary Structure"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="STRUCTURE NAME *" 
            placeholder="e.g. Standard Executive Salary" 
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input 
            label="UNIQUE CODE *" 
            placeholder="e.g. EXEC_SALARY" 
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <Select 
            label="PERIODICITY"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { label: 'Monthly Payroll', value: 'Monthly' },
              { label: 'Fixed Contractual', value: 'Fixed' },
              { label: 'Hourly Wage', value: 'Hourly' }
            ]}
          />
          <Input 
            label="DESCRIPTION" 
            placeholder="Purpose and applicable department groups..." 
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Structure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
