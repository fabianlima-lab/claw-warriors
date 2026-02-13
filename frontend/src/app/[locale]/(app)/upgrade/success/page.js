'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

export default function UpgradeSuccessPage() {
  const t = useTranslations('UpgradeSuccess');
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <div className="text-6xl mb-6">{t('emoji')}</div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-txt">
        {t('title')}
      </h1>
      <p className="text-txt-muted mt-4">
        {t('description')}
      </p>
      <Button onClick={() => router.push('/dashboard')} className="mt-8 px-10">
        {t('goToDashboard')}
      </Button>
    </div>
  );
}
