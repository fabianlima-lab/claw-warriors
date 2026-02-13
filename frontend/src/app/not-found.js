import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-[family-name:var(--font-display)] text-6xl text-txt">404</h1>
      <p className="text-txt-muted text-lg">This warrior has wandered off the map.</p>
      <Link
        href="/"
        className="bg-guardian text-bg px-6 py-3 rounded-[var(--radius-btn)] text-sm font-medium hover:brightness-110 transition-all"
      >
        Return Home
      </Link>
    </div>
  );
}
