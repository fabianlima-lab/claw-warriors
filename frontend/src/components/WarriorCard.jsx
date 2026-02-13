'use client';

import Image from 'next/image';
import Card from '@/components/ui/Card';
import StatBar from '@/components/ui/StatBar';
import { CLASS_LABELS, CLASS_STAT_NAMES, CLASS_STAT_KEYS, CLASS_HEX } from '@/lib/constants';
import { useTranslations } from 'next-intl';

export default function WarriorCard({
  warrior,
  size = 'md',
  selected = false,
  onClick,
  showStats = true,
}) {
  const tClasses = useTranslations('Classes');
  const tStats = useTranslations('Stats');

  const imgSize = size === 'lg' ? 120 : size === 'sm' ? 64 : 80;
  const cls = warrior.warriorClass || warrior.warrior_class;
  const color = CLASS_HEX[cls];
  const statNames = CLASS_STAT_NAMES[cls] || [];
  const statKeys = CLASS_STAT_KEYS[cls] || [];
  const stats = warrior.stats || {};

  return (
    <Card
      className={`p-5 cursor-pointer transition-all duration-200 hover:border-transparent ${
        selected ? 'ring-2 border-transparent' : ''
      }`}
      style={selected ? { '--tw-ring-color': color } : {}}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <Image
          src={warrior.artFile || warrior.art_file || `/warriors/${warrior.id || warrior.templateId}.png`}
          alt={warrior.name}
          width={imgSize}
          height={imgSize}
          className="rounded-full object-cover"
        />
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-txt text-lg">
            {warrior.name}
          </h3>
          <span
            className="text-xs uppercase tracking-wider font-medium"
            style={{ color }}
          >
            {tClasses(CLASS_LABELS[cls])}
          </span>
        </div>
        {warrior.introQuote && (
          <p className="text-sm text-txt-muted italic">
            &ldquo;{warrior.introQuote}&rdquo;
          </p>
        )}
        {showStats && statNames.length > 0 && (
          <div className="w-full space-y-2 mt-2">
            {statNames.map((name, i) => (
              <StatBar
                key={name}
                label={tStats(name)}
                value={stats[statKeys[i]] || 0}
                warriorClass={cls}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
