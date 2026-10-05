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
import ConfirmDialog from '../../components/ConfirmDialog';
import { money, formatDate } from '../../utils/format';

const categories = ['Rent', 'Electricity', 'Transport', 'Salary', 'Internet', 'Other'];

export default function Expenses() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Other',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const debounced = useDebounce(search);

  const load = async () => {
    const res = await api.get('/expenses', { params: { search: debounced, page } });
    setRows(res.data.data);
    setMeta(res.data.meta);
  };
  useEffect(() => { load(); }, [debounced, page]);

  const handleOpenAdd = () => {
    setEdit(null);
    setForm({
      name: '',
      category: 'Other',
      amount: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setEdit(expense);
    setForm({
      name: expense.name || '',
      category: expense.category || 'Other',
      amount: expense.amount ?? '',
      description: expense.description || '',
      date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) {
        await api.put(`/expenses/${edit._id}`, form);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', form);
        toast.success('Expense saved');
      }
      setOpen(false);
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Expenses" action={<Button onClick={handleOpenAdd}>Add Expense</Button>} />
      <SearchInput value={search} onChange={setSearch} placeholder="Search expenses" />
      <div className="mt-4 card">
        <Table
          rows={rows}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'amount', label: 'Amount', render: (r) => money(r.amount) },
            { key: 'description', label: 'Description' },
            { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
            {
              key: 'a',
              label: '',
              render: (r) => (
                <div className="flex gap-2">
                  <button className="text-brand-600 hover:text-brand-700 font-medium" onClick={() => handleOpenEdit(r)}>
                    Edit
                  </button>
                  <button className="text-rose-600" onClick={() => setDel(r)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </div>
      <Modal open={open} title={edit ? 'Edit expense' : 'Add expense'} onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={save}>
          <div>
            <label className="label">Expense Name</label>
            <input className="input" placeholder="Expense name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!del}
        title="Delete expense"
        message="This expense will be removed from reports."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/expenses/${del._id}`);
            toast.success('Deleted');
            load();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete expense');
          }
          setDel(null);
        }}
      />
    </div>
  );
}
