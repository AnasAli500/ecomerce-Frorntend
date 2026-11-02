import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Package, PlusCircle, ArrowRight, Calendar, DollarSign, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Modal from './Modal';
import Button from './Button';
import { money, getStockStatus } from '../utils/format';

export default function AddStockModal({ open, onClose, product, products = [], onSuccess }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Determine active product
  const activeProduct = useMemo(() => {
    if (product) return product;
    return products.find((p) => p._id === selectedProductId) || null;
  }, [product, products, selectedProductId]);

  useEffect(() => {
    if (open) {
      setError('');
      setSaving(false);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setQuantity(1);

      if (product) {
        setSelectedProductId(product._id);
        setPurchaseCost(product.purchasePrice !== undefined ? String(product.purchasePrice) : '');
      } else {
        setSelectedProductId(products[0]?._id || '');
        setPurchaseCost(products[0]?.purchasePrice !== undefined ? String(products[0].purchasePrice) : '');
      }

      // Load suppliers list
      api.get('/suppliers', { params: { limit: 100 } })
        .then((res) => setSuppliers(res.data.data || []))
        .catch(() => {});
    }
  }, [open, product, products]);

  // When selected product changes in dropdown
  const handleProductSelect = (id) => {
    setSelectedProductId(id);
    const p = products.find((item) => item._id === id);
    if (p) {
      setPurchaseCost(p.purchasePrice !== undefined ? String(p.purchasePrice) : '');
    }
  };

  const currentStock = Number(activeProduct?.currentStock || 0);
  const currentStatus = getStockStatus(currentStock);

  const numQty = Number(quantity);
  const isValidQty = !isNaN(numQty) && Number.isInteger(numQty) && numQty > 0;
  const newTotalStock = currentStock + (isValidQty ? numQty : 0);
  const newStatus = getStockStatus(newTotalStock);

  const statusBadge = (status, qty) => {
    if (status === 'Out of Stock') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
          Out of Stock ({qty})
        </span>
      );
    }
    if (status === 'Low Stock') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
          Low Stock ({qty})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
        <CheckCircle2 size={13} className="text-emerald-600" />
        In Stock ({qty})
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeProduct) {
      setError('Please select a product.');
      return;
    }

    if (!isValidQty) {
      setError('Quantity to add must be a positive whole number (at least 1).');
      return;
    }

    const numCost = Number(purchaseCost || 0);
    if (isNaN(numCost) || numCost < 0) {
      setError('Purchase cost cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/stock/add', {
        product: activeProduct._id,
        quantity: numQty,
        supplier: supplier || undefined,
        purchaseCost: purchaseCost !== '' ? numCost : undefined,
        date: date || undefined,
        notes: notes || undefined,
      });

      const updated = res.data.data.product;
      const movement = res.data.data.movement;

      toast.success(
        `Stock added successfully! ${activeProduct.name} is now ${newStatus} (${newTotalStock} units).`
      );

      if (onSuccess) {
        onSuccess(updated, movement);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Add Stock to Product" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selection / Display */}
        {product ? (
          <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Product Name
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={18} className="text-brand-500" />
                  <span>{activeProduct?.name}</span>
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-0.5">SKU: {activeProduct?.sku}</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Current Stock
                </span>
                <div>{statusBadge(currentStatus, currentStock)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="label">Select Product</label>
            <select
              className="input"
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              required
            >
              <option value="">Select a product to restock</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (Stock: {p.currentStock} — {getStockStatus(p.currentStock)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Status Transition Preview Card */}
        {activeProduct && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Automatic Stock Status Preview</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Current:</span>
                {statusBadge(currentStatus, currentStock)}
              </div>
              <ArrowRight size={16} className="text-slate-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Adding:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  +{isValidQty ? numQty : 0} units
                </span>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">New Total:</span>
                {statusBadge(newStatus, newTotalStock)}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Rules: Stock = 0 (Out of Stock) · Stock = 1–2 (Low Stock) · Stock ≥ 3 (In Stock)
            </p>
          </div>
        )}

        {/* Form Fields: Quantity to Add & Purchase Cost */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Quantity to Add</label>
            <input
              className={`input ${!isValidQty && quantity ? 'border-rose-500 text-rose-600' : ''}`}
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => {
                setError('');
                setQuantity(e.target.value);
              }}
              placeholder="e.g. 10"
              required
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-400">Must be at least 1 unit.</p>
          </div>

          <div>
            <label className="label">Purchase Cost ($)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={purchaseCost}
              onChange={(e) => {
                setError('');
                setPurchaseCost(e.target.value);
              }}
              placeholder="0.00"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Unit cost for this addition (updates product purchase price).
            </p>
          </div>
        </div>

        {/* Form Fields: Supplier (optional) & Date */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Supplier (Optional)</label>
            <select
              className="input"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              <option value="">None / Not specified</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.company ? `(${s.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="label">Notes / Reference (Optional)</label>
          <input
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Restocked batch, invoice #901..."
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !isValidQty || !activeProduct}>
            {saving ? 'Adding Stock...' : `Add ${isValidQty ? quantity : ''} Units to Stock`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
