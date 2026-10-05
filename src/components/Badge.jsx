import { statusColor } from '../utils/format';

export default function Badge({ children, status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(status || children)}`}>
      {children}
    </span>
  );
}
