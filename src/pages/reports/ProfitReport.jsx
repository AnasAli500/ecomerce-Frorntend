import { useEffect, useState, useMemo, Fragment } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ShoppingCart,
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { money, formatDate } from '../../utils/format';

function formatInputDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriodDates(periodType) {
  const now = new Date();
  if (periodType === 'today') {
    const todayStr = formatInputDate(now);
    return { from: todayStr, to: todayStr };
  }
  if (periodType === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday start
    d.setDate(d.getDate() - diff);
    return { from: formatInputDate(d), to: formatInputDate(now) };
  }
  if (periodType === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: formatInputDate(d), to: formatInputDate(now) };
  }
  return { from: formatInputDate(now), to: formatInputDate(now) };
}

function roundMoney(val) {
  return Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;
}

function computeProfitFromSales(rawSales = []) {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  const sales = (rawSales || []).map((sale) => {
    const orderDiscount = roundMoney(Number(sale.discount ?? sale.orderDiscount ?? 0));
    const rawItems = sale.items || [];

    let lineProfitsSum = 0;
    let lineRevenuesSum = 0;
    let totalCostSum = 0;

    const items = rawItems.map((item) => {
      const qty = Number(item.quantity ?? item.qty ?? 0);
      const sellingPrice = Number(item.sellingPrice ?? 0);
      const costPrice = Number(
        item.costPrice !== undefined && item.costPrice !== null
          ? item.costPrice
          : (item.purchasePrice !== undefined && item.purchasePrice !== null
              ? item.purchasePrice
              : (item.product?.costPrice ?? item.product?.purchasePrice ?? 0))
      );
      const lineDiscount = Number(item.discount ?? item.lineDiscount ?? 0);

      const lineRevenue = roundMoney(sellingPrice * qty - lineDiscount);
      const lineCost = roundMoney(costPrice * qty);
      const lineProfit = roundMoney((sellingPrice - costPrice) * qty - lineDiscount);

      lineProfitsSum += lineProfit;
      lineRevenuesSum += (sellingPrice * qty - lineDiscount);
      totalCostSum += lineCost;

      let categoryName = 'General';
      if (item.categoryName) {
        categoryName = item.categoryName;
      } else if (item.product && typeof item.product === 'object') {
        if (typeof item.product.category === 'object' && item.product.category?.name) {
          categoryName = item.product.category.name;
        } else if (typeof item.product.category === 'string') {
          categoryName = item.product.category;
        }
      }

      return {
        productName: item.productName || item.product?.name || 'Product',
        categoryName: categoryName || 'General',
        qty,
        sellingPrice: roundMoney(sellingPrice),
        costPrice: roundMoney(costPrice),
        lineDiscount: roundMoney(lineDiscount),
        lineRevenue,
        lineProfit,
      };
    });

    // If sale had no items populated, fall back to sale totals
    let saleRevenue;
    let saleCost;
    let saleProfit;

    if (rawItems.length === 0) {
      saleRevenue = roundMoney(Number(sale.total ?? sale.subtotal ?? 0));
      saleCost = 0;
      saleProfit = saleRevenue;
    } else {
      saleRevenue = roundMoney(lineRevenuesSum - orderDiscount);
      saleCost = roundMoney(totalCostSum);
      saleProfit = roundMoney(lineProfitsSum - orderDiscount);
    }

    totalRevenue += saleRevenue;
    totalCost += saleCost;
    totalProfit += saleProfit;

    return {
      saleId: sale._id ? String(sale._id) : (sale.saleId || ''),
      invoiceNo: sale.invoiceNumber || sale.invoiceNo || '',
      date: sale.date || sale.createdAt,
      customerName:
        typeof sale.customer === 'object' && sale.customer?.name
          ? sale.customer.name
          : (sale.customerName || (typeof sale.customer === 'string' ? sale.customer : 'Normal Customer')),
      orderDiscount,
      saleRevenue,
      saleCost,
      saleProfit,
      items,
    };
  });

  return {
    summary: {
      totalRevenue: roundMoney(totalRevenue),
      totalCost: roundMoney(totalCost),
      totalProfit: roundMoney(totalProfit),
      salesCount: sales.length,
    },
    sales,
  };
}

export default function ProfitReport() {
  const [period, setPeriod] = useState('today');
  const [from, setFrom] = useState(() => getPeriodDates('today').from);
  const [to, setTo] = useState(() => getPeriodDates('today').to);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'profit-desc' | 'profit-asc'
  const [expandedSaleIds, setExpandedSaleIds] = useState({});

  const loadData = async (fromDate, toDate) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      let result = null;

      // 1. Try dedicated report profit endpoint
      try {
        const res = await api.get('/reports/profit', { params });
        if (res.data?.data?.summary) {
          result = res.data.data;
        }
      } catch (e1) {
        // Fall through to sales/profit
      }

      // 2. Try sales profit endpoint
      if (!result) {
        try {
          const res = await api.get('/sales/profit', { params });
          if (res.data?.data?.summary) {
            result = res.data.data;
          }
        } catch (e2) {
          // Fall through to robust sales list fallback
        }
      }

      // 3. Robust fallback: Fetch sales directly (guaranteed to work across all backend versions)
      if (!result) {
        const salesParams = { limit: 'all' };
        if (fromDate && toDate) {
          salesParams.from = fromDate;
          salesParams.to = toDate;
        }
        const salesRes = await api.get('/sales', { params: salesParams });
        const rawSales = Array.isArray(salesRes.data?.data)
          ? salesRes.data.data
          : Array.isArray(salesRes.data)
            ? salesRes.data
            : [];

        // Apply strict date filtering
        const fStart = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
        const fEnd = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

        const filtered = rawSales.filter((s) => {
          if (!fStart && !fEnd) return true;
          const sDate = new Date(s.date || s.createdAt);
          if (fStart && sDate < fStart) return false;
          if (fEnd && sDate > fEnd) return false;
          return true;
        });

        result = computeProfitFromSales(filtered);
      }

      setData(result);
    } catch (err) {
      console.error('Failed to load profit data:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load profit data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      const range = getPeriodDates(period);
      setFrom(range.from);
      setTo(range.to);
      loadData(range.from, range.to);
    }
  }, [period]);

  const handleCustomApply = () => {
    if (!customFrom || !customTo) return;
    setFrom(customFrom);
    setTo(customTo);
    loadData(customFrom, customTo);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'custom') {
      if (!customFrom) setCustomFrom(from);
      if (!customTo) setCustomTo(to);
    }
  };

  const toggleExpand = (saleId) => {
    setExpandedSaleIds((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  };

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    if (!data?.sales) return [];
    let list = [...data.sales];

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((sale) => {
        const matchCustomer = (sale.customerName || '').toLowerCase().includes(term);
        const matchInvoice = (sale.invoiceNo || '').toLowerCase().includes(term);
        const matchProduct = (sale.items || []).some((item) =>
          (item.productName || '').toLowerCase().includes(term) ||
          (item.categoryName || '').toLowerCase().includes(term)
        );
        return matchCustomer || matchInvoice || matchProduct;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'profit-desc') return b.saleProfit - a.saleProfit;
      if (sortBy === 'profit-asc') return a.saleProfit - b.saleProfit;
      if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
      return 0;
    });

    return list;
  }, [data?.sales, search, sortBy]);

  // Aggregate top profitable products for the selected period
  const topProducts = useMemo(() => {
    if (!data?.sales) return [];
    const productMap = {};

    data.sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = item.productName || 'Unknown Product';
        if (!productMap[key]) {
          productMap[key] = {
            productName: key,
            categoryName: item.categoryName || 'Uncategorized',
            totalQty: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
          };
        }
        productMap[key].totalQty += Number(item.qty || 0);
        productMap[key].totalRevenue += Number(item.lineRevenue || 0);
        productMap[key].totalCost += Number(item.costPrice || 0) * Number(item.qty || 0);
        productMap[key].totalProfit += Number(item.lineProfit || 0);
      });
    });

    return Object.values(productMap)
      .map((p) => ({
        ...p,
        totalRevenue: Math.round((p.totalRevenue + Number.EPSILON) * 100) / 100,
        totalCost: Math.round((p.totalCost + Number.EPSILON) * 100) / 100,
        totalProfit: Math.round((p.totalProfit + Number.EPSILON) * 100) / 100,
        margin: p.totalRevenue > 0 ? Math.round((p.totalProfit / p.totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);
  }, [data?.sales]);

  const summary = data?.summary || {
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    salesCount: 0,
  };

  const isProfitPositive = summary.totalProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Profit Breakdown"
          subtitle="Accurate profit and cost analytics for each sale and line item"
        />
        <button
          onClick={() => loadData(from, to)}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This week' },
            { id: 'month', label: 'This month' },
            { id: 'custom', label: 'Custom range' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePeriodChange(item.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                period === item.id
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">From:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input py-1.5 px-3 text-xs w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">To:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input py-1.5 px-3 text-xs w-auto"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customFrom || !customTo || loading}
              className="btn-primary py-1.5 px-4 text-xs"
            >
              Apply
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar size={14} className="text-brand-500" />
          <span>
            {from === to ? formatDate(from) : `${formatDate(from)} - ${formatDate(to)}`}
          </span>
        </div>
      </div>

      {/* Inline Error State */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={20} className="text-rose-500 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => loadData(from, to)}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-rose-700"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {loading && !data ? (
        /* Loading Skeleton for Summary Cards */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800/80 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-4 h-7 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/30">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {money(summary.totalRevenue)}
              </h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-600 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Total Cost */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Cost
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/30">
                <Receipt size={20} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {money(summary.totalCost)}
              </h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Total Profit */}
          <div
            className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 ${
              isProfitPositive
                ? 'border-emerald-200 dark:border-emerald-900/50'
                : 'border-rose-200 dark:border-rose-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Profit
              </p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isProfitPositive
                    ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40'
                    : 'bg-rose-50 text-rose-500 dark:bg-rose-950/40'
                }`}
              >
                {isProfitPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              </div>
            </div>
            <div className="mt-3">
              <h3
                className={`text-2xl font-extrabold tracking-tight ${
                  isProfitPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {money(summary.totalProfit)}
              </h3>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                isProfitPositive ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'
              } opacity-80 group-hover:opacity-100 transition-opacity`}
            />
          </div>

          {/* Number of Sales */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Number of Sales
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500 dark:bg-violet-950/30">
                <ShoppingCart size={20} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {summary.salesCount}
              </h3>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* Sales Profit Breakdown Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        {/* Controls: Search & Sort */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={20} className="text-brand-500" />
              Sales & Item Profit Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any sale row to expand and inspect individual line-item profitability
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search customer, product, invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 py-2 text-xs"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-none dark:text-slate-200 cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="profit-desc">Sort: Highest Profit</option>
                <option value="profit-asc">Sort: Lowest Profit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table / Skeleton / Empty State */}
        {loading && !data ? (
          /* Table Skeleton */
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60"
              />
            ))}
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-800">
            <Package size={36} className="mx-auto mb-2 text-slate-400" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              No sales in this period
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try selecting a different date range or adjusting your search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="min-w-full table-auto text-left text-sm divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th scope="col" className="w-12 px-3 py-3.5 text-center"></th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3.5">Invoice</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3.5">Date</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3.5">Customer</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-right">Revenue</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-right">Cost</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3.5 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-slate-900">
                {filteredSales.map((sale) => {
                  const isExpanded = !!expandedSaleIds[sale.saleId];
                  const isSaleProfitPos = sale.saleProfit >= 0;

                  return (
                    <Fragment key={sale.saleId}>
                      <tr
                        onClick={() => toggleExpand(sale.saleId)}
                        className={`group cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          isExpanded ? 'bg-slate-50/80 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        <td className="w-12 px-3 py-3.5 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown size={18} className="mx-auto text-brand-500 transition-transform" />
                          ) : (
                            <ChevronRight size={18} className="mx-auto transition-transform group-hover:translate-x-0.5" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-bold font-mono text-xs text-brand-600 dark:text-brand-400">
                          {sale.invoiceNo}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {formatDate(sale.date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {sale.customerName}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                          {money(sale.saleRevenue)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-slate-600 dark:text-slate-400">
                          {money(sale.saleCost)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isSaleProfitPos
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                            }`}
                          >
                            {money(sale.saleProfit)}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/50">
                          <td colSpan={7} className="p-0">
                            <div className="border-y border-slate-200/60 bg-slate-50/30 p-4 dark:border-slate-800/80 dark:bg-slate-950/40 sm:p-6">
                              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                  <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    <Layers size={14} className="text-brand-500" />
                                    Line Items Breakdown ({sale.items?.length || 0})
                                  </h4>
                                  {sale.orderDiscount > 0 && (
                                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                                      Order Discount: -{money(sale.orderDiscount)}
                                    </span>
                                  )}
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-100 font-semibold text-slate-400 dark:border-slate-800">
                                        <th className="whitespace-nowrap px-3 py-2">Product</th>
                                        <th className="whitespace-nowrap px-3 py-2">Category</th>
                                        <th className="whitespace-nowrap px-3 py-2 text-center">Qty</th>
                                        <th className="whitespace-nowrap px-3 py-2 text-right">Selling Price</th>
                                        <th className="whitespace-nowrap px-3 py-2 text-right">Cost Price</th>
                                        <th className="whitespace-nowrap px-3 py-2 text-right">Discount</th>
                                        <th className="whitespace-nowrap px-3 py-2 text-right">Line Profit</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                      {(sale.items || []).map((item, idx) => {
                                        const isLineProfitPos = item.lineProfit >= 0;
                                        return (
                                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                            <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                                              {item.productName}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-slate-500 dark:text-slate-400">
                                              {item.categoryName}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                                              {item.qty}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                                              {money(item.sellingPrice)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">
                                              {money(item.costPrice)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-slate-500 dark:text-slate-400">
                                              {item.lineDiscount > 0 ? `-${money(item.lineDiscount)}` : '$0.00'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                              <span
                                                className={`font-bold ${
                                                  isLineProfitPos
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-rose-600 dark:text-rose-400'
                                                }`}
                                              >
                                                {money(item.lineProfit)}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Sale summary footer line */}
                                <div className="mt-3 flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                                  {sale.orderDiscount > 0 && (
                                    <div className="text-slate-500 dark:text-slate-400">
                                      Order Discount: <span className="font-semibold text-amber-600">-{money(sale.orderDiscount)}</span>
                                    </div>
                                  )}
                                  <div className="text-slate-500 dark:text-slate-400">
                                    Total Revenue: <span className="font-bold text-slate-800 dark:text-slate-200">{money(sale.saleRevenue)}</span>
                                  </div>
                                  <div className="text-slate-500 dark:text-slate-400">
                                    Total Cost: <span className="font-bold text-slate-800 dark:text-slate-200">{money(sale.saleCost)}</span>
                                  </div>
                                  <div>
                                    Net Profit:{' '}
                                    <span
                                      className={`font-extrabold ${
                                        isSaleProfitPos
                                          ? 'text-emerald-600 dark:text-emerald-400'
                                          : 'text-rose-600 dark:text-rose-400'
                                      }`}
                                    >
                                      {money(sale.saleProfit)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Profitable Products Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card dark:border-slate-800/80 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Top Profitable Products
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products ranked by cumulative profit for the selected period
              </p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {topProducts.length} Products
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="rounded-xl border border-slate-200/60 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
            No product data available for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-3 py-2.5 w-12 text-center">Rank</th>
                  <th className="px-4 py-2.5">Product Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-center">Units Sold</th>
                  <th className="px-4 py-2.5 text-right">Revenue</th>
                  <th className="px-4 py-2.5 text-right">Cost</th>
                  <th className="px-4 py-2.5 text-right">Profit</th>
                  <th className="px-4 py-2.5 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {topProducts.map((p, idx) => {
                  const isPos = p.totalProfit >= 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/70 dark:text-orange-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {p.productName}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {p.categoryName}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {p.totalQty}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {money(p.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">
                        {money(p.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold ${
                            isPos
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {money(p.totalProfit)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-xs">
                        <span
                          className={`inline-block rounded px-2 py-0.5 ${
                            isPos
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          {p.margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
