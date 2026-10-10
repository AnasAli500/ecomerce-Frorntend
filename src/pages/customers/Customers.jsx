import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { money, formatDate } from '../../utils/format';

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', status: 'active' });
  const debounced = useDebounce(search);

  const load = async () => {
    const res = await api.get('/customers', { params: { search: debounced, page } });
    setRows(res.data.data);
    setMeta(res.data.meta);
  };
  useEffect(() => { load(); }, [debounced, page]);

  const handleOpenAdd = () => {
    setEdit(null);
    setForm({ name: '', phone: '', email: '', address: '', status: 'active' });
    setOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEdit(customer);
    setForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      status: customer.status || 'active',
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) {
        await api.put(`/customers/${edit._id}`, form);
        toast.success('Customer updated');
      } else {
        const res = await api.post('/customers', form);
        if (res.data.data.isExisting) {
          toast.success(`Existing customer found: ${res.data.data.customer.name}`);
        } else {
          toast.success('Customer created');
        }
      }
      setOpen(false);
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Customers" action={<Button onClick={handleOpenAdd}>Add Customer</Button>} />
      <SearchInput value={search} onChange={setSearch} placeholder="Search customers" />
      <div className="mt-4 card">
        <Table
          rows={rows}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 dark:text-white">{r.name}</span>
                  {r.isWalkIn && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      Walk-in
                    </span>
                  )}
                </div>
              ),
            },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'address', label: 'Address' },
            { key: 'totalPurchases', label: 'Purchases', render: (r) => money(r.totalPurchases) },
            { key: 'totalPaid', label: 'Paid', render: (r) => money(r.totalPaid) },
            { key: 'totalDebt', label: 'Debt', render: (r) => money(r.totalDebt) },
            { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
            { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
            {
              key: 'a',
              label: '',
              render: (r) => (
                <div className="flex gap-2">
                  <Link className="text-brand-600" to={`/customers/${r._id}`}>Details</Link>
                  <button className="text-slate-500 hover:text-slate-700 font-medium" onClick={() => handleOpenEdit(r)}>
                    Edit
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </div>
      <Modal open={open} title={edit ? 'Edit customer' : 'Add customer'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Customer Name</label>
            <input
              className="input disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={Boolean(edit?.isWalkIn)}
              required
            />
            {edit?.isWalkIn && (
              <p className="text-xs text-slate-400 mt-1">The default walk-in customer cannot be renamed.</p>
            )}
          </div>
          <div>
            <label className="label">Phone (Optional)</label>
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email (Optional)</label>
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Address (Optional)</label>
            <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          {edit && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
