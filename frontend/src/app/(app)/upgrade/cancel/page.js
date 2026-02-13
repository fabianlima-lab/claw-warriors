'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function UpgradeCancelPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-txt">
        No Worries
      </h1>
      <p className="text-txt-muted mt-4">
        You can upgrade anytime from your dashboard. Your trial continues as usual.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
        <Link
          href="/upgrade"
          className="text-sm text-accent hover:underline"
        >
          Compare Plans
        </Link>
      </div>
    </div>
  );
}
