'use client';

import { CLASSES, CLASS_LABELS, CLASS_DESCRIPTIONS, CLASS_ICONS, CLASS_HEX } from '@/lib/constants';
import { useTranslations } from 'next-intl';

export default function ClassTabs({ selected, onSelect }) {
  const t = useTranslations('Classes');

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {CLASSES.map((cls) => {
        const active = selected === cls;
        return (
          <button
            key={cls}
            onClick={() => onSelect(cls)}
            className={`px-4 py-3 rounded-[var(--radius-btn)] text-sm font-medium transition-all cursor-pointer border flex flex-col items-center gap-1 min-w-[140px] ${
              active
                ? 'border-transparent text-bg'
                : 'border-border text-txt-muted hover:text-txt bg-transparent'
            }`}
            style={active ? { background: CLASS_HEX[cls] } : {}}
          >
            <span>{CLASS_ICONS[cls]} {t(CLASS_LABELS[cls])}</span>
            <span className={`text-[11px] font-normal leading-tight ${active ? 'opacity-80' : 'opacity-60'}`}>
              {t(CLASS_DESCRIPTIONS[cls])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
