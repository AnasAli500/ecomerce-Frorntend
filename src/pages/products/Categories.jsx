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

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const debounced = useDebounce(search);

  const load = async () => {
    const res = await api.get('/categories', { params: { search: debounced, page, limit } });
    setRows(res.data.data);
    setMeta(res.data.meta);
  };
  useEffect(() => { load(); }, [debounced, page, limit]);

  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) await api.put(`/categories/${edit._id}`, form);
      else await api.post('/categories', form);
      toast.success(edit ? 'Category updated' : 'Category created');
      setOpen(false);
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Categories" action={<Button onClick={() => { setEdit(null); setForm({ name: '', description: '', status: 'active' }); setOpen(true); }}>Add Category</Button>} />
      <div className="flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search category"
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
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status' },
            { key: 'a', label: '', render: (r) => (
              <div className="flex gap-2">
                <button className="text-brand-600" onClick={() => { setEdit(r); setForm({ name: r.name, description: r.description || '', status: r.status || 'active' }); setOpen(true); }}>Edit</button>
                <button className="text-rose-600" onClick={() => setDel(r)}>Delete</button>
              </div>
            ) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>
      <Modal open={open} title={edit ? 'Edit category' : 'Add category'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!del}
        title="Delete category"
        message="Only unused categories can be deleted."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/categories/${del._id}`);
            toast.success('Deleted');
            load();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Cannot delete');
          }
          setDel(null);
        }}
      />
    </div>
  );
}
