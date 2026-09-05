import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { brand } from '../../config/brand';

export interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate dynamic breadcrumb items from URL path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const formattedSegments = pathSegments.map((seg, idx) => {
    const url = '/' + pathSegments.slice(0, idx + 1).join('/');
    const title = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { title, url };
  });

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/dashboard" className="hover:text-slate-900 text-slate-600">
            PeoplePay360
          </Link>
          {formattedSegments.map((item, idx) => (
            <React.Fragment key={item.url}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {idx === formattedSegments.length - 1 ? (
                <span className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                  {item.title}
                </span>
              ) : (
                <Link to={item.url} className="hover:text-slate-900 truncate max-w-[120px]">
                  {item.title}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right section: Search & Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search trigger */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 w-48 sm:w-64 cursor-pointer hover:border-slate-300 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Search employees, payroll...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#017E84] rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-20 animate-fadeIn text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-900">Notifications</span>
                  <span className="text-[10px] text-[#714B67] font-semibold cursor-pointer">Mark all as read</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition-colors">
                    <p className="font-semibold text-slate-800">Pending Leave Approval</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Alex Morgan submitted a request for 3 days.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">10m ago</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors">
                    <p className="font-semibold text-slate-800">Contract Overlap Protected</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Active contract verified for next payrun.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono">1h ago</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-md bg-[#F5EFF4] text-[#714B67] font-bold text-xs flex items-center justify-center border border-purple-100 shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'Member'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 block transition-colors"
                >
                  Account Settings
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
