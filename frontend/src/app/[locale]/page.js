import { PublicNav } from '@/components/Nav';
import PageShell from '@/components/ui/PageShell';
import HeroSection from '@/components/landing/HeroSection';

import ChatDemo from '@/components/landing/ChatDemo';
import AppIntegrations from '@/components/landing/AppIntegrations';
import AgentValueProps from '@/components/landing/AgentValueProps';
import TrustSection from '@/components/landing/TrustSection';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import ComparisonBar from '@/components/landing/ComparisonBar';
import PricingSection from '@/components/landing/PricingSection';
import FAQ from '@/components/landing/FAQ';
import FinalCta from '@/components/landing/FinalCta';
import Footer from '@/components/landing/Footer';
import StickyCtaBar from '@/components/landing/StickyCtaBar';

export default function Home() {
  return (
    <PageShell>
      <PublicNav />
      <main className="pt-16">
        <HeroSection />
        <ChatDemo />
        <AppIntegrations />
        <AgentValueProps />
        <TrustSection />
        <HowItWorks />
        <Testimonials />
        <ComparisonBar />
        <PricingSection />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
      <StickyCtaBar />
    </PageShell>
  );
}
