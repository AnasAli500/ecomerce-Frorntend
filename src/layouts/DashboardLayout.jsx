import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Moon, Sun, LogOut, User as UserIcon, Shield, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950 font-sans">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <img src="/logo.png" alt="JILE Logo" className="h-8 w-8 object-contain" />
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                <span className="text-rose-500">JILE</span> Electronics
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Welcome Back</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {user?.name || 'Administrator'}
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-950/80 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  <Shield size={10} />
                  {user?.role?.toUpperCase() || 'ADMIN'}
                </span>
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
              onClick={toggle}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-700" />}
            </button>

            {/* Notification Icon */}
            <button
              className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white sm:flex"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            </button>

            {/* Logout Button */}
            <button
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-bold text-rose-600 transition-all duration-200 hover:bg-rose-600 hover:text-white dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white shadow-sm"
              onClick={logout}
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
