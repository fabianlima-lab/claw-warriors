export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-gradient-to-br from-card to-card-end border border-border rounded-[var(--radius-card)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
