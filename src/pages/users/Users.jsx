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
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate } from '../../utils/format';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff', status: 'active', phone: '' };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debounced = useDebounce(search);

  const load = async () => {
    try {
      const res = await api.get('/users', {
        params: { search: debounced, page, role: roleFilter || undefined, status: statusFilter || undefined },
      });
      setRows(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    }
  };

  useEffect(() => { load(); }, [debounced, page, roleFilter, statusFilter]);

  // ── Add ──────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEdit(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  // ── Edit ─────────────────────────────────────────────
  const handleOpenEdit = (user) => {
    setEdit(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',            // leave blank = don't change
      role: user.role || 'staff',
      status: user.status || 'active',
      phone: user.phone || '',
    });
    setOpen(true);
  };

  // ── Save (create or update) ───────────────────────────
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (edit && !payload.password) delete payload.password; // don't send empty password on edit
      if (edit) {
        await api.put(`/users/${edit._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', payload);
        toast.success('User created');
      }
      setOpen(false);
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const f = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <PageHeader title="Users" action={<Button onClick={handleOpenAdd}>Add User</Button>} />

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mt-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
        </div>
        <select
          className="input w-36"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
        <select
          className="input w-36"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 card">
        <Table
          rows={rows}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            {
              key: 'role', label: 'Role',
              render: (r) => (
                <Badge status={r.role === 'admin' ? 'active' : 'inactive'}>
                  {r.role}
                </Badge>
              ),
            },
            {
              key: 'status', label: 'Status',
              render: (r) => <Badge status={r.status}>{r.status}</Badge>,
            },
            { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
            {
              key: 'actions',
              label: '',
              render: (r) => (
                <div className="flex gap-3">
                  <button
                    className="text-brand-600 hover:text-brand-800 font-medium"
                    onClick={() => handleOpenEdit(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 font-medium"
                    onClick={() => setDeleteTarget(r)}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={open}
        title={edit ? 'Edit User' : 'Add User'}
        onClose={() => { setOpen(false); setEdit(null); }}
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Name" value={form.name} onChange={f('name')} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={f('email')} required />
          </div>
          <div>
            <label className="label">Phone (Optional)</label>
            <input className="input" placeholder="Phone" value={form.phone} onChange={f('phone')} />
          </div>
          <div>
            <label className="label">{edit ? 'New Password (leave blank to keep current)' : 'Password'}</label>
            <input
              className="input"
              type="password"
              placeholder={edit ? 'Leave blank to keep current' : 'Min 6 characters'}
              value={form.password}
              onChange={f('password')}
              {...(!edit && { required: true })}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={f('role')}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={f('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setOpen(false); setEdit(null); }} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
