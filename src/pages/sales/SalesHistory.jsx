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

export default function SalesHistory() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);

  useEffect(() => {
    api.get('/sales', { params: { search: debounced, paymentStatus: status || undefined, page } }).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  }, [debounced, status, page]);

  return (
    <div>
      <PageHeader title="Sales History" to="/sales/new" actionLabel="New Sale" />
      <div className="mb-4 flex gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Invoice number" />
        <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Paid</option>
          <option>Partial</option>
          <option>Unpaid</option>
        </select>
      </div>
      <div className="card">
        <Table
          rows={rows}
          columns={[
            { key: 'invoiceNumber', label: 'Invoice' },
            { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
            { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
            { key: 'products', label: 'Products', render: (r) => r.items?.map((i) => i.productName).join(', ') },
            { key: 'total', label: 'Total', render: (r) => money(r.total) },
            { key: 'paid', label: 'Paid', render: (r) => money(r.paid) },
            { key: 'debt', label: 'Debt', render: (r) => money(r.debt) },
            { key: 'paymentStatus', label: 'Status', render: (r) => <Badge status={r.paymentStatus}>{r.paymentStatus}</Badge> },
            { key: 'admin', label: 'Admin', render: (r) => r.createdBy?.name },
            { key: 'a', label: '', render: (r) => <Link className="text-brand-600" to={`/sales/${r._id}`}>View / Print</Link> },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
