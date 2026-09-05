import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavbarProps {
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

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

      {/* Right section: User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
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
