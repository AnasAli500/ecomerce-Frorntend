import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, History, DollarSign, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import { money, formatDate } from '../../utils/format';

export default function CustomerDebts() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debtFilter, setDebtFilter] = useState('outstanding'); // 'outstanding' | 'paid' | 'all'
  const [loading, setLoading] = useState(false);

  // Payment Modal state
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // History Modal state
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const debouncedSearch = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        debtFilter,
        sort: debtFilter === 'paid' ? 'updatedAt' : 'totalDebt',
        order: 'desc',
      };
      const res = await api.get('/customers', { params });
      setRows(res.data.data || []);
      setMeta(res.data.meta);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error('Failed to load customer debts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, debouncedSearch, debtFilter]);

  const debtStatus = (r) => {
    if (r.totalDebt <= 0) return 'Paid';
    if (r.totalPaid > 0 && r.totalDebt > 0) return 'Partial';
    return 'Unpaid';
  };

  // Open Record Payment Modal
  const handleOpenPayment = (customer) => {
    setSelected(customer);
    setAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  // Quick Pay in Full
  const handlePayInFull = () => {
    if (selected) {
      setAmount(selected.totalDebt.toFixed(2));
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selected) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }
    if (numAmount > selected.totalDebt) {
      toast.error(`Payment cannot exceed remaining debt of ${money(selected.totalDebt)}`);
      return;
    }

    setSavingPayment(true);
    try {
      await api.post('/payments/customers', {
        customer: selected._id,
        amount: numAmount,
        method: paymentMethod,
        notes: paymentNotes,
      });
      toast.success('Debt payment recorded successfully');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSavingPayment(false);
    }
  };

  // Open Debt History Modal
  const handleOpenHistory = async (customer) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/customers/${customer._id}`);
      setHistoryData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load debt history');
      setHistoryCustomer(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer Debt Management"
        subtitle="Track customers who buy on credit, manage balances, and record payments"
      />

      {/* Filter Tabs & Search Controls */}
      <div className="card space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 3 Required Filter Tabs: All Customers, Customers with Outstanding Debts, Fully Paid Customers */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setDebtFilter('outstanding');
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                debtFilter === 'outstanding'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Outstanding Debts
            </button>
            <button
              onClick={() => {
                setDebtFilter('paid');
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                debtFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Fully Paid Customers
            </button>
            <button
              onClick={() => {
                setDebtFilter('all');
                setPage(1);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                debtFilter === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              All Customers
            </button>
          </div>

          {/* Search & Limit Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by name or phone..."
            />
            <select
              className="input max-w-[140px]"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Customer Debts Table */}
        <Table
          loading={loading}
          rows={rows}
          columns={[
            {
              key: 'name',
              label: 'Customer Name',
              render: (r) => (
                <div className="flex flex-col">
                  <Link
                    to={`/customers/${r._id}`}
                    className="font-bold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {r.name}
                  </Link>
                  {r.email && <span className="text-xs text-slate-400">{r.email}</span>}
                </div>
              ),
            },
            {
              key: 'phone',
              label: 'Phone Number',
              render: (r) => (
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {r.phone || '—'}
                </span>
              ),
            },
            {
              key: 'totalPurchases',
              label: 'Total Amount Owed',
              render: (r) => (
                <span className="font-semibold text-slate-900 dark:text-white">
                  {money(r.totalPurchases || r.totalPaid + r.totalDebt)}
                </span>
              ),
            },
            {
              key: 'totalPaid',
              label: 'Amount Paid',
              render: (r) => (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {money(r.totalPaid || 0)}
                </span>
              ),
            },
            {
              key: 'totalDebt',
              label: 'Remaining Balance',
              render: (r) => (
                <span
                  className={`font-bold ${
                    r.totalDebt > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {money(r.totalDebt || 0)}
                </span>
              ),
            },
            {
              key: 'status',
              label: 'Debt Status',
              render: (r) => <Badge status={debtStatus(r)}>{debtStatus(r)}</Badge>,
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenHistory(r)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    title="View debt history"
                  >
                    <History size={14} />
                    <span>History</span>
                  </button>
                  {r.totalDebt > 0 ? (
                    <button
                      onClick={() => handleOpenPayment(r)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900"
                    >
                      <CreditCard size={14} />
                      <span>Record Payment</span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 px-2.5 py-1">
                      <CheckCircle2 size={13} />
                      <span>Settled</span>
                    </span>
                  )}
                </div>
              ),
            },
          ]}
        />

        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={Boolean(selected)}
        title="Record Debt Payment"
        onClose={() => !savingPayment && setSelected(null)}
      >
        {selected && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* Customer Summary Card */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Customer:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {selected.name}
                </span>
              </div>
              {selected.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Phone:</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                    {selected.phone}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Outstanding Debt:
                </span>
                <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  {money(selected.totalDebt)}
                </span>
              </div>
            </div>

            {/* Amount input & Quick Full Payment */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Payment Amount ($)</label>
                <button
                  type="button"
                  onClick={handlePayInFull}
                  className="text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400"
                >
                  Pay Full Debt ({money(selected.totalDebt)})
                </button>
              </div>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                max={selected.totalDebt}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            {/* Live Remaining Balance Calculation */}
            <div className="flex justify-between items-center rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Remaining Balance after payment:
              </span>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                {money(Math.max(selected.totalDebt - Number(amount || 0), 0))}
              </span>
            </div>

            {/* Payment Method */}
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes / Reference (Optional)</label>
              <input
                className="input"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. Received by Ahmed, receipt #102..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelected(null)}
                disabled={savingPayment}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingPayment || !amount || Number(amount) <= 0}>
                {savingPayment ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Customer Debt History Modal */}
      <Modal
        open={Boolean(historyCustomer)}
        title={historyCustomer ? `Debt History: ${historyCustomer.name}` : 'Debt History'}
        onClose={() => setHistoryCustomer(null)}
        wide
      >
        {loadingHistory ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner />
          </div>
        ) : historyData ? (
          <div className="space-y-5">
            {/* Summary statistics */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Purchases</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {money(historyData.customer.totalPurchases)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Paid</p>
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {money(historyData.customer.totalPaid)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Outstanding Debt</p>
                <p className="text-base font-extrabold text-rose-700 dark:text-rose-400">
                  {money(historyData.remainingBalance)}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 flex flex-col justify-center">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Status</p>
                <div>
                  <Badge status={debtStatus(historyData.customer)}>
                    {debtStatus(historyData.customer)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Credit Transactions / Sales Table */}
            <div>
              <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <DollarSign size={16} className="text-brand-500" />
                <span>Sales & Credit Transactions</span>
              </h4>
              {historyData.sales?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No sales recorded for this customer.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Invoice</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Total</th>
                        <th className="p-2.5">Paid</th>
                        <th className="p-2.5">Debt</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyData.sales?.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono font-medium text-brand-600 dark:text-brand-400">
                            <Link to={`/sales/${s._id}`} target="_blank">
                              {s.invoiceNumber}
                            </Link>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">
                            {formatDate(s.date)}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {money(s.total)}
                          </td>
                          <td className="p-2.5 text-emerald-600 font-medium">{money(s.paid)}</td>
                          <td className="p-2.5 font-bold text-rose-600">{money(s.debt)}</td>
                          <td className="p-2.5">
                            <Badge status={s.paymentStatus}>{s.paymentStatus}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment Records Table */}
            <div>
              <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard size={16} className="text-emerald-500" />
                <span>Debt Payment Records</span>
              </h4>
              {historyData.payments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Amount Paid</th>
                        <th className="p-2.5">Previous Debt</th>
                        <th className="p-2.5">Remaining Debt</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyData.payments?.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">
                            {formatDate(p.date)}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            {money(p.amount)}
                          </td>
                          <td className="p-2.5 text-slate-500">{money(p.previousDebt)}</td>
                          <td className="p-2.5 font-bold text-rose-600">{money(p.remainingDebt)}</td>
                          <td className="p-2.5 capitalize">{p.method}</td>
                          <td className="p-2.5 text-slate-500">{p.createdBy?.name || 'Admin'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setHistoryCustomer(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
