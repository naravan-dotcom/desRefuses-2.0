export default function StatusBadge({ className = "", children }) {
  return <span className={`status ${className}`.trim()}>{children}</span>;
}
