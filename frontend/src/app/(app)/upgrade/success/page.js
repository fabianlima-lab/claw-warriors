'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function UpgradeSuccessPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-txt">
        Welcome to Pro!
      </h1>
      <p className="text-txt-muted mt-4">
        Your warrior has been powered up. All Pro features are now unlocked.
      </p>
      <Button onClick={() => router.push('/dashboard')} className="mt-8 px-10">
        Go to Dashboard
      </Button>
    </div>
  );
}
