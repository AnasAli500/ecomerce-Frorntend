import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { money } from '../../utils/format';

export default function CustomerDebts() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');

  const load = () => {
    api.get('/customers', { params: { debt: true, page, limit, sort: 'totalDebt', order: 'desc' } }).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  };
  useEffect(() => { load(); }, [page, limit]);

  const debtStatus = (r) => (r.totalDebt <= 0 ? 'Paid' : r.totalPaid > 0 ? 'Partial' : 'Unpaid');

  return (
    <div>
      <PageHeader title="Customer Debts" />
      <div className="card">
        <Table
          rows={rows}
          columns={[
            { key: 'name', label: 'Customer' },
            { key: 'phone', label: 'Phone' },
            { key: 'totalDebt', label: 'Total Debt', render: (r) => money(r.totalDebt) },
            { key: 'totalPaid', label: 'Paid', render: (r) => money(r.totalPaid) },
            { key: 'remaining', label: 'Remaining', render: (r) => money(r.totalDebt) },
            { key: 'status', label: 'Status', render: (r) => <Badge status={debtStatus(r)}>{debtStatus(r)}</Badge> },
            { key: 'a', label: '', render: (r) => (
              <div className="flex gap-2">
                <Link className="text-brand-600" to={`/customers/${r._id}`}>View</Link>
                <button className="text-slate-600" onClick={() => { setSelected(r); setAmount(''); }}>Pay</button>
              </div>
            ) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>
      <Modal open={!!selected} title="Record payment" onClose={() => setSelected(null)}>
        {selected && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/payments/customers', { customer: selected._id, amount: Number(amount) });
                toast.success('Payment saved');
                setSelected(null);
                load();
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed');
              }
            }}
          >
            <p>{selected.name} · previous debt {money(selected.totalDebt)}</p>
            <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Button type="submit">Save</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
