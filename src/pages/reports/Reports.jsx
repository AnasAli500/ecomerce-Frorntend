import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { money } from '../../utils/format';
import { exportReportExcel, exportReportPdf } from '../../utils/export';

const periods = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom' },
];

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (nextPeriod = period) => {
    setLoading(true);
    const params = nextPeriod === 'custom' && from && to ? { from, to } : { period: nextPeriod };
    const res = await api.get('/reports', { params });
    setReport(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    if (period !== 'custom') load(period);
  }, [period]);

  return (
    <div>
      <PageHeader title="Reports" subtitle="All figures are calculated from MongoDB" />
      <div className="mb-4 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`rounded-lg px-3 py-2 text-sm ${period === p.id ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div>
            <label className="label">From</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={() => load('custom')}>Generate</Button>
        </div>
      )}
      {loading || !report ? <Spinner /> : (
        <>
          <div className="no-print mb-4 flex flex-wrap gap-2">
            <Button onClick={() => exportReportPdf(`${period} report`, report)}>Export PDF</Button>
            <Button variant="secondary" onClick={() => exportReportExcel(`${period} report`, report)}>Export Excel</Button>
            <Button variant="ghost" onClick={() => window.print()}>Print Report</Button>
          </div>
          <div className="print-area grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sales" value={money(report.sales)} />
            <StatCard label="Purchases" value={money(report.purchases)} />
            <StatCard label="Stock In" value={report.stockIn} />
            <StatCard label="Stock Out" value={report.stockOut} />
            <StatCard label="Expenses" value={money(report.expenses)} />
            <StatCard label="Customer Payments" value={money(report.customerPayments)} />
            <StatCard label="Customer Debt" value={money(report.customerDebt)} />
            <StatCard label="Gross Profit" value={money(report.grossProfit)} />
            <StatCard label="Net Profit" value={money(report.netProfit)} />
            <StatCard label="Transactions" value={report.transactions} />
          </div>
        </>
      )}
    </div>
  );
}
