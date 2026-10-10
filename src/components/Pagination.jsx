import Button from './Button';

export default function Pagination({
  meta,
  onPage,
  limit,
  onLimitChange,
  options = [10, 25, 50, 100, 200, 300, 400, 500, 'all'],
}) {
  if (!meta || meta.total === 0) return null;

  const currentLimit = limit !== undefined ? limit : meta.limit;
  const isAll = currentLimit === 'all' || currentLimit >= 100000;
  const numericLimit = isAll ? meta.total : (Number(currentLimit) || meta.limit || 10);
  const start = meta.total === 0 ? 0 : (meta.page - 1) * numericLimit + 1;
  const end = Math.min(meta.page * numericLimit, meta.total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing {start} to {end} of {meta.total} records
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span>Show:</span>
            <select
              value={currentLimit}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                onLimitChange(val);
                if (onPage) onPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'All' : opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs">
          Page {meta.page} of {meta.pages || 1}
        </span>
        <Button
          variant="secondary"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
          className="text-xs px-2.5 py-1"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={meta.page >= (meta.pages || 1)}
          onClick={() => onPage(meta.page + 1)}
          className="text-xs px-2.5 py-1"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
