export default function PageShell({ children, className = '' }) {
  return (
    <div className={`min-h-screen relative ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
