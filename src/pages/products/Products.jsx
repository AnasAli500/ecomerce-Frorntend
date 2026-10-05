import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { money } from '../../utils/format';

import ProductModal from '../../components/ProductModal';

export default function Products() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [del, setDel] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const debounced = useDebounce(search);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/products', {
      params: { search: debounced, status, lowStock: lowStock || undefined, page, sort, order, limit: 10 },
    });
    setRows(res.data.data);
    setMeta(res.data.meta);
    setLoading(false);
  };

  useEffect(() => { load(); }, [debounced, status, lowStock, page, sort, order]);

  const onSort = (key) => {
    if (sort === key) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setOrder('asc');
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        action={
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setOpenModal(true);
            }}
          >
            Add Product
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or SKU" />
        <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
          Low stock
        </label>
      </div>
      <div className="card">
        <Table
          loading={loading}
          sort={sort}
          order={order}
          onSort={onSort}
          rows={rows}
          columns={[
            { key: 'name', label: 'Product', sort: true, render: (r) => r.name },
            { key: 'sku', label: 'SKU', sort: true },
            { key: 'category', label: 'Category', render: (r) => r.category?.name },
            { key: 'purchasePrice', label: 'Purchase', render: (r) => money(r.purchasePrice) },
            { key: 'sellingPrice', label: 'Selling', render: (r) => money(r.sellingPrice) },
            { key: 'currentStock', label: 'Stock', sort: true, render: (r) => (
              <span>{r.currentStock}{r.currentStock <= r.minStock && <Badge status="Unpaid">Low</Badge>}</span>
            ) },
            { key: 'status', label: 'Status', render: (r) => <Badge status={r.status}>{r.status}</Badge> },
            { key: 'actions', label: '', render: (r) => (
              <div className="flex gap-2">
                <Link to={`/products/${r._id}`} className="text-brand-600">View</Link>
                <button
                  className="text-slate-500 hover:text-slate-700 font-medium"
                  onClick={() => {
                    setSelectedProduct(r);
                    setOpenModal(true);
                  }}
                >
                  Edit
                </button>
                <button className="text-rose-600" onClick={() => setDel(r)}>Delete</button>
              </div>
            ) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </div>

      <ProductModal
        open={openModal}
        product={selectedProduct}
        onClose={() => setOpenModal(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!del}
        title="Archive product"
        message="This hides the product but keeps sales and stock history."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          await api.delete(`/products/${del._id}`);
          toast.success('Product archived');
          setDel(null);
          load();
        }}
      />
    </div>
  );
}
