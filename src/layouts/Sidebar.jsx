import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  Wallet,
  BarChart3,
  UserCog,
  Settings,
  ChevronDown,
  Layers,
  ArrowDownUp,
  Receipt,
  CreditCard,
  History,
  Sparkles,
  Bot,
} from 'lucide-react';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'PRO' },
  {
    label: 'Products',
    icon: Package,
    children: [
      { to: '/products', label: 'All Products', icon: Package },
      { to: '/products/new', label: 'Add Product', icon: Package },
      { to: '/categories', label: 'Categories', icon: Layers },
      { to: '/stock', label: 'Stock Management', icon: ArrowDownUp },
    ],
  },
  {
    label: 'Sales',
    icon: ShoppingCart,
    children: [
      { to: '/sales/new', label: 'New Sale', icon: ShoppingCart },
      { to: '/sales', label: 'Sales History', icon: History },
      { to: '/receipts', label: 'Receipts', icon: Receipt },
    ],
  },
  {
    label: 'Purchases',
    icon: Truck,
    children: [
      { to: '/purchases/new', label: 'New Purchase', icon: Truck },
      { to: '/purchases', label: 'Purchase History', icon: History },
    ],
  },
  {
    label: 'Customers',
    icon: Users,
    children: [
      { to: '/customers', label: 'All Customers', icon: Users },
      { to: '/customers/debts', label: 'Customer Debts', icon: CreditCard },
      { to: '/customers/payments', label: 'Customer Payments', icon: Receipt },
    ],
  },
  { to: '/suppliers', label: 'Suppliers', icon: Building2 },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { to: '/reports', label: 'All Reports', icon: BarChart3 },
      { to: '/reports/profit', label: 'Profit', icon: Sparkles },
    ],
  },
  { to: '/users', label: 'Users', icon: UserCog },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function ItemLink({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/reports'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-150 ${
          isActive
            ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30'
            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
        }`
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60"></span>
      {label}
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }) {
  const location = useLocation();
  const [open, setOpen] = useState({});

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-950 text-white shadow-2xl border-r border-slate-800/60">
      {/* Store Logo & Branding Header */}
      <div className="border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1 shadow-md shadow-slate-950/50 ring-2 ring-brand-500/30">
            <img src="/logo.png" alt="JILE Electronics" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wide text-white flex items-center gap-1">
              <span className="text-rose-500">JILE</span>
              <span className="text-brand-400">Electronics</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-4">
        {items.map((item) => {
          if (!item.children) {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          }
          const Icon = item.icon;
          const isGroupActive = item.children.some((c) =>
            location.pathname.startsWith(c.to.split('/').slice(0, 2).join('/') || c.to)
          );
          const expanded = open[item.label] ?? isGroupActive;
          return (
            <div key={item.label} className="space-y-1">
              <button
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isGroupActive ? 'bg-slate-900/90 text-brand-400' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
                onClick={() => setOpen((s) => ({ ...s, [item.label]: !expanded }))}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${expanded ? 'rotate-180 text-brand-400' : 'text-slate-500'}`}
                />
              </button>
              {expanded && (
                <div className="ml-4 border-l border-slate-800/80 pl-2.5 space-y-1 pt-0.5 pb-1">
                  {item.children.map((child) => (
                    <ItemLink key={child.to} {...child} onClick={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="border-t border-slate-800/80 px-4 py-3 bg-slate-900/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>v1.0 Pro Edition</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
