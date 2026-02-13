import { PublicNav } from '@/components/Nav';
import PageShell from '@/components/ui/PageShell';
import HeroSection from '@/components/landing/HeroSection';
import ChatDemo from '@/components/landing/ChatDemo';
import AppIntegrations from '@/components/landing/AppIntegrations';
import AgentValueProps from '@/components/landing/AgentValueProps';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import ComparisonBar from '@/components/landing/ComparisonBar';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <PageShell>
      <PublicNav />
      <main className="pt-16">
        <HeroSection />
        <ChatDemo />
        <AppIntegrations />
        <AgentValueProps />
        <HowItWorks />
        <Testimonials />
        <ComparisonBar />
        <PricingSection />
      </main>
      <Footer />
    </PageShell>
  );
}
