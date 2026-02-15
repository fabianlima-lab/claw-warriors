'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import SectionLabel from '@/components/ui/SectionLabel';
import { CLASS_LABELS, CLASS_HEX } from '@/lib/constants';
import { apiFetch } from '@/lib/api';

export default function DeployPage() {
  const t = useTranslations('Deploy');
  const tClasses = useTranslations('Classes');
  const [warrior, setWarrior] = useState(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch('/warriors/mine')
      .then((data) => {
        const list = data.warriors || data;
        if (Array.isArray(list) && list.length > 0) {
          // Get the most recently created active warrior
          const active = list.find((w) => w.isActive || w.is_active) || list[0];
          setWarrior(active);
        }
      })
      .catch(() => {});
  }, []);

  const cls = warrior?.warriorClass || warrior?.warrior_class || 'guardian';
  const color = CLASS_HEX[cls];
  const templateId = warrior?.templateId || warrior?.template_id;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-center">
      <SectionLabel warriorClass={cls}>{t('step')}</SectionLabel>

      <div className="mt-8 mb-6">
        {/* Success glow */}
        <div className="relative w-40 h-40 mx-auto">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse"
            style={{ background: color }}
          />
          {templateId && (
            <Image
              src={`/warriors/${templateId}.png`}
              alt={warrior?.name || 'Warrior'}
              width={160}
              height={160}
              className="relative rounded-full object-cover w-full h-full border-2 border-border"
            />
          )}
        </div>
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-4xl text-txt mt-6">
        {t('title')}
      </h1>

      {warrior && (
        <div className="mt-3">
          <span className="font-[family-name:var(--font-display)] text-2xl text-txt">
            {warrior.customName || warrior.custom_name || warrior.name || templateId}
          </span>
          <span
            className="block text-xs uppercase tracking-wider font-medium mt-1"
            style={{ color }}
          >
            {tClasses(CLASS_LABELS[cls])}
          </span>
        </div>
      )}

      <p className="text-txt-muted mt-6 max-w-md mx-auto">
        {t('description')}
      </p>

      <div className="mt-10">
        <Button
          onClick={() => router.push('/dashboard')}
          variant={cls}
          className="px-10"
        >
          {t('goToDashboard')}
        </Button>
      </div>
    </div>
  );
}
