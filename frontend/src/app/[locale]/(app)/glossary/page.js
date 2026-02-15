'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';

const GLOSSARY_TERMS = [
  { key: 'warrior', icon: '⚔️' },
  { key: 'class', icon: '🎭' },
  { key: 'soulForge', icon: '✨' },
  { key: 'deepMemory', icon: '🧠' },
  { key: 'pulseCheck', icon: '💓' },
  { key: 'standingOrders', icon: '⚡' },
  { key: 'skill', icon: '🔌' },
  { key: 'gateway', icon: '🌐' },
  { key: 'openClaw', icon: '🦀' },
  { key: 'tone', icon: '🗣️' },
  { key: 'tier', icon: '📊' },
  { key: 'vault', icon: '🔐' },
  { key: 'guardian', icon: '🛡️', isClass: true },
  { key: 'scholar', icon: '📚', isClass: true },
  { key: 'creator', icon: '🎨', isClass: true },
  { key: 'strategist', icon: '🧩', isClass: true },
  { key: 'sentinel', icon: '🔒', isClass: true },
];

// Group terms: platform terms first, then classes
const platformTerms = GLOSSARY_TERMS.filter((t) => !t.isClass);
const classTerms = GLOSSARY_TERMS.filter((t) => t.isClass);

export default function GlossaryPage() {
  const t = useTranslations('Glossary');
  const tCommon = useTranslations('Common');

  function renderCard(term) {
    return (
      <Card key={term.key} className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0 mt-0.5">{term.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-txt capitalize">
              {term.key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <p className="text-sm text-txt-muted mt-1 leading-relaxed">
              {t(term.key)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Back link */}
      <Link href="/dashboard" className="text-sm text-accent hover:underline">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl text-txt">
          Glossary
        </h1>
        <p className="text-sm text-txt-muted mt-1">
          Learn what every ClawWarriors term means.
        </p>
      </div>

      {/* Platform Terms */}
      <div>
        <h2 className="text-xs font-semibold text-txt-dim uppercase tracking-[2px] mb-4">
          Platform
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platformTerms.map(renderCard)}
        </div>
      </div>

      {/* Warrior Classes */}
      <div>
        <h2 className="text-xs font-semibold text-txt-dim uppercase tracking-[2px] mb-4">
          Warrior Classes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {classTerms.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
