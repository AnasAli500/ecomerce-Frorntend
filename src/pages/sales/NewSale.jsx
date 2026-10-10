import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { money } from '../../utils/format';

const initialItem = () => ({
  categoryId: '',
  product: '',
  quantity: 1,
  sellingPrice: 0,
  discount: 0,
});

export default function NewSale() {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([initialItem()]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inline Customer Modal state
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  const getDefaultCustomerId = (custList) => {
    const walkIn = custList.find((c) => c.isWalkIn) || custList.find((c) => c.name === 'Normal Customer');
    return walkIn ? walkIn._id : (custList[0]?._id || '');
  };

  const loadData = async () => {
    try {
      const [custRes, catRes, prodRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/categories', { params: { limit: 100, status: 'active' } }),
        api.get('/products', { params: { limit: 200, status: 'active' } }),
      ]);

      const custList = custRes.data.data || [];
      setCustomers(custList);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);

      setCustomer((current) => {
        if (current && custList.some((c) => c._id === current)) {
          return current;
        }
        return getDefaultCustomerId(custList);
      });
    } catch (err) {
      console.error('Failed to load initial data:', err);
      toast.error('Failed to load initial data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c._id === customer),
    [customers, customer]
  );

  const isWalkIn = Boolean(selectedCustomer?.isWalkIn || selectedCustomer?.name === 'Normal Customer');

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

  // Pre-fill paid with total when switching to walk-in customer or initializing
  useEffect(() => {
    if (isWalkIn) {
      setPaid(total);
    }
  }, [customer]);

  const debt = Math.max(total - Number(paid || 0), 0);

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

  const handleCategoryChange = (index, categoryId) => {
    setError('');
    setItems((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          categoryId,
          product: '',
          sellingPrice: 0,
          quantity: 1,
          discount: 0,
        };
      })
    );
  };

  const handleProductChange = (index, productId) => {
    setError('');
    const p = products.find((x) => x._id === productId);
    setItems((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          product: productId,
          sellingPrice: p?.sellingPrice ?? 0,
          quantity: 1,
          discount: 0,
        };
      })
    );
  };

  const changeItem = (index, key, value) => {
    setError('');
    setItems((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        return { ...row, [key]: value };
      })
    );
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setError('');
    setItems((rows) => rows.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setError('');
    setItems((rows) => [...rows, initialItem()]);
  };

  const validateSale = () => {
    if (!customer) {
      return 'Please select a customer.';
    }

    if (!items || items.length === 0) {
      return 'At least one product is required.';
    }

    const hasNoProduct = items.every((i) => !i.product);
    if (hasNoProduct) {
      return 'At least one product must be selected.';
    }

    for (let idx = 0; idx < items.length; idx++) {
      const row = items[idx];
      const rowNum = idx + 1;

      if (!row.categoryId) {
        return `Row ${rowNum}: Please select a category.`;
      }
      if (!row.product) {
        return `Row ${rowNum}: Please select a product.`;
      }

      const p = products.find((prod) => prod._id === row.product);
      if (!p) {
        return `Row ${rowNum}: Selected product not found.`;
      }

      const qty = Number(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        return `Row ${rowNum}: Quantity must be greater than 0.`;
      }

      if (p.currentStock <= 0) {
        return `Row ${rowNum}: "${p.name}" is out of stock.`;
      }

      if (qty > p.currentStock) {
        return `Row ${rowNum}: Quantity for "${p.name}" (${qty}) exceeds available stock (${p.currentStock}).`;
      }

      const price = Number(row.sellingPrice);
      if (isNaN(price) || price < 0) {
        return `Row ${rowNum}: Price cannot be negative.`;
      }

      const lineDisc = Number(row.discount || 0);
      if (isNaN(lineDisc) || lineDisc < 0) {
        return `Row ${rowNum}: Line discount cannot be negative.`;
      }
    }

    const orderDisc = Number(discount || 0);
    if (isNaN(orderDisc) || orderDisc < 0) {
      return 'Order discount cannot be negative.';
    }

    const paidAmount = Number(paid || 0);
    if (isNaN(paidAmount) || paidAmount < 0) {
      return 'Paid amount cannot be negative.';
    }

    if (paidAmount > total) {
      return `Paid amount ($${paidAmount.toFixed(2)}) cannot exceed the final total ($${total.toFixed(2)}).`;
    }

    if (isWalkIn && paidAmount < total) {
      return 'Normal Customer must pay in full. Walk-in customer cannot have debt.';
    }

    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const validationMsg = validateSale();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/sales', {
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

      toast.success('Sale completed successfully!');

      // Fetch latest active products to reflect decreased stock
      const prodRes = await api.get('/products', { params: { limit: 200, status: 'active' } });
      setProducts(prodRes.data.data || []);

      // Reset form (customer back to Normal Customer)
      const defaultId = getDefaultCustomerId(customers);
      setCustomer(defaultId);
      setItems([initialItem()]);
      setDiscount(0);
      setPaid(0);
      setNotes('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Sale failed. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Sale" />
      <form onSubmit={submit} className="space-y-4">
        {/* Customer + Notes */}
        <div className="card grid gap-3 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Customer</label>
              {isWalkIn && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  Walk-in: must pay in full, no debt
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <select
                className="input flex-1"
                value={customer}
                onChange={(e) => {
                  setError('');
                  const newId = e.target.value;
                  setCustomer(newId);
                  const custObj = customers.find((c) => c._id === newId);
                  if (custObj?.isWalkIn || custObj?.name === 'Normal Customer') {
                    setPaid(total);
                  }
                }}
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}{c.phone && c.phone !== '-' ? ` · ${c.phone}` : ''}{c.isWalkIn ? ' (Walk-in)' : ''}
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
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional order notes..."
            />
          </div>
        </div>

        {/* Products Table Card */}
        <div className="card space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Products</h3>
            <span className="text-xs text-slate-400">{items.length} item(s)</span>
          </div>

          {/* Table header: Category | Product | Qty | Price | Line Discount | Line Total */}
          <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <div className="md:col-span-3">Category</div>
            <div className="md:col-span-3">Product</div>
            <div className="md:col-span-1">Qty</div>
            <div className="md:col-span-2">Price ($)</div>
            <div className="md:col-span-1">Line Discount ($)</div>
            <div className="md:col-span-2 text-right">Line Total</div>
          </div>

          {items.map((item, index) => {
            const lineGross = Number(item.sellingPrice || 0) * Number(item.quantity || 0);
            const lineDisc = Number(item.discount || 0);
            const lineTotal = Math.max(lineGross - lineDisc, 0);

            // Filter products for this category
            const categoryProducts = products.filter(
              (p) => (p.category?._id || p.category) === item.categoryId
            );
            const selectedProduct = products.find((p) => p._id === item.product);

            return (
              <div
                key={index}
                className="grid gap-2 md:grid-cols-12 items-center bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                {/* 1. Category */}
                <div className="md:col-span-3">
                  <label className="label text-xs md:hidden">Category</label>
                  <select
                    className="input"
                    value={item.categoryId}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Product */}
                <div className="md:col-span-3">
                  <label className="label text-xs md:hidden">Product</label>
                  <select
                    className="input disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-400 disabled:cursor-not-allowed"
                    value={item.product}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                    disabled={!item.categoryId}
                    required
                  >
                    <option value="">
                      {item.categoryId ? 'Select product' : 'Select category first'}
                    </option>
                    {categoryProducts.map((p) => (
                      <option key={p._id} value={p._id} disabled={p.currentStock <= 0}>
                        {p.name} {p.currentStock <= 0 ? '(out of stock)' : `· stock ${p.currentStock}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Qty */}
                <div className="md:col-span-1">
                  <label className="label text-xs md:hidden">Qty</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => changeItem(index, 'quantity', e.target.value)}
                    required
                  />
                </div>

                {/* 4. Price ($) */}
                <div className="md:col-span-2">
                  <label className="label text-xs md:hidden">Price ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.sellingPrice}
                    onChange={(e) => changeItem(index, 'sellingPrice', e.target.value)}
                    required
                  />
                </div>

                {/* 5. Line Discount ($) */}
                <div className="md:col-span-1">
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

                {/* 6. Line Total */}
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{money(lineTotal)}</p>
                    {lineDisc > 0 && <p className="text-[10px] text-rose-500">Disc: -{money(lineDisc)}</p>}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-rose-500 hover:text-rose-700 font-bold p-1 text-base transition-colors"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* In stock info under row */}
                {selectedProduct && (
                  <div className="col-span-full md:col-span-12 pt-1 flex items-center gap-2 text-xs border-t border-slate-100 dark:border-slate-800/60 mt-1">
                    <span
                      className={`font-medium ${
                        selectedProduct.currentStock <= 0
                          ? 'text-rose-500 font-bold'
                          : selectedProduct.currentStock <= selectedProduct.minStock
                          ? 'text-amber-500 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      In stock: {selectedProduct.currentStock}{' '}
                      {selectedProduct.currentStock <= 0 ? '(out of stock)' : ''}
                    </span>
                    {Number(item.quantity) > selectedProduct.currentStock && (
                      <span className="text-rose-500 font-semibold">
                        (Warning: Quantity exceeds available stock!)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Button type="button" variant="secondary" onClick={addItem}>
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
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => {
                setError('');
                setDiscount(e.target.value);
              }}
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
              onChange={(e) => {
                setError('');
                setPaid(e.target.value);
              }}
              placeholder="0.00"
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

        {/* Inline Error Message */}
        {error && (
          <div>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Completing Sale...' : 'Complete sale'}
        </Button>
      </form>

      {/* Add Customer Modal */}
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpenCustomerModal(false)}
              disabled={savingCustomer}
            >
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
