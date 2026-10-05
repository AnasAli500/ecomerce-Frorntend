import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Modal from './Modal';
import Button from './Button';

export default function ProductModal({ open, onClose, product, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    sellingPrice: '',
    purchasePrice: '',
    currentStock: 0,
    minStock: 5,
    status: 'active',
    description: '',
  });
  const [image, setImage] = useState(null);

  const isEdit = Boolean(product && product._id);

  useEffect(() => {
    if (open) {
      api.get('/categories', { params: { limit: 100 } })
        .then((res) => setCategories(res.data.data))
        .catch(() => {});

      if (product) {
        setForm({
          name: product.name || '',
          sku: product.sku || '',
          category: product.category?._id || product.category || '',
          sellingPrice: product.sellingPrice ?? '',
          purchasePrice: product.purchasePrice ?? '',
          currentStock: product.currentStock ?? 0,
          minStock: product.minStock ?? 5,
          status: product.status || 'active',
          description: product.description || '',
        });
      } else {
        setForm({
          name: '',
          sku: '',
          category: '',
          sellingPrice: '',
          purchasePrice: '',
          currentStock: 0,
          minStock: 5,
          status: 'active',
          description: '',
        });
      }
      setImage(null);
    }
  }, [open, product]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (isEdit && k === 'currentStock') return;
        fd.append(k, v);
      });
      if (image) {
        fd.append('image', image);
      }

      if (isEdit) {
        await api.put(`/products/${product._id}`, fd);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', fd);
        toast.success('Product created successfully');
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Product' : 'Add Product'} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Product Name</label>
          <input className="input" value={form.name} onChange={setField('name')} required />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={form.sku} onChange={setField('sku')} required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={setField('category')} required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Purchase Price</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.purchasePrice}
            onChange={setField('purchasePrice')}
            required
          />
        </div>
        <div>
          <label className="label">Selling Price</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={setField('sellingPrice')}
            required
          />
        </div>
        {!isEdit && (
          <div>
            <label className="label">Initial Stock</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.currentStock}
              onChange={setField('currentStock')}
            />
          </div>
        )}
        <div>
          <label className="label">Minimum Stock</label>
          <input
            className="input"
            type="number"
            min="0"
            value={form.minStock}
            onChange={setField('minStock')}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={setField('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Image</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea className="input" rows="3" value={form.description} onChange={setField('description')} />
        </div>
        <div className="flex justify-end gap-2 pt-2 md:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
