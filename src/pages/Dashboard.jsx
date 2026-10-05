import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import Table from '../components/Table';
import Badge from '../components/Badge';
import { money } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState('daily');

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setData(res.data.data));
  }, []);

  if (!data) return <Spinner />;
  const t = data.totals;
  const chartData = data.charts[chart];

  const statCards = [
    { label: "Today's Sales", value: money(t.todaysSales), icon: TrendingUp, color: 'from-emerald-500 to-teal-600', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: "Today's Profit", value: money(t.todaysProfit), icon: Sparkles, color: 'from-indigo-500 to-purple-600', text: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Total Sales', value: money(t.totalSales), icon: DollarSign, color: 'from-blue-500 to-cyan-600', text: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Total Purchases', value: money(t.totalPurchases), icon: ShoppingCart, color: 'from-sky-500 to-blue-600', text: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
    { label: 'Total Products', value: t.totalProducts, icon: Package, color: 'from-amber-500 to-orange-600', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Total Customers', value: t.totalCustomers, icon: Users, color: 'from-violet-500 to-purple-600', text: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Total Suppliers', value: t.totalSuppliers, icon: Building2, color: 'from-slate-600 to-slate-800', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/40' },
    { label: 'Customer Debt', value: money(t.totalCustomerDebt), icon: CreditCard, color: 'from-rose-500 to-red-600', text: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Total Expenses', value: money(t.totalExpenses), icon: Wallet, color: 'from-fuchsia-500 to-pink-600', text: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
    { label: 'Current Stock Value', value: money(t.currentStockValue), icon: Package, color: 'from-teal-500 to-emerald-600', text: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Dashboard"
          subtitle="Real-time performance metrics & inventory analytics"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/sales/new"
            className="btn-primary"
          >
            <Plus size={16} />
            <span>New Sale</span>
          </Link>
          <Link
            to="/purchases/new"
            className="btn-secondary"
          >
            <Plus size={16} />
            <span>New Purchase</span>
          </Link>
        </div>
      </div>

      {/* Modern Grid of 10 Required Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} ${card.text}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </h3>
              </div>
              {/* Bottom accent gradient bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-500" />
              Sales Performance Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive revenue visualizer breakdown
            </p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {['daily', 'weekly', 'monthly', 'yearly'].map((key) => (
              <button
                key={key}
                onClick={() => setChart(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all duration-200 ${
                  chart === key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0276c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0276c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415522" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                }}
                formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Sales']}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#0276c7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Warning Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Low Stock Alert
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products requiring stock replenishment
              </p>
            </div>
          </div>
          <Link
            to="/stock"
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            <span>Stock Hub</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {data.lowStock.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ All products have sufficient stock levels!
            </p>
          </div>
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Product Name', render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: 'sku', label: 'SKU', render: (r) => <span className="font-mono text-xs">{r.sku}</span> },
              { key: 'currentStock', label: 'Current Stock', render: (r) => <span className="font-bold text-rose-600 dark:text-rose-400">{r.currentStock}</span> },
              { key: 'minStock', label: 'Minimum Required', render: (r) => r.minStock },
              {
                key: 'warn',
                label: 'Status',
                render: () => (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                    Low Stock
                  </span>
                ),
              },
            ]}
            rows={data.lowStock}
          />
        )}
      </div>
    </div>
  );
}
