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
import { money } from '../../utils/format';

export default function Suppliers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', company: '' });
  const debounced = useDebounce(search);

  const load = async () => {
    const res = await api.get('/suppliers', { params: { search: debounced, page, limit } });
    setRows(res.data.data);
    setMeta(res.data.meta);
  };
  useEffect(() => { load(); }, [debounced, page, limit]);

  const handleOpenAdd = () => {
    setEdit(null);
    setForm({ name: '', phone: '', email: '', address: '', company: '' });
    setOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setEdit(supplier);
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      company: supplier.company || '',
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) {
        await api.put(`/suppliers/${edit._id}`, form);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier created');
      }
      setOpen(false);
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Suppliers" action={<Button onClick={handleOpenAdd}>Add Supplier</Button>} />
      <div className="flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search suppliers"
        />
        <select
          className="input max-w-[150px]"
          value={limit}
          onChange={(e) => {
            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
            setLimit(val);
            setPage(1);
          }}
        >
          <option value={10}>10 per page</option>
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
      <div className="mt-4 card">
        <Table
          rows={rows}
          columns={[
            { key: 'name', label: 'Supplier' },
            { key: 'company', label: 'Company' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'address', label: 'Address' },
            { key: 'totalPurchases', label: 'Purchases', render: (r) => money(r.totalPurchases) },
            { key: 'amountPaid', label: 'Paid', render: (r) => money(r.amountPaid) },
            { key: 'amountDue', label: 'Due', render: (r) => money(r.amountDue) },
            {
              key: 'a',
              label: '',
              render: (r) => (
                <div className="flex gap-2">
                  <Link className="text-brand-600" to={`/suppliers/${r._id}`}>Details</Link>
                  <button className="text-slate-500 hover:text-slate-700 font-medium" onClick={() => handleOpenEdit(r)}>
                    Edit
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>
      <Modal open={open} title={edit ? 'Edit supplier' : 'Add supplier'} onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={save}>
          <div>
            <label className="label">Supplier Name</label>
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
