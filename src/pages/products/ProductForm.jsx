import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', sku: '', category: '', sellingPrice: '', purchasePrice: '', currentStock: 0, minStock: 5, status: 'active', description: '',
  });
  const [image, setImage] = useState(null);

  useEffect(() => {
    api.get('/categories', { params: { limit: 100 } }).then((res) => setCategories(res.data.data));
    if (id) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data.data.product;
        setForm({
          name: p.name,
          sku: p.sku,
          category: p.category?._id || p.category,
          sellingPrice: p.sellingPrice,
          purchasePrice: p.purchasePrice,
          currentStock: p.currentStock,
          minStock: p.minStock,
          status: p.status,
          description: p.description || '',
        });
      });
    }
  }, [id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (id && k === 'currentStock') return;
      fd.append(k, v);
    });
    if (image) fd.append('image', image);
    if (id) await api.put(`/products/${id}`, fd);
    else await api.post('/products', fd);
    toast.success(id ? 'Product updated' : 'Product created');
    navigate('/products');
  };

  return (
    <div>
      <PageHeader title={id ? 'Edit Product' : 'Add Product'} />
      <form onSubmit={submit} className="card grid max-w-3xl gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Product name</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={form.sku} onChange={set('sku')} required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={set('category')} required>
            <option value="">Select</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Purchase price</label>
          <input className="input" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={set('purchasePrice')} required />
        </div>
        <div>
          <label className="label">Selling price</label>
          <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={set('sellingPrice')} required />
        </div>
        {!id && (
          <div>
            <label className="label">Initial stock</label>
            <input className="input" type="number" min="0" value={form.currentStock} onChange={set('currentStock')} />
          </div>
        )}
        <div>
          <label className="label">Minimum stock</label>
          <input className="input" type="number" min="0" value={form.minStock} onChange={set('minStock')} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
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
          <textarea className="input" rows="3" value={form.description} onChange={set('description')} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Save product</Button>
        </div>
      </form>
    </div>
  );
}
