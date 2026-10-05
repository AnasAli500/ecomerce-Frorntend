import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  const load = () => api.get(`/customers/${id}`).then((res) => setData(res.data.data));
  useEffect(() => { load(); }, [id]);

  if (!data) return <Spinner />;
  const { customer, sales, payments } = data;
  const debtStatus = customer.totalDebt <= 0 ? 'Paid' : customer.totalPaid > 0 ? 'Partial' : 'Unpaid';

  const pay = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments/customers', { customer: id, amount: Number(amount), method: 'cash' });
      toast.success('Payment recorded');
      setOpen(false);
      setAmount('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.phone}
        action={customer.totalDebt > 0 ? <Button onClick={() => setOpen(true)}>Record payment</Button> : null}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">Purchases {money(customer.totalPurchases)}</div>
        <div className="card">Paid {money(customer.totalPaid)}</div>
        <div className="card">Debt {money(customer.totalDebt)}</div>
        <div className="card">Balance {money(data.remainingBalance)} · <Badge status={debtStatus}>{debtStatus}</Badge></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Sales history</h3>
          {sales.map((s) => (
            <div key={s._id} className="flex justify-between border-b border-slate-100 py-2 text-sm dark:border-slate-800">
              <span>{s.invoiceNumber} · {formatDate(s.date)}</span>
              <span>{money(s.total)} · debt {money(s.debt)}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Payments</h3>
          {payments.map((p) => (
            <div key={p._id} className="flex justify-between border-b border-slate-100 py-2 text-sm dark:border-slate-800">
              <span>{formatDate(p.date)}</span>
              <span>{money(p.amount)} · remaining {money(p.remainingDebt)}</span>
            </div>
          ))}
        </div>
      </div>
      <Modal open={open} title="Debt payment" onClose={() => setOpen(false)}>
        <form onSubmit={pay} className="space-y-3">
          <p>Previous debt: {money(customer.totalDebt)}</p>
          <input className="input" type="number" min="0.01" step="0.01" max={customer.totalDebt} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <p>Remaining after payment: {money(Math.max(customer.totalDebt - Number(amount || 0), 0))}</p>
          <Button type="submit">Save payment</Button>
        </form>
      </Modal>
    </div>
  );
}
