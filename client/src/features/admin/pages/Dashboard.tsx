import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { brand } from '../config/brand';
import { LayoutDashboard, Rocket, Sparkles, ArrowRight, Layers, HelpCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Application Workspace"
        description="Ready for hackathon problem statement implementation"
        icon={<LayoutDashboard className="w-6 h-6" />}
        action={
          <Link to="/sample/dashboard">
            <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Component Gallery
            </Button>
          </Link>
        }
      />

      {/* Domain Neutral Starter Shell */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[var(--brand)]" />
              <CardTitle>Welcome to {brand.name}</CardTitle>
            </div>
            <CardDescription>
              Your reusable frontend shell is compiled, configured, and responsive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              This dashboard is clean and unencumbered by domain-specific business assumptions.
              When the hackathon problem statement is announced, simply define your database models and business workflows here.
            </p>

            <div className="p-4 bg-[var(--brand-subtle)] border border-[var(--brand-soft)] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[var(--brand-hover)] font-bold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[var(--brand)]" />
                <span>Hackathon Speed Checklist</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 ml-5 list-disc font-medium">
                <li>Reuse existing UI primitives: <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">Button</code>, <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">Input</code>, <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">Table</code>, <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">Modal</code>, <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">Badge</code></li>
                <li>Connect backend endpoints via <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">api.get()</code> and <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">api.post()</code> in <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">services/api.ts</code></li>
                <li>Change primary brand color centrally in <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">index.css</code> or <code className="text-[var(--brand-hover)] font-mono font-bold bg-white/60 px-1 py-0.5 rounded">config/theme.ts</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-600" />
              <CardTitle>Sample Gallery</CardTitle>
            </div>
            <CardDescription>Inspect pre-built UI workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/sample/dashboard" className="block">
              <Button variant="outline" fullWidth size="sm">
                Sample Dashboard
              </Button>
            </Link>
            <Link to="/sample/list" className="block">
              <Button variant="outline" fullWidth size="sm">
                Sample CRUD List & Table
              </Button>
            </Link>
            <Link to="/sample/form" className="block">
              <Button variant="outline" fullWidth size="sm">
                Sample Form & Validation
              </Button>
            </Link>
            <Link to="/sample/details" className="block">
              <Button variant="ghost" fullWidth size="sm" leftIcon={<HelpCircle className="w-4 h-4" />}>
                Sample Details View
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
