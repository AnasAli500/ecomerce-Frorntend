import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, DollarSign, Calendar, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { money, formatDate } from '../../utils/format';

export default function CustomerView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/customers/${id}`).then((res) => setData(res.data.data));
  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <Spinner />;
  const { customer, sales, payments } = data;
  const debtStatus = customer.totalDebt <= 0 ? 'Paid' : customer.totalPaid > 0 ? 'Partial' : 'Unpaid';

  const pay = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }
    if (numAmount > customer.totalDebt) {
      toast.error(`Payment cannot exceed remaining debt of ${money(customer.totalDebt)}`);
      return;
    }

    setSaving(true);
    try {
      await api.post('/payments/customers', {
        customer: id,
        amount: numAmount,
        method,
        notes,
      });
      toast.success('Payment recorded successfully');
      setOpen(false);
      setAmount('');
      setNotes('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        subtitle={customer.phone ? `Phone: ${customer.phone}` : 'Customer Details & Debt History'}
        action={
          customer.totalDebt > 0 ? (
            <Button onClick={() => setOpen(true)} className="flex items-center gap-1.5">
              <CreditCard size={16} />
              <span>Record Debt Payment</span>
            </Button>
          ) : null
        }
      />

      {/* 4 Financial Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Amount Owed
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {money(customer.totalPurchases || customer.totalPaid + customer.totalDebt)}
          </h3>
          <p className="mt-1 text-xs text-slate-400">Total credit / purchases incurred</p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Amount Paid
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {money(customer.totalPaid)}
          </h3>
          <p className="mt-1 text-xs text-emerald-500/80">Cumulative payments recorded</p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Remaining Balance
          </p>
          <h3
            className={`mt-2 text-2xl font-extrabold ${
              customer.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {money(customer.totalDebt)}
          </h3>
          <p className="mt-1 text-xs text-slate-400">Current unpaid debt</p>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Account Status
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge status={debtStatus}>{debtStatus}</Badge>
              {customer.totalDebt === 0 && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Fully Paid
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Status: <span className="font-semibold capitalize">{customer.status}</span>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="card flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300">
        {customer.phone && (
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-brand-500" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-brand-500" />
            <span>{customer.email}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-brand-500" />
            <span>{customer.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-brand-500" />
          <span>Customer since {formatDate(customer.createdAt)}</span>
        </div>
      </div>

      {/* Customer Debt History: Sales Transactions & Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales / Invoices History */}
        <div className="card space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign size={18} className="text-brand-500" />
              <span>Sales & Credit Transactions</span>
            </h3>
            <span className="text-xs text-slate-400">{sales.length} sale(s)</span>
          </div>

          {sales.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No sales recorded yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((s) => (
                <div key={s._id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <Link
                      to={`/sales/${s._id}`}
                      className="font-mono font-bold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {s.invoiceNumber}
                    </Link>
                    <p className="text-[11px] text-slate-400">{formatDate(s.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{money(s.total)}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs text-emerald-600">Paid: {money(s.paid)}</span>
                      {s.debt > 0 && (
                        <span className="text-xs font-bold text-rose-500">Debt: {money(s.debt)}</span>
                      )}
                      <Badge status={s.paymentStatus}>{s.paymentStatus}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments History */}
        <div className="card space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-500" />
              <span>Debt Payments History</span>
            </h3>
            <span className="text-xs text-slate-400">{payments.length} payment(s)</span>
          </div>

          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No debt payments recorded yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <div key={p._id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{money(p.amount)}
                    </span>
                    <span className="ml-2 text-[11px] capitalize rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-slate-600 dark:text-slate-300">
                      {p.method}
                    </span>
                    <p className="text-[11px] text-slate-400">{formatDate(p.date)}</p>
                    {p.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{p.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Previous: {money(p.previousDebt)}</p>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Balance: {money(p.remainingDebt)}
                    </p>
                    <p className="text-[10px] text-slate-400">By: {p.createdBy?.name || 'Admin'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={open} title={`Record Payment: ${customer.name}`} onClose={() => !saving && setOpen(false)}>
        <form onSubmit={pay} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Current Outstanding Debt:</span>
              <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                {money(customer.totalDebt)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="label mb-0">Payment Amount ($)</label>
              <button
                type="button"
                onClick={() => setAmount(customer.totalDebt.toFixed(2))}
                className="text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400"
              >
                Pay in Full ({money(customer.totalDebt)})
              </button>
            </div>
            <input
              className="input"
              type="number"
              min="0.01"
              step="0.01"
              max={customer.totalDebt}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Remaining Balance after payment:
            </span>
            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
              {money(Math.max(customer.totalDebt - Number(amount || 0), 0))}
            </span>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Notes / Reference (Optional)</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received partial cash payment..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !amount || Number(amount) <= 0}>
              {saving ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
