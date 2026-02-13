'use client';

import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

export default function UpgradeCancelPage() {
  const t = useTranslations('UpgradeCancel');
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt">
        {t('title')}
      </h1>
      <p className="text-txt-muted mt-4">
        {t('description')}
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button onClick={() => router.push('/dashboard')}>
          {t('returnDashboard')}
        </Button>
        <Link
          href="/upgrade"
          className="text-sm text-accent hover:underline"
        >
          {t('comparePlans')}
        </Link>
      </div>
    </div>
  );
}
