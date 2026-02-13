export default function PageShell({ children, className = '' }) {
  return (
    <div className={`min-h-screen relative ${className}`}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-guardian/5 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
