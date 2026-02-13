import PageShell from '@/components/ui/PageShell';

export default function AuthLayout({ children }) {
  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </PageShell>
  );
}
