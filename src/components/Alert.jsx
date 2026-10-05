export default function Alert({ type = 'info', children }) {
  const map = {
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200',
    warning: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
  };
  return <div className={`rounded-lg px-3 py-2 text-sm ${map[type]}`}>{children}</div>;
}
