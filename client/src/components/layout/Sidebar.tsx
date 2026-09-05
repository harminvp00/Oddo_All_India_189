import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
} from 'lucide-react';
import { brand } from '../../config/brand';
import { navGroups } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import type { NavItem } from '../../types';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const renderNavGroup = (items: NavItem[], groupTitle?: string) => {
    // Filter items based on user role
    const filteredItems = items.filter(
      (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    if (filteredItems.length === 0) return null;

    return (
      <div key={groupTitle || 'group'} className="space-y-0.5">
        {groupTitle && (!collapsed || isMobile) && (
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            {groupTitle}
          </div>
        )}
        {filteredItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && (item.path !== '/' || location.pathname === '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onCloseMobile : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#F5EFF4] text-[#714B67] font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <span className={`shrink-0 transition-colors ${isActive ? 'text-[#714B67]' : 'text-slate-400'}`}>
                {item.icon}
              </span>

              {(!collapsed || isMobile) && (
                <div className="flex items-center justify-between w-full overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                        isActive
                          ? 'bg-[#714B67] text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
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
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#F5EFF4] border border-purple-100 shrink-0 flex items-center justify-center">
            <img src={brand.logoMark} alt={brand.name} className="w-5 h-5 object-contain" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">{brand.name}</span>
              <span className="text-[10px] text-[#017E84] font-mono mt-0.5 font-semibold">
                HR & Payroll OS
              </span>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 py-2 px-2.5 overflow-y-auto space-y-2">
        {navGroups.map((group) => renderNavGroup(group.items, group.title))}
      </div>

      {/* User Footer Profile */}
      {(!collapsed || isMobile) && (
        <div className="p-2.5 border-t border-slate-200 bg-slate-50/70 m-2 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-[#F5EFF4] text-[#714B67] font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate leading-tight">{user?.name || 'User'}</span>
              <span className="text-[10px] text-slate-500 truncate capitalize font-medium">{user?.role || 'Member'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
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
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="sticky top-0 h-screen">{sidebarContent}</div>
    </aside>
  );
};
