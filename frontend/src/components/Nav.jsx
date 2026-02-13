'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-txt font-bold text-lg">
          ⚔️ CLAWWARRIORS
        </Link>
        <div className="hidden md:flex items-center gap-7">
          <a href="#how" className="text-sm text-txt-muted hover:text-txt transition-colors">How It Works</a>
          <a href="#apps" className="text-sm text-txt-muted hover:text-txt transition-colors">Apps</a>
          <a href="#pricing" className="text-sm text-txt-muted hover:text-txt transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-txt-muted hover:text-txt transition-colors">Sign in</Link>
          <Link
            href="/signup"
            className="bg-accent text-white px-5 py-2 rounded-[var(--radius-btn)] text-sm font-semibold hover:opacity-90 transition-all"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </nav>
  );
}

const APP_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/skills', label: 'Skills & Apps' },
  { href: '/settings', label: 'Settings' },
];

export function AppNav({ userEmail }) {
  const pathname = usePathname();
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '??';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-bg/90 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-txt font-bold text-lg">
          ⚔️ CLAWWARRIORS
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {APP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? 'text-txt font-bold'
                  : 'text-txt-muted hover:text-txt'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="w-9 h-9 rounded-full bg-elevated border border-border flex items-center justify-center text-xs text-txt-muted font-medium">
          {initials}
        </div>
      </div>
    </nav>
  );
}
