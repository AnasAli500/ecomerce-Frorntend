import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function Stock() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [period, setPeriod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: 1, type: 'in', reason: 'adjustment_in', notes: '' });
  const debounced = useDebounce(search);

  const load = async () => {
    const params = { search: debounced, type, page, limit };
    if (period) params.period = period;
    if (from && to) {
      params.from = from;
      params.to = to;
      delete params.period;
    }
    const res = await api.get('/stock', { params });
    setRows(res.data.data);
    setMeta(res.data.meta);
  };

  useEffect(() => {
    load();
    api.get('/products', { params: { limit: 100 } }).then((res) => setProducts(res.data.data));
  }, [debounced, type, period, from, to, page, limit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock/adjust', form);
      toast.success('Stock movement recorded');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <PageHeader title="Stock Management" subtitle="Every stock change creates a history record" action={<Button onClick={() => setOpen(true)}>Adjust stock</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Reference" />
        <select className="input max-w-[140px]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
        <select className="input max-w-[160px]" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="">Any time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <input className="input max-w-[150px]" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input className="input max-w-[150px]" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        <select
          className="input max-w-[150px]"
          value={limit}
          onChange={(e) => {
            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
            setLimit(val);
            setPage(1);
          }}
        >
          <option value={15}>15 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
          <option value={200}>200 per page</option>
          <option value={300}>300 per page</option>
          <option value={400}>400 per page</option>
          <option value={500}>500 per page</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="card">
        <Table
          rows={rows}
          columns={[
            { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleString() },
            { key: 'product', label: 'Product', render: (r) => r.product?.name },
            { key: 'type', label: 'Type', render: (r) => <Badge status={r.type === 'in' ? 'Paid' : 'Unpaid'}>{r.type === 'in' ? 'Stock In' : 'Stock Out'}</Badge> },
            { key: 'quantity', label: 'Quantity', render: (r) => `${r.type === 'in' ? '+' : '-'}${r.quantity}` },
            { key: 'previousStock', label: 'Previous' },
            { key: 'newStock', label: 'Balance' },
            { key: 'referenceNumber', label: 'Reference' },
            { key: 'reason', label: 'Reason' },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>
      <Modal open={open} title="Stock adjustment" onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <select className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
            <option value="">Select product</option>
            {products.map((p) => <option key={p._id} value={p._id}>{p.name} (stock {p.currentStock})</option>)}
          </select>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, reason: e.target.value === 'in' ? 'adjustment_in' : 'adjustment_out' })}>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
          <select className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
            {form.type === 'in' ? (
              <option value="adjustment_in">Manual increase</option>
            ) : (
              <>
                <option value="adjustment_out">Manual decrease</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </>
            )}
          </select>
          <input className="input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <textarea className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit">Save movement</Button>
        </form>
      </Modal>
    </div>
  );
}
