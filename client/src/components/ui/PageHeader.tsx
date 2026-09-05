import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  action,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2.5 pb-5 border-b border-slate-200 mb-6 ${className}`}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-900 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="font-semibold text-slate-800">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {icon && (
            <div className="p-2 bg-[#F5EFF4] text-[#714B67] border border-purple-100 rounded-lg shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {description && <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">{description}</p>}
          </div>
        </div>

        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
};
