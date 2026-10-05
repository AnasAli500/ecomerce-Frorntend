import EmptyState from './EmptyState';
import Spinner from './Spinner';

export default function Table({ columns, rows, loading, onSort, sort, order }) {
  if (loading) return <Spinner />;
  if (!rows?.length) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-3 py-2 font-medium"
                onClick={() => col.sort && onSort?.(col.key)}
              >
                <span className={col.sort ? 'cursor-pointer' : ''}>
                  {col.label}
                  {sort === col.key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id || row.id} className="border-b border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
