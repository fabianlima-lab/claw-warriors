'use client';

export default function Error({ reset }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-txt">Something went wrong</h1>
      <p className="text-txt-muted">An unexpected error occurred. Please try again.</p>
      <button
        onClick={() => reset()}
        className="bg-guardian text-bg px-6 py-3 rounded-[var(--radius-btn)] text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
      >
        Try Again
      </button>
    </div>
  );
}
