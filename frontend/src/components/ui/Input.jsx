export default function Input({ label, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-wider text-txt-muted font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-elevated border border-border rounded-[var(--radius-btn)] px-4 py-3 text-txt text-sm placeholder:text-txt-dim focus:outline-none focus:border-accent transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
