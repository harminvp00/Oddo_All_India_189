import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Sliders, Plus, Edit, Calculator, Check, Info } from 'lucide-react';

interface SalaryRuleItem {
  id: string;
  sequence: number;
  name: string;
  code: string;
  category: 'Basic' | 'Allowance' | 'Gross' | 'Deduction' | 'Net';
  type: 'Fixed' | 'Percentage' | 'Formula';
  formulaDesc: string;
  rate?: number;
  status: 'Active' | 'Inactive';
}

const mockRules: SalaryRuleItem[] = [
  { id: 'r1', sequence: 10, name: 'Basic Salary', category: 'Basic', code: 'BASIC', type: 'Fixed', formulaDesc: 'Defined in Employee Contract wage (Fixed)', status: 'Active' },
  { id: 'r2', sequence: 20, name: 'House Rent Allowance (HRA)', category: 'Allowance', code: 'HRA', type: 'Percentage', rate: 40, formulaDesc: '40% of BASIC salary (Metro HRA)', status: 'Active' },
  { id: 'r3', sequence: 30, name: 'Transport & Conveyance', category: 'Allowance', code: 'TRANSPORT', type: 'Fixed', formulaDesc: 'Fixed standard allowance ₹1,600/month', status: 'Active' },
  { id: 'r4', sequence: 40, name: 'Medical Allowance', category: 'Allowance', code: 'MEDICAL', type: 'Fixed', formulaDesc: 'Fixed medical reimbursement ₹1,250/month', status: 'Active' },
  { id: 'r5', sequence: 50, name: 'Provident Fund (Employee)', category: 'Deduction', code: 'PF_EMP', type: 'Percentage', rate: 12, formulaDesc: '12% of BASIC (Statutory Employee PF)', status: 'Active' },
  { id: 'r6', sequence: 60, name: 'Professional Tax (PT)', category: 'Deduction', code: 'PT', type: 'Fixed', formulaDesc: 'State slab deduction ₹200/month', status: 'Active' },
  { id: 'r7', sequence: 70, name: 'Tax Deducted at Source (TDS)', category: 'Deduction', code: 'TDS', type: 'Formula', formulaDesc: 'Income Tax Slab formula based on annual bracket', status: 'Active' },
];

export const SalaryRulesPage: React.FC = () => {
  const [rules, setRules] = useState<SalaryRuleItem[]>(mockRules);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    sequence: 10,
    category: 'Allowance' as SalaryRuleItem['category'],
    type: 'Percentage' as SalaryRuleItem['type'],
    rate: 20,
    formulaDesc: '',
  });

  const filteredRules = selectedCategory === 'ALL'
    ? rules
    : rules.filter((r) => r.category.toUpperCase() === selectedCategory);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: SalaryRuleItem = {
      id: `r-${Date.now()}`,
      sequence: Number(form.sequence),
      name: form.name,
      code: form.code.toUpperCase(),
      category: form.category,
      type: form.type,
      rate: form.rate,
      formulaDesc: form.formulaDesc || `${form.type} calculation for ${form.name}`,
      status: 'Active',
    };
    setRules([...rules, newRule].sort((a, b) => a.sequence - b.sequence));
    setIsModalOpen(false);
    setForm({ name: '', code: '', sequence: 10, category: 'Allowance', type: 'Percentage', rate: 20, formulaDesc: '' });
  };

  const columns: Column<SalaryRuleItem>[] = [
    { 
      header: 'Seq', 
      accessor: 'sequence', 
      render: item => (
        <span className="w-7 h-7 rounded bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
          {item.sequence}
        </span>
      ) 
    },
    { 
      header: 'Rule Details', 
      accessor: 'name', 
      render: item => (
        <div>
          <div className="font-bold text-slate-900 text-sm">{item.name}</div>
          <div className="text-[11px] text-slate-400 font-mono">Code: {item.code}</div>
        </div>
      ) 
    },
    { 
      header: 'Category', 
      accessor: 'category', 
      render: item => {
        const variant = item.category === 'Basic' ? 'purple' : item.category === 'Allowance' ? 'teal' : 'danger';
        return <Badge variant={variant}>{item.category}</Badge>;
      } 
    },
    { 
      header: 'Calculation Method', 
      accessor: 'type', 
      render: item => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">{item.type} {item.rate ? `(${item.rate}%)` : ''}</div>
          <div className="text-[11px] text-slate-500 font-normal">{item.formulaDesc}</div>
        </div>
      ) 
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: item => <Badge variant="success">{item.status}</Badge> 
    },
    { 
      header: 'Actions', 
      accessor: 'id', 
      render: item => (
        <Button variant="ghost" size="sm" title="Edit Rule" className="text-slate-600 hover:text-slate-900">
          <Edit className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>
      ) 
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <PageHeader
        title="Salary Rules"
        description="Configure fine-grained calculation rules for basic earnings, allowances, statutory contributions, and tax deductions."
        icon={<Sliders className="w-6 h-6 text-[#714B67]" />}
        action={
          <Button 
            variant="primary" 
            leftIcon={<Plus className="w-4 h-4" />} 
            onClick={() => setIsModalOpen(true)}
          >
            Create Rule
          </Button>
        }
      />

      {/* Category Tabs Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg w-fit text-xs font-semibold">
        {['ALL', 'BASIC', 'ALLOWANCE', 'DEDUCTION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat === 'ALL' ? 'All Rules' : cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <Table 
          columns={columns as any}
          data={filteredRules}
          keyExtractor={(item) => item.id}
        />
      </div>

      {/* Create Salary Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Salary Rule"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="RULE NAME *" 
              placeholder="e.g. House Rent Allowance" 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input 
              label="RULE CODE *" 
              placeholder="e.g. HRA" 
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select 
              label="CATEGORY *"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              options={[
                { label: 'Basic Pay', value: 'Basic' },
                { label: 'Allowance', value: 'Allowance' },
                { label: 'Deduction', value: 'Deduction' },
              ]}
            />
            <Input 
              label="SEQUENCE NUMBER *" 
              type="number"
              value={String(form.sequence)}
              onChange={(e) => setForm({ ...form, sequence: Number(e.target.value) })}
              helperText="Determines execution order (e.g. 10, 20, 30)"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select 
              label="COMPUTATION METHOD"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              options={[
                { label: 'Percentage of Basic', value: 'Percentage' },
                { label: 'Fixed Amount', value: 'Fixed' },
                { label: 'Formula Expression', value: 'Formula' }
              ]}
            />
            {form.type === 'Percentage' && (
              <Input 
                label="PERCENTAGE RATE (%)" 
                type="number"
                value={String(form.rate)}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                required
              />
            )}
          </div>

          <Input 
            label="DESCRIPTION & EXPLANATION" 
            placeholder="e.g. Calculated as 40% of Basic Salary for urban metro living..." 
            value={form.formulaDesc}
            onChange={(e) => setForm({ ...form, formulaDesc: e.target.value })}
            helperText="Provides clarity to payroll officers and employees on payslips."
          />

          <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 flex items-start gap-2 text-xs text-[#714B67]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Rules are processed sequentially. Allowances are calculated before statutory PF & Tax deductions.</span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
