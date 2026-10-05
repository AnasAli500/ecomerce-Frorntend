import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { money } from '../../utils/format';

export default function NewPurchase() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, purchasePrice: 0 }]);
  const [paid, setPaid] = useState(0);

  useEffect(() => {
    api.get('/suppliers', { params: { limit: 100 } }).then((res) => setSuppliers(res.data.data));
    api.get('/products', { params: { limit: 100 } }).then((res) => setProducts(res.data.data));
  }, []);

  const changeItem = (index, key, value) => {
    setItems((rows) => rows.map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, [key]: value };
      if (key === 'product') {
        const p = products.find((x) => x._id === value);
        next.purchasePrice = p?.purchasePrice || 0;
      }
      return next;
    }));
  };

  const total = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.purchasePrice || 0), 0),
    [items]
  );
  const remaining = Math.max(total - Number(paid || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/purchases', {
        supplier,
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          purchasePrice: Number(i.purchasePrice),
        })),
        paid: Number(paid || 0),
      });
      toast.success('Purchase recorded and stock increased');
      navigate(`/purchases/${res.data.data.purchase._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <PageHeader title="New Purchase" />
      <form onSubmit={submit} className="space-y-4">
        <div className="card">
          <label className="label">Supplier</label>
          <select className="input max-w-lg" value={supplier} onChange={(e) => setSupplier(e.target.value)} required>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div className="card">
          {items.map((item, index) => (
            <div key={index} className="mb-3 grid gap-2 md:grid-cols-3">
              <select className="input" value={item.product} onChange={(e) => changeItem(index, 'product', e.target.value)} required>
                <option value="">Product</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <input className="input" type="number" min="1" value={item.quantity} onChange={(e) => changeItem(index, 'quantity', e.target.value)} />
              <input className="input" type="number" min="0" step="0.01" value={item.purchasePrice} onChange={(e) => changeItem(index, 'purchasePrice', e.target.value)} />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setItems([...items, { product: '', quantity: 1, purchasePrice: 0 }])}>Add line</Button>
        </div>
        <div className="card grid gap-3 md:grid-cols-3">
          <p>Total: {money(total)}</p>
          <div>
            <label className="label">Paid</label>
            <input className="input" type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} required />
          </div>
          <p>Supplier remaining: {money(remaining)}</p>
        </div>
        <Button type="submit">Save purchase</Button>
      </form>
    </div>
  );
}
