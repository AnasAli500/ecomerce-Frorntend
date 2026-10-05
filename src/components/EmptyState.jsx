export default function EmptyState({ title = 'Nothing here yet', subtitle = 'Try changing your filters or add a new record.' }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm">{subtitle}</p>
    </div>
  );
}
