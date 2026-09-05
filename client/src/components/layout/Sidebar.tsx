import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListFilter,
  FilePlus2,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
} from 'lucide-react';
import { brand } from '../../config/brand';
import { mainNavItems, sampleNavItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import type { NavItem } from '../../types';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

const getIcon = (path: string) => {
  if (path.includes('dashboard')) return <LayoutDashboard className="w-4 h-4" />;
  if (path.includes('list')) return <ListFilter className="w-4 h-4" />;
  if (path.includes('form')) return <FilePlus2 className="w-4 h-4" />;
  if (path.includes('details')) return <FileText className="w-4 h-4" />;
  return <LayoutDashboard className="w-4 h-4" />;
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const renderNavGroup = (items: NavItem[], groupTitle?: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="space-y-1">
        {groupTitle && (!collapsed || isMobile) && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold text-blue-900/60 uppercase tracking-widest">
            {groupTitle}
          </div>
        )}
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onCloseMobile : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--brand-soft)] text-[var(--brand-hover)] border border-blue-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-blue-50/50'
              }`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <span className={`shrink-0 ${isActive ? 'text-[var(--brand)]' : 'text-slate-400'}`}>
                {item.icon || getIcon(item.path)}
              </span>

              {(!collapsed || isMobile) && (
                <div className="flex items-center justify-between w-full overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-[var(--brand)] text-white'
                          : 'bg-blue-100/70 text-blue-700 border border-blue-200/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-blue-100/80">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-blue-100/80 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-2xl bg-[var(--brand-soft)] border border-blue-200/60 shrink-0 flex items-center justify-center shadow-xs">
            <img src={brand.logoMark} alt={brand.name} className="w-5 h-5 object-contain" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight leading-none">{brand.shortName}</span>
              <span className="text-[10px] text-blue-600 uppercase tracking-widest font-mono mt-1 font-bold">
                UI Shell
              </span>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-blue-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-blue-50 transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-4">
        {renderNavGroup(mainNavItems, 'Main Menu')}
        {renderNavGroup(sampleNavItems, 'Sample Gallery')}
      </div>

      {/* User Footer Profile */}
      {(!collapsed || isMobile) && (
        <div className="p-3 border-t border-blue-100/80 bg-blue-50/40 m-2 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-hover)] font-extrabold text-xs flex items-center justify-center border border-blue-200/80 shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-500 truncate capitalize font-medium">{user?.role || 'Admin'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return <div className="h-full">{sidebarContent}</div>;
  }

  return (
    <aside
      className={`hidden lg:block shrink-0 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="sticky top-0 h-screen">{sidebarContent}</div>
    </aside>
  );
};
