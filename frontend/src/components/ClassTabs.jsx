'use client';

import { CLASSES, CLASS_LABELS, CLASS_ICONS, CLASS_HEX } from '@/lib/constants';
import { useTranslations } from 'next-intl';

export default function ClassTabs({ selected, onSelect }) {
  const t = useTranslations('Classes');

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CLASSES.map((cls) => {
        const active = selected === cls;
        return (
          <button
            key={cls}
            onClick={() => onSelect(cls)}
            className={`px-4 py-2 rounded-[var(--radius-btn)] text-sm font-medium transition-all cursor-pointer border ${
              active
                ? 'border-transparent text-bg'
                : 'border-border text-txt-muted hover:text-txt bg-transparent'
            }`}
            style={active ? { background: CLASS_HEX[cls] } : {}}
          >
            {CLASS_ICONS[cls]} {t(CLASS_LABELS[cls])}
          </button>
        );
      })}
    </div>
  );
}
