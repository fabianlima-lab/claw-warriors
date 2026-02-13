import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="font-[family-name:var(--font-display)] text-txt font-bold">⚔️ CLAWWARRIORS</span>
            <p className="text-txt-dim text-sm mt-1">Your AI warrior, your rules.</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-txt-muted">
            <a href="#warriors" className="hover:text-txt transition-colors">Warriors</a>
            <a href="#pricing" className="hover:text-txt transition-colors">Pricing</a>
            <Link href="/demo" className="hover:text-txt transition-colors">Demo</Link>
            <Link href="/login" className="hover:text-txt transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-txt transition-colors">Sign Up</Link>
            <Link href="/privacy" className="hover:text-txt transition-colors">Privacy Policy</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-txt-faint text-xs">
            &copy; {new Date().getFullYear()} ClawWarriors. All rights reserved.
          </p>
          <p className="text-txt-dim text-xs">
            Need a custom AI solution for your team?{' '}
            <a href="mailto:support@clawwarriors.com" className="text-guardian hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
