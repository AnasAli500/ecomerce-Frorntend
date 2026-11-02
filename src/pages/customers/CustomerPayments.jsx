import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import { money, formatDate } from '../../utils/format';

export default function CustomerPayments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    api.get('/payments/customers', { params: { page, limit } }).then((res) => {
      setRows(res.data.data);
      setMeta(res.data.meta);
    });
  }, [page, limit]);

  return (
    <div>
      <PageHeader title="Customer Payments" subtitle="Full payment history" />
      <div className="card">
        <Table
          rows={rows}
          columns={[
            { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
            {
              key: 'customer',
              label: 'Customer',
              render: (r) => (
                <div>
                  {r.customer ? (
                    <Link to={`/customers/${r.customer._id}`} className="font-semibold text-brand-600 hover:underline">
                      {r.customer.name}
                    </Link>
                  ) : (
                    <span>—</span>
                  )}
                  {r.customer?.phone && <p className="text-xs text-slate-400 font-mono">{r.customer.phone}</p>}
                </div>
              ),
            },
            { key: 'amount', label: 'Payment', render: (r) => <span className="font-bold text-emerald-600 dark:text-emerald-400">+{money(r.amount)}</span> },
            { key: 'previousDebt', label: 'Previous Debt', render: (r) => money(r.previousDebt) },
            { key: 'remainingDebt', label: 'Remaining Balance', render: (r) => <span className="font-bold text-rose-600 dark:text-rose-400">{money(r.remainingDebt)}</span> },
            { key: 'method', label: 'Method', render: (r) => <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{r.method || 'cash'}</span> },
            { key: 'createdBy', label: 'Recorded By', render: (r) => r.createdBy?.name || 'Admin' },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} limit={limit} onLimitChange={setLimit} />
      </div>
    </div>
  );
}
