import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import { money, formatDate } from '../../utils/format';

export default function CustomerPayments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/payments/customers', { params: { page } }).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  }, [page]);

  return (
    <div>
      <PageHeader title="Customer Payments" subtitle="Full payment history" />
      <div className="card">
        <Table
          rows={rows}
          columns={[
            { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
            { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
            { key: 'amount', label: 'Payment', render: (r) => money(r.amount) },
            { key: 'previousDebt', label: 'Previous debt', render: (r) => money(r.previousDebt) },
            { key: 'remainingDebt', label: 'Remaining', render: (r) => money(r.remainingDebt) },
            { key: 'method', label: 'Method' },
            { key: 'createdBy', label: 'Admin', render: (r) => r.createdBy?.name },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
