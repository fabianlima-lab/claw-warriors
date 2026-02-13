import { PublicNav } from '@/components/Nav';
import PageShell from '@/components/ui/PageShell';
import HeroSection from '@/components/landing/HeroSection';
import WarriorShowcase from '@/components/landing/WarriorShowcase';
import AgentValueProps from '@/components/landing/AgentValueProps';
import AppIntegrations from '@/components/landing/AppIntegrations';
import HowItWorks from '@/components/landing/HowItWorks';
import ComparisonBar from '@/components/landing/ComparisonBar';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <PageShell>
      <PublicNav />
      <main className="pt-16">
        <HeroSection />
        <WarriorShowcase />
        <AgentValueProps />
        <AppIntegrations />
        <HowItWorks />
        <ComparisonBar />
        <PricingSection />
      </main>
      <Footer />
    </PageShell>
  );
}
