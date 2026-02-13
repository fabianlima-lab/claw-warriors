import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <span className="font-[family-name:var(--font-display)] text-txt font-bold">⚔️ CLAWWARRIORS</span>
          <p className="text-txt-dim text-sm mt-1">Your AI warrior, your rules.</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-txt-muted">
          <Link href="/demo" className="hover:text-txt transition-colors">Demo</Link>
          <a href="#pricing" className="hover:text-txt transition-colors">Pricing</a>
          <Link href="/privacy" className="hover:text-txt transition-colors">Privacy Policy</Link>
        </div>
        <p className="text-txt-faint text-xs">
          &copy; {new Date().getFullYear()} ClawWarriors. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
