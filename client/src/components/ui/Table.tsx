import React from 'react';
import type { TableColumn } from '../../types';
import { Spinner } from './Spinner';

export type Column<T> = TableColumn<T>;

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  emptyMessage,
  onRowClick,
  className = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full p-12 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-slate-500 font-medium">Loading dataset...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {emptyState || (
          <div className="p-12 text-center text-slate-500 text-sm">{emptyMessage || 'No data available'}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs ${className}`}>
      {/* Desktop & Tablet View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={col.key || col.accessor || idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40'
                }`}
              >
                {columns.map((col, idx) => {
                  const propKey = (col.key || col.accessor || '') as keyof T;
                  return (
                    <td key={col.key || col.accessor || idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                      {col.render ? col.render(item) : propKey ? (item as any)[propKey] : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="sm:hidden divide-y divide-slate-100">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            className={`p-4 space-y-2.5 ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
          >
            {columns.map((col, idx) => {
              const propKey = (col.key || col.accessor || '') as keyof T;
              return (
                <div key={col.key || col.accessor || idx} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wide">
                    {col.header}
                  </span>
                  <div className="text-right">
                    {col.render ? col.render(item) : propKey ? (item as any)[propKey] : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
