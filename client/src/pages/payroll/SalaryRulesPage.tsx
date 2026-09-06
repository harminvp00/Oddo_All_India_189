import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, type Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Card, CardContent } from '../../components/ui/Card';
import { Sliders, Plus, Edit, Calculator, Check, Info } from 'lucide-react';
import { salaryRuleService, type UpdateSalaryRuleDTO } from '../../services/salaryRuleService';

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

  // Edit State & Modal
  const [editingRule, setEditingRule] = useState<SalaryRuleItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    sequence: 10,
    category: 'Allowance' as SalaryRuleItem['category'],
    type: 'Percentage' as SalaryRuleItem['type'],
    rate: 20,
    formulaDesc: '',
    status: 'Active' as SalaryRuleItem['status'],
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    sequence: 10,
    category: 'Allowance' as SalaryRuleItem['category'],
    type: 'Percentage' as SalaryRuleItem['type'],
    rate: 20,
    formulaDesc: '',
  });

  // Load rules from backend API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRules() {
      try {
        const res = await salaryRuleService.listRules();
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const categoryRevMap: Record<string, SalaryRuleItem['category']> = {
            BASIC: 'Basic',
            ALLOWANCE: 'Allowance',
            DEDUCTION: 'Deduction',
            GROSS: 'Gross',
            NET: 'Net',
          };
          const methodRevMap: Record<string, SalaryRuleItem['type']> = {
            FIXED: 'Fixed',
            PERCENTAGE: 'Percentage',
            FORMULA: 'Formula',
          };
          const mapped: SalaryRuleItem[] = res.data.map((r, idx) => ({
            id: r.id.toString(),
            sequence: (idx + 1) * 10,
            name: r.name,
            code: r.code,
            category: categoryRevMap[r.category] || 'Allowance',
            type: methodRevMap[r.method] || 'Percentage',
            rate:
              r.percentage !== null && r.percentage !== undefined
                ? Number(r.percentage) * (r.percentage <= 1 ? 100 : 1)
                : r.fixed_amount !== null && r.fixed_amount !== undefined
                ? Number(r.fixed_amount)
                : undefined,
            formulaDesc:
              r.formula ||
              (r.percentage
                ? `${(Number(r.percentage) * (r.percentage <= 1 ? 100 : 1)).toFixed(0)}% of Basic Salary`
                : r.fixed_amount
                ? `Fixed allowance ₹${r.fixed_amount}/month`
                : `${r.method} computation for ${r.name}`),
            status: r.is_active ? 'Active' : 'Inactive',
          }));
          setRules(mapped);
        }
      } catch (err) {
        console.warn('Could not load live salary rules, fallback to default rules:', err);
      }
    }
    loadRules();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleOpenEdit = (item: SalaryRuleItem) => {
    setEditingRule(item);
    setEditForm({
      name: item.name,
      code: item.code,
      sequence: item.sequence,
      category: item.category,
      type: item.type,
      rate: item.rate ?? (item.type === 'Percentage' ? 20 : 1000),
      formulaDesc: item.formulaDesc || '',
      status: item.status,
    });
    setEditErrors({});
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingRule(null);
    setEditErrors({});
    setEditFormError(null);
  };

  const validateEditForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!editForm.name.trim()) {
      errs.name = 'Rule name is required.';
    } else if (editForm.name.trim().length < 2) {
      errs.name = 'Rule name must be at least 2 characters.';
    } else if (editForm.name.trim().length > 100) {
      errs.name = 'Rule name cannot exceed 100 characters.';
    }

    if (!editForm.code.trim()) {
      errs.code = 'Rule code is required.';
    } else if (!/^[A-Za-z0-9_-]+$/.test(editForm.code.trim())) {
      errs.code = 'Rule code can only contain letters, numbers, hyphens, and underscores.';
    } else if (editForm.code.trim().length > 40) {
      errs.code = 'Rule code cannot exceed 40 characters.';
    }

    if (editForm.sequence === undefined || isNaN(Number(editForm.sequence)) || Number(editForm.sequence) < 1) {
      errs.sequence = 'Sequence must be a positive number.';
    }

    if (editForm.type === 'Percentage') {
      if (editForm.rate === undefined || isNaN(Number(editForm.rate)) || Number(editForm.rate) < 0 || Number(editForm.rate) > 100) {
        errs.rate = 'Percentage rate must be between 0 and 100.';
      }
    } else if (editForm.type === 'Fixed') {
      if (editForm.rate === undefined || isNaN(Number(editForm.rate)) || Number(editForm.rate) < 0) {
        errs.rate = 'Fixed amount must be a positive number or 0.';
      }
    }

    setEditErrors(errs);
    if (Object.keys(errs).length > 0) {
      setEditFormError(Object.values(errs)[0]);
      return false;
    }
    setEditFormError(null);
    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    if (!validateEditForm()) return;

    setUpdating(true);
    setEditFormError(null);

    const updatedItem: SalaryRuleItem = {
      ...editingRule,
      name: editForm.name.trim(),
      code: editForm.code.trim().toUpperCase(),
      sequence: Number(editForm.sequence),
      category: editForm.category,
      type: editForm.type,
      rate: editForm.type === 'Percentage' || editForm.type === 'Fixed' ? Number(editForm.rate) : undefined,
      formulaDesc: editForm.formulaDesc.trim() || `${editForm.type} calculation for ${editForm.name.trim()}`,
      status: editForm.status,
    };

    try {
      // Call proper Edit API
      const categoryMap: Record<string, any> = {
        Basic: 'BASIC',
        Allowance: 'ALLOWANCE',
        Deduction: 'DEDUCTION',
        Gross: 'GROSS',
        Net: 'NET',
      };
      const methodMap: Record<string, any> = {
        Fixed: 'FIXED',
        Percentage: 'PERCENTAGE',
        Formula: 'FORMULA',
      };

      const payload: UpdateSalaryRuleDTO = {
        name: updatedItem.name,
        code: updatedItem.code,
        category: categoryMap[updatedItem.category] || 'ALLOWANCE',
        method: methodMap[updatedItem.type] || 'PERCENTAGE',
        percentage: updatedItem.type === 'Percentage' ? (updatedItem.rate ?? 0) / 100 : null,
        fixedAmount: updatedItem.type === 'Fixed' ? updatedItem.rate ?? null : null,
        formula: updatedItem.type === 'Formula' ? updatedItem.formulaDesc : null,
        isActive: updatedItem.status === 'Active',
      };

      const isDbId = /^\d+$/.test(editingRule.id);
      if (isDbId) {
        await salaryRuleService.updateRule(editingRule.id, payload);
      } else {
        try {
          await salaryRuleService.updateRule(editingRule.id, payload);
        } catch {
          // Graceful fallback for mock items
        }
      }

      setRules((prev) =>
        prev
          .map((r) => (r.id === editingRule.id ? updatedItem : r))
          .sort((a, b) => a.sequence - b.sequence)
      );

      setIsEditModalOpen(false);
      setEditingRule(null);
      setSuccessMsg(`Salary rule "${updatedItem.name}" (${updatedItem.code}) updated successfully!`);
    } catch (err: any) {
      console.error('Failed to update salary rule:', err);
      setEditFormError(err?.message || 'Failed to update salary rule via API.');
    } finally {
      setUpdating(false);
    }
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
      render: item => <Badge variant={item.status === 'Active' ? 'success' : 'neutral'}>{item.status}</Badge> 
    },
    { 
      header: 'Actions', 
      accessor: 'id', 
      render: item => (
        <Button 
          variant="ghost" 
          size="sm" 
          title="Edit Rule" 
          onClick={() => handleOpenEdit(item)}
          className="text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
        >
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

      {successMsg && (
        <Alert variant="success" title="Success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

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

      {/* Edit Salary Rule Modal */}
      {editingRule && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          title={`Edit Salary Rule: ${editingRule.name}`}
        >
          <form onSubmit={handleUpdate} className="space-y-4" noValidate>
            {editFormError && (
              <Alert variant="danger" title="Validation Error" onClose={() => setEditFormError(null)}>
                {editFormError}
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="RULE NAME"
                required
                maxLength={100}
                placeholder="e.g. House Rent Allowance"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm({ ...editForm, name: e.target.value });
                  if (editErrors.name) setEditErrors((prev) => { const n = { ...prev }; delete n.name; return n; });
                }}
                error={editErrors.name}
              />
              <Input
                label="RULE CODE"
                required
                maxLength={40}
                placeholder="e.g. HRA"
                value={editForm.code}
                onChange={(e) => {
                  setEditForm({ ...editForm, code: e.target.value.toUpperCase() });
                  if (editErrors.code) setEditErrors((prev) => { const n = { ...prev }; delete n.code; return n; });
                }}
                error={editErrors.code}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="CATEGORY"
                required
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                options={[
                  { label: 'Basic Pay', value: 'Basic' },
                  { label: 'Allowance', value: 'Allowance' },
                  { label: 'Deduction', value: 'Deduction' },
                  { label: 'Gross', value: 'Gross' },
                  { label: 'Net', value: 'Net' },
                ]}
              />
              <Input
                label="SEQUENCE NUMBER"
                type="number"
                required
                value={String(editForm.sequence)}
                onChange={(e) => {
                  setEditForm({ ...editForm, sequence: Number(e.target.value) });
                  if (editErrors.sequence) setEditErrors((prev) => { const n = { ...prev }; delete n.sequence; return n; });
                }}
                error={editErrors.sequence}
                helperText="Determines execution order (e.g. 10, 20, 30)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="COMPUTATION METHOD"
                required
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                options={[
                  { label: 'Percentage of Basic', value: 'Percentage' },
                  { label: 'Fixed Amount', value: 'Fixed' },
                  { label: 'Formula Expression', value: 'Formula' },
                ]}
              />
              {editForm.type === 'Percentage' && (
                <Input
                  label="PERCENTAGE RATE (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={String(editForm.rate ?? 0)}
                  onChange={(e) => {
                    setEditForm({ ...editForm, rate: Number(e.target.value) });
                    if (editErrors.rate) setEditErrors((prev) => { const n = { ...prev }; delete n.rate; return n; });
                  }}
                  error={editErrors.rate}
                />
              )}
              {editForm.type === 'Fixed' && (
                <Input
                  label="FIXED AMOUNT (₹)"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={String(editForm.rate ?? 0)}
                  onChange={(e) => {
                    setEditForm({ ...editForm, rate: Number(e.target.value) });
                    if (editErrors.rate) setEditErrors((prev) => { const n = { ...prev }; delete n.rate; return n; });
                  }}
                  error={editErrors.rate}
                />
              )}
              {editForm.type === 'Formula' && (
                <Select
                  label="RULE STATUS"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  options={[
                    { label: 'Active', value: 'Active' },
                    { label: 'Inactive', value: 'Inactive' },
                  ]}
                />
              )}
            </div>

            {editForm.type !== 'Formula' && (
              <Select
                label="RULE STATUS"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
              />
            )}

            <Input
              label="DESCRIPTION & EXPLANATION"
              placeholder="e.g. Calculated as 40% of Basic Salary for urban metro living..."
              value={editForm.formulaDesc}
              onChange={(e) => setEditForm({ ...editForm, formulaDesc: e.target.value })}
              helperText="Shown on payslips and calculation breakdowns."
            />

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button variant="ghost" type="button" onClick={handleCloseEdit} disabled={updating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={updating}
                leftIcon={updating ? <Spinner size="sm" /> : undefined}
              >
                {updating ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
