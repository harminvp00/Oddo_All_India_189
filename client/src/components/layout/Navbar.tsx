import React, { useState } from 'react';
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { brand } from '../../config/brand';

export interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-blue-100/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left section: Mobile menu toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-blue-50 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 text-sm tracking-tight hidden sm:inline-block">
            {brand.name}
          </span>
        </div>
      </div>

      {/* Right section: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-blue-50 transition-colors relative"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--brand)] rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-blue-100" />

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-blue-50/70 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-hover)] font-extrabold text-xs flex items-center justify-center border border-blue-200/80 shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-extrabold text-slate-900 leading-tight">
                {user?.name || 'User Account'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'Member'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-blue-100 rounded-2xl shadow-xl py-1.5 z-20 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-blue-50">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
