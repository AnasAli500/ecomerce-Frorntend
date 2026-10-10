import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import Badge from '../../components/Badge';
import { money, formatDate } from '../../utils/format';

export default function PurchaseHistory() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debounced = useDebounce(search);

  useEffect(() => {
    api
      .get('/purchases', {
        params: { search: debounced, page, limit },
      })
      .then((res) => {
        setRows(res.data.data);
        setMeta(res.data.meta);
      });
  }, [debounced, page, limit]);

  return (
    <div>
      <PageHeader title="Purchase History" to="/purchases/new" actionLabel="New Purchase" />
      <div className="flex flex-wrap gap-2">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Invoice number"
        />
        <select
          className="input max-w-[150px]"
          value={limit}
          onChange={(e) => {
            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
            setLimit(val);
            setPage(1);
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
          <option value={200}>200 per page</option>
          <option value={300}>300 per page</option>
          <option value={400}>400 per page</option>
          <option value={500}>500 per page</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="mt-4 card">
        <Table
          rows={rows}
          columns={[
            { key: 'invoiceNumber', label: 'Invoice' },
            { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
            { key: 'supplier', label: 'Supplier', render: (r) => r.supplier?.name },
            { key: 'products', label: 'Products', render: (r) => r.items?.map((i) => i.productName).join(', ') },
            { key: 'total', label: 'Total', render: (r) => money(r.total) },
            { key: 'paid', label: 'Paid', render: (r) => money(r.paid) },
            { key: 'remaining', label: 'Due', render: (r) => money(r.remaining) },
            { key: 'paymentStatus', label: 'Status', render: (r) => <Badge status={r.paymentStatus}>{r.paymentStatus}</Badge> },
            { key: 'a', label: '', render: (r) => <Link className="text-brand-600" to={`/purchases/${r._id}`}>View</Link> },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>
    </div>
  );
}
