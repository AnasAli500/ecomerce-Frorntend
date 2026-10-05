import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import { money } from '../../utils/format';

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/sales/${id}`),
      api.get('/customers', { params: { limit: 200 } }),
      api.get('/products', { params: { limit: 200, status: 'active' } }),
    ]).then(([saleRes, custRes, prodRes]) => {
      const sale = saleRes.data.data.sale;
      setCustomer(sale.customer?._id || '');
      setItems(
        sale.items.map((i) => ({
          product: i.product?._id || i.product,
          quantity: i.quantity,
          sellingPrice: i.sellingPrice,
          discount: i.discount || 0,
        }))
      );
      setDiscount(sale.discount || 0);
      setPaid(sale.paid || 0);
      setNotes(sale.notes || '');
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load sale');
      navigate('/sales');
    });
  }, [id]);

  const changeItem = (index, key, value) => {
    setItems((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [key]: value };
        if (key === 'product') {
          const p = products.find((x) => x._id === value);
          next.sellingPrice = p?.sellingPrice || 0;
          next.discount = 0;
        }
        return next;
      })
    );
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
    setSubmitting(true);
    try {
      await api.put(`/sales/${id}`, {
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
      toast.success('Sale updated successfully');
      navigate(`/sales/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Edit Sale" />
      <form onSubmit={submit} className="space-y-4">
        {/* Customer + Notes */}
        <div className="card grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Customer</label>
            <select
              className="input"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}{c.phone ? ` · ${c.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Products */}
        <div className="card space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Products</h3>
            <span className="text-xs text-slate-400">{items.length} item(s)</span>
          </div>

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
                  <select
                    className="input"
                    value={item.product}
                    onChange={(e) => changeItem(index, 'product', e.target.value)}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} · stock {p.currentStock}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Qty</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => changeItem(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Price ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.sellingPrice}
                    onChange={(e) => changeItem(index, 'sellingPrice', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Line Discount ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount}
                    onChange={(e) => changeItem(index, 'discount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{money(lineTotal)}</p>
                    {lineDisc > 0 && <p className="text-[10px] text-rose-500">Disc: -{money(lineDisc)}</p>}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-rose-500 hover:text-rose-700 font-bold p-1 text-base"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setItems([
                ...items,
                { product: '', quantity: 1, sellingPrice: 0, discount: 0 },
              ])
            }
          >
            + Add product
          </Button>
        </div>

        {/* Calculations */}
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
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Paid ($)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              required
            />
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

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/sales/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
