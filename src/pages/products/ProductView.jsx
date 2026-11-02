import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import { money, fileUrl } from '../../utils/format';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';

export default function ProductView() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get(`/products/${id}`).then((res) => setProduct(res.data.data.product));
    api.get('/stock', { params: { product: id, limit: 20 } }).then((res) => setHistory(res.data.data));
  }, [id]);

  if (!product) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={product.name}
        action={(
          <Link to={`/products/${id}/edit`}><Button>Edit</Button></Link>
        )}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          {product.image ? (
            <img src={fileUrl(product.image)} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />
          ) : null}
          <p className="text-sm text-slate-500">SKU {product.sku}</p>
          <p>Category: {product.category?.name}</p>
          <p>Purchase: {money(product.purchasePrice)}</p>
          <p>Selling: {money(product.sellingPrice)}</p>
          <p>Stock: {product.currentStock} / min {product.minStock}</p>
          {product.currentStock <= 0 ? (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-300 dark:border-rose-900">
                <span className="h-2 w-2 rounded-full bg-rose-600"></span>
                Out of Stock (0 Available)
              </span>
            </div>
          ) : product.currentStock <= product.minStock ? (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Low Stock Warning ({product.currentStock} left)
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <Badge status="Paid">In Stock ({product.currentStock})</Badge>
            </div>
          )}
          <div className="mt-2"><Badge status={product.status}>{product.status}</Badge></div>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="mb-3 font-semibold">Stock history</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2">Date</th><th>Type</th><th>Qty</th><th>Balance</th><th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {history.map((m) => (
                <tr key={m._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2">{new Date(m.date).toLocaleDateString()}</td>
                  <td>{m.type === 'in' ? 'Stock In' : 'Stock Out'}</td>
                  <td>{m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}</td>
                  <td>{m.newStock}</td>
                  <td>{m.referenceNumber || m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
