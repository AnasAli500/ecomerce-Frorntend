import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PlusCircle, Edit, Package, CheckCircle2, History } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import AddStockModal from '../../components/AddStockModal';
import { money, formatDate, fileUrl, getStockStatus } from '../../utils/format';

export default function ProductView() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [openAddStock, setOpenAddStock] = useState(false);

  const loadData = () => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data.data.product));
    api.get('/stock', { params: { product: id, limit: 50 } }).then((res) => setHistory(res.data.data));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!product) return <Spinner />;

  const stockQty = Number(product.currentStock || 0);
  const stockStatus = getStockStatus(stockQty);

  const handleStockAdded = (updatedProduct) => {
    setProduct(updatedProduct);
    loadData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku} · Category: ${product.category?.name || 'Uncategorized'}`}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setOpenAddStock(true)} className="flex items-center gap-1.5">
              <PlusCircle size={15} />
              <span>Add Stock</span>
            </Button>
            <Link to={`/products/${id}/edit`}>
              <Button variant="secondary" className="flex items-center gap-1.5">
                <Edit size={15} />
                <span>Edit Product</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Details Card */}
        <div className="card lg:col-span-1 space-y-4">
          {product.image ? (
            <img
              src={fileUrl(product.image)}
              alt={product.name}
              className="h-44 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="h-28 w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Package size={32} />
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">SKU</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{product.sku}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Category</span>
              <span className="font-semibold text-slate-900 dark:text-white">{product.category?.name || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Purchase Price</span>
              <span className="font-semibold text-slate-900 dark:text-white">{money(product.purchasePrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Selling Price</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">{money(product.sellingPrice)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Current Stock</span>
              <span className="font-extrabold text-base text-slate-900 dark:text-white">{stockQty} units</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Stock Status</span>
              <div>
                {stockQty <= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                    Out of Stock ({stockQty})
                  </span>
                ) : stockQty <= 2 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border border-amber-300 dark:border-amber-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                    Low Stock ({stockQty})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    In Stock ({stockQty})
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">System Status</span>
              <Badge status={product.status}>{product.status}</Badge>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={() => setOpenAddStock(true)} className="w-full flex items-center justify-center gap-1.5">
              <PlusCircle size={15} />
              <span>Add Stock to This Product</span>
            </Button>
          </div>
        </div>

        {/* Stock Movement History Table */}
        <div className="card lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-brand-500" />
              <span>Stock Movement History</span>
            </h3>
            <span className="text-xs text-slate-400">{history.length} movement(s)</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No stock movements recorded yet.</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Previous</th>
                    <th className="p-2.5">Added / Removed</th>
                    <th className="p-2.5">New Balance</th>
                    <th className="p-2.5">Purchase Cost</th>
                    <th className="p-2.5">Supplier</th>
                    <th className="p-2.5">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        {formatDate(m.date)}
                      </td>
                      <td className="p-2.5">
                        <Badge status={m.type === 'in' ? 'Paid' : 'Unpaid'}>
                          {m.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Badge>
                      </td>
                      <td className="p-2.5 font-medium text-slate-500">{m.previousStock}</td>
                      <td className="p-2.5 font-bold">
                        <span className={m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}>
                          {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td className="p-2.5 font-extrabold text-slate-900 dark:text-white">
                        {m.newStock}
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">
                        {m.purchaseCost !== undefined && m.purchaseCost !== null ? money(m.purchaseCost) : '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {m.supplier?.name || m.supplier?.company || '—'}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-400">
                        {m.referenceNumber || m.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddStockModal
        open={openAddStock}
        product={product}
        onClose={() => setOpenAddStock(false)}
        onSuccess={handleStockAdded}
      />
    </div>
  );
}
