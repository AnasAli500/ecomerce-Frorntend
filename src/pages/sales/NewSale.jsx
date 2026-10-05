import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { money } from '../../utils/format';
import Modal from '../../components/Modal';

export default function NewSale() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, sellingPrice: 0, discount: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');

  // Inline Customer Modal state
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    api.get('/customers', { params: { limit: 100 } }).then((res) => setCustomers(res.data.data));
    api.get('/products', { params: { limit: 100, status: 'active' } }).then((res) => setProducts(res.data.data));
  }, []);

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const trimmed = newCustomerName.trim();
    if (!trimmed) {
      toast.error('Customer name is required');
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await api.post('/customers', { name: trimmed, phone: '' });
      const createdOrExisting = res.data.data.customer;
      const isExisting = res.data.data.isExisting;

      toast.success(isExisting ? `Selected existing customer "${createdOrExisting.name}"` : 'Customer created successfully');
      
      setCustomers((prev) => {
        const exists = prev.some((c) => c._id === createdOrExisting._id);
        if (exists) return prev;
        return [createdOrExisting, ...prev];
      });
      setCustomer(createdOrExisting._id);
      setNewCustomerName('');
      setOpenCustomerModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSavingCustomer(false);
    }
  };

  const changeItem = (index, key, value) => {
    setItems((rows) => rows.map((row, i) => {
      if (i !== index) return row;
      const next = { ...row, [key]: value };
      if (key === 'product') {
        const p = products.find((x) => x._id === value);
        next.sellingPrice = p?.sellingPrice || 0;
        next.discount = 0;
      }
      return next;
    }));
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((rows) => rows.filter((_, i) => i !== index));
  };

  const grossSubtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.sellingPrice || 0) * Number(i.quantity || 0), 0),
    [items]
  );

  const totalItemDiscounts = useMemo(
    () => items.reduce((s, i) => s + Number(i.discount || 0), 0),
    [items]
  );

  const subtotal = Math.max(grossSubtotal - totalItemDiscounts, 0);
  const total = Math.max(subtotal - Number(discount || 0), 0);
  const debt = Math.max(total - Number(paid || 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/sales', {
        customer,
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          sellingPrice: Number(i.sellingPrice),
          discount: Number(i.discount || 0),
        })),
        discount: Number(discount || 0),
        paid: Number(paid || 0),
        notes,
      });
      toast.success('Sale completed');
      navigate(`/sales/${res.data.data.sale._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    }
  };

  return (
    <div>
      <PageHeader title="New Sale" />
      <form onSubmit={submit} className="space-y-4">
        <div className="card grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Customer</label>
            <div className="flex gap-2">
              <select className="input flex-1" value={customer} onChange={(e) => setCustomer(e.target.value)} required>
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}{c.phone ? ` · ${c.phone}` : ''}
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" onClick={() => setOpenCustomerModal(true)}>
                + Add Customer
              </Button>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional order notes..." />
          </div>
        </div>

        {/* Products Table Card */}
        <div className="card space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Products</h3>
            <span className="text-xs text-slate-400">{items.length} item(s)</span>
          </div>

          {/* Desktop Table Headers */}
          <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <div className="md:col-span-4">Product</div>
            <div className="md:col-span-2">Qty</div>
            <div className="md:col-span-2">Price ($)</div>
            <div className="md:col-span-2">Line Discount ($)</div>
            <div className="md:col-span-2 text-right">Line Total</div>
          </div>

          {items.map((item, index) => {
            const lineGross = Number(item.sellingPrice || 0) * Number(item.quantity || 0);
            const lineDisc = Number(item.discount || 0);
            const lineTotal = Math.max(lineGross - lineDisc, 0);

            return (
              <div key={index} className="grid gap-2 md:grid-cols-12 items-center bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="md:col-span-4">
                  <label className="label text-xs md:hidden">Product</label>
                  <select className="input" value={item.product} onChange={(e) => changeItem(index, 'product', e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} · stock {p.currentStock}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Qty</label>
                  <input className="input" type="number" min="1" value={item.quantity} onChange={(e) => changeItem(index, 'quantity', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Price ($)</label>
                  <input className="input" type="number" min="0" step="0.01" value={item.sellingPrice} onChange={(e) => changeItem(index, 'sellingPrice', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Line Discount ($)</label>
                  <input className="input" type="number" min="0" step="0.01" value={item.discount} onChange={(e) => changeItem(index, 'discount', e.target.value)} placeholder="0.00" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{money(lineTotal)}</p>
                    {lineDisc > 0 && <p className="text-[10px] text-rose-500">Disc: -{money(lineDisc)}</p>}
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-rose-500 hover:text-rose-700 font-bold p-1 text-base" title="Remove item">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <Button type="button" variant="secondary" onClick={() => setItems([...items, { product: '', quantity: 1, sellingPrice: 0, discount: 0 }])}>
            + Add product
          </Button>
        </div>

        {/* Calculation Totals Card */}
        <div className="card grid gap-4 md:grid-cols-4">
          <div>
            <label className="label">Subtotal Breakdown</label>
            <div className="space-y-0.5">
              {totalItemDiscounts > 0 && (
                <p className="text-xs text-slate-400 line-through">Gross: {money(grossSubtotal)}</p>
              )}
              {totalItemDiscounts > 0 && (
                <p className="text-xs text-rose-500 font-medium">Item Discounts: -{money(totalItemDiscounts)}</p>
              )}
              <p className="text-lg font-bold text-slate-900 dark:text-white">{money(subtotal)}</p>
            </div>
          </div>
          <div>
            <label className="label">Order Discount ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div>
            <label className="label">Paid ($)</label>
            <input className="input" type="number" min="0" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} required />
          </div>
          <div>
            <label className="label">Final Total / Debt</label>
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{money(total)}</p>
            {debt > 0 ? (
              <p className="text-xs font-semibold text-rose-500">Debt: {money(debt)}</p>
            ) : (
              <p className="text-xs font-semibold text-emerald-500">Paid in full ✓</p>
            )}
          </div>
        </div>

        <Button type="submit">Complete sale</Button>
      </form>

      <Modal open={openCustomerModal} title="Add New Customer" onClose={() => setOpenCustomerModal(false)}>
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <div>
            <label className="label">Customer Name</label>
            <input
              className="input"
              placeholder="e.g. Ahmed Ali"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpenCustomerModal(false)} disabled={savingCustomer}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingCustomer}>
              {savingCustomer ? 'Saving...' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
