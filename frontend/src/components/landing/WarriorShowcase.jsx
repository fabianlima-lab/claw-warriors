'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ClassTabs from '@/components/ClassTabs';
import StatBar from '@/components/ui/StatBar';
import Card from '@/components/ui/Card';
import { CLASS_LABELS, CLASS_DESCRIPTIONS, CLASS_STAT_NAMES, CLASS_STAT_KEYS, CLASS_HEX } from '@/lib/constants';
import { useTranslations } from 'next-intl';

const FALLBACK_WARRIORS = {
  guardian: [
    { id: 'mia_guardian', name: 'Mia', warriorClass: 'guardian', introQuote: "I'm one step ahead — always.", artFile: '/warriors/mia_guardian.png', stats: { protection: 4, precision: 3, loyalty: 5 } },
    { id: 'atlas_guardian', name: 'Atlas', warriorClass: 'guardian', introQuote: 'Structure brings clarity. Let me bring the order.', artFile: '/warriors/atlas_guardian.png', stats: { protection: 5, precision: 4, loyalty: 4 } },
    { id: 'river_guardian', name: 'River', warriorClass: 'guardian', introQuote: 'I read between the lines and adapt to what you need.', artFile: '/warriors/river_guardian.png', stats: { protection: 3, precision: 4, loyalty: 5 } },
  ],
  scholar: [
    { id: 'sage_scholar', name: 'Sage', warriorClass: 'scholar', introQuote: 'The best answers come from the right questions.', artFile: '/warriors/sage_scholar.png', stats: { wisdom: 5, patience: 5, clarity: 4 } },
    { id: 'kai_scholar', name: 'Kai', warriorClass: 'scholar', introQuote: "Learning doesn't have to feel like a grind.", artFile: '/warriors/kai_scholar.png', stats: { wisdom: 4, patience: 3, clarity: 5 } },
    { id: 'wren_scholar', name: 'Wren', warriorClass: 'scholar', introQuote: 'Once you see the framework, the rest clicks.', artFile: '/warriors/wren_scholar.png', stats: { wisdom: 4, patience: 4, clarity: 5 } },
  ],
  bard: [
    { id: 'luna_bard', name: 'Luna', warriorClass: 'bard', introQuote: 'This hook will stop the scroll.', artFile: '/warriors/luna_bard.png', stats: { creativity: 5, strategy: 3, momentum: 5 } },
    { id: 'marco_bard', name: 'Marco', warriorClass: 'bard', introQuote: "Let's build a narrative around this.", artFile: '/warriors/marco_bard.png', stats: { creativity: 4, strategy: 5, momentum: 4 } },
    { id: 'pixel_bard', name: 'Pixel', warriorClass: 'bard', introQuote: "Nobody's doing this yet — let's try it.", artFile: '/warriors/pixel_bard.png', stats: { creativity: 5, strategy: 3, momentum: 4 } },
  ],
  artificer: [
    { id: 'ada_artificer', name: 'Ada', warriorClass: 'artificer', introQuote: 'Clean code, clear architecture.', artFile: '/warriors/ada_artificer.png', stats: { precision: 5, speed: 3, depth: 5 } },
    { id: 'dex_artificer', name: 'Dex', warriorClass: 'artificer', introQuote: 'Ship first, optimize later.', artFile: '/warriors/dex_artificer.png', stats: { precision: 3, speed: 5, depth: 4 } },
    { id: 'byte_artificer', name: 'Byte', warriorClass: 'artificer', introQuote: 'I think in systems. Let me see the whole picture.', artFile: '/warriors/byte_artificer.png', stats: { precision: 4, speed: 3, depth: 5 } },
  ],
  rogue: [
    { id: 'vega_rogue', name: 'Vega', warriorClass: 'rogue', introQuote: 'The numbers say wait — or strike.', artFile: '/warriors/vega_rogue.png', stats: { analysis: 5, speed: 4, instinct: 4 } },
    { id: 'rex_rogue', name: 'Rex', warriorClass: 'rogue', introQuote: 'The setup is there. Time to move.', artFile: '/warriors/rex_rogue.png', stats: { analysis: 4, speed: 5, instinct: 5 } },
    { id: 'onyx_rogue', name: 'Onyx', warriorClass: 'rogue', introQuote: "Everyone's wrong — here's why.", artFile: '/warriors/onyx_rogue.png', stats: { analysis: 5, speed: 3, instinct: 5 } },
  ],
};

export default function WarriorShowcase() {
  const [selectedClass, setSelectedClass] = useState('guardian');
  const [warriors, setWarriors] = useState(FALLBACK_WARRIORS);
  const t = useTranslations('WarriorShowcase');
  const tClasses = useTranslations('Classes');
  const tStats = useTranslations('Stats');

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API}/warriors/templates`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const grouped = {};
        (data.templates || data).forEach((w) => {
          const cls = w.warriorClass || w.warrior_class;
          if (!grouped[cls]) grouped[cls] = [];
          grouped[cls].push(w);
        });
        if (Object.keys(grouped).length > 0) setWarriors(grouped);
      })
      .catch(() => {});
  }, []);

  const current = warriors[selectedClass] || [];

  return (
    <section id="warriors" className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-widest text-guardian font-medium">{t('label')}</span>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-txt mt-3">
          {t('title')}
        </h2>
        <p className="text-txt-muted mt-3 max-w-xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <ClassTabs selected={selectedClass} onSelect={setSelectedClass} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {current.map((w) => {
          const cls = w.warriorClass || w.warrior_class;
          const statNames = CLASS_STAT_NAMES[cls] || [];
          const statKeys = CLASS_STAT_KEYS[cls] || [];
          const color = CLASS_HEX[cls];
          return (
            <Card key={w.id} className="p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <Image
                  src={w.artFile || w.art_file || `/warriors/${w.id}.png`}
                  alt={w.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
                <h3 className="font-[family-name:var(--font-display)] text-txt text-xl">{w.name}</h3>
                <span className="text-xs uppercase tracking-wider font-medium" style={{ color }}>
                  {tClasses(CLASS_LABELS[cls])}
                </span>
                <p className="text-xs text-txt-muted leading-snug">
                  {tClasses(CLASS_DESCRIPTIONS[cls])}
                </p>
                {w.introQuote && (
                  <p className="text-sm text-txt-muted italic">&ldquo;{w.introQuote}&rdquo;</p>
                )}
                <div className="w-full space-y-2 mt-3">
                  {statNames.map((name, i) => (
                    <StatBar
                      key={name}
                      label={tStats(name)}
                      value={w.stats?.[statKeys[i]] || 0}
                      warriorClass={cls}
                    />
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
