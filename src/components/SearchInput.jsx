export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input className="input max-w-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  );
}
