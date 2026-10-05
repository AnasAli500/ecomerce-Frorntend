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
  const debounced = useDebounce(search);

  useEffect(() => {
    api.get('/purchases', { params: { search: debounced, page } }).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  }, [debounced, page]);

  return (
    <div>
      <PageHeader title="Purchase History" to="/purchases/new" actionLabel="New Purchase" />
      <SearchInput value={search} onChange={setSearch} placeholder="Invoice number" />
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
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
