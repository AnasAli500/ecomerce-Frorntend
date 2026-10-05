import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { money, formatDate } from '../../utils/format';

export default function SupplierView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const load = () => api.get(`/suppliers/${id}`).then((res) => setData(res.data.data));
  useEffect(() => { load(); }, [id]);
  if (!data) return <Spinner />;
  const { supplier, purchases, payments } = data;

  return (
    <div>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.company}
        action={supplier.amountDue > 0 ? <Button onClick={() => setOpen(true)}>Pay supplier</Button> : null}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">Purchases {money(supplier.totalPurchases)}</div>
        <div className="card">Paid {money(supplier.amountPaid)}</div>
        <div className="card">Due {money(supplier.amountDue)}</div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Purchases</h3>
          {purchases.map((p) => (
            <p key={p._id} className="text-sm">{p.invoiceNumber} · {formatDate(p.date)} · {money(p.total)}</p>
          ))}
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Payments</h3>
          {payments.map((p) => (
            <p key={p._id} className="text-sm">{formatDate(p.date)} · {money(p.amount)}</p>
          ))}
        </div>
      </div>
      <Modal open={open} title="Supplier payment" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.post('/payments/suppliers', { supplier: id, amount: Number(amount) });
              toast.success('Payment recorded');
              setOpen(false);
              load();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed');
            }
          }}
        >
          <p>Amount due {money(supplier.amountDue)}</p>
          <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
