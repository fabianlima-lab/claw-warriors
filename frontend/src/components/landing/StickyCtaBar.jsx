'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function StickyCtaBar() {
  const t = useTranslations('StickyCta');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById('hero');
      const pricing = document.getElementById('pricing');

      if (!hero) return;

      const heroBottom = hero.getBoundingClientRect().bottom;
      const pricingVisible = pricing
        ? pricing.getBoundingClientRect().top < window.innerHeight
        : false;

      // Show after scrolling past hero, hide when pricing is visible
      setVisible(heroBottom < 0 && !pricingVisible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[rgba(10,10,15,0.85)] backdrop-blur-md transition-transform duration-300"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <span className="text-[15px] text-txt-muted hidden sm:block">
          {t('text')}
        </span>
        <Link
          href="/signup"
          className="bg-accent text-white rounded-[var(--radius-btn)] px-6 py-2.5 text-[14px] font-bold hover:opacity-90 transition-all whitespace-nowrap ml-auto sm:ml-0"
        >
          {t('cta')}
        </Link>
      </div>
    </div>
  );
}
