import Link from 'next/link';
import { PublicNav } from '@/components/Nav';
import PageShell from '@/components/ui/PageShell';

export default function PrivacyPage() {
  return (
    <PageShell>
      <PublicNav />
      <main className="pt-16 max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-txt mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-invert max-w-none space-y-8 text-txt-body text-sm leading-relaxed">
          <section>
            <h2 className="text-lg text-txt font-medium mb-3">1. Information We Collect</h2>
            <p>
              When you create a ClawWarriors account, we collect your email address and encrypted password.
              When you connect a messaging channel (Telegram or WhatsApp), we store the channel identifier
              needed to route messages between you and your warrior.
            </p>
            <p className="mt-2">
              We also collect message content sent between you and your warrior to provide conversation
              context and improve the experience. Messages are stored securely and associated with your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-txt font-medium mb-3">2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide and maintain the ClawWarriors service</li>
              <li>Route messages between you and your AI warrior</li>
              <li>Maintain conversation context for personalized responses</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send account-related notifications</li>
              <li>Improve our service and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-txt font-medium mb-3">3. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>NVIDIA NIMs (Kimi K2.5)</strong> — AI model provider for generating warrior responses</li>
              <li><strong>Telegram Bot API</strong> — Messaging channel integration</li>
              <li><strong>Twilio</strong> — WhatsApp messaging integration</li>
              <li><strong>Stripe</strong> — Payment processing</li>
            </ul>
            <p className="mt-2">
              These services have their own privacy policies. Message content is transmitted to our
              AI provider to generate responses. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-txt font-medium mb-3">4. Data Storage & Security</h2>
            <p>
              Your data is stored on secure servers. Passwords are hashed using bcrypt.
              We use HTTPS for all data transmission. While we implement reasonable security
              measures, no internet transmission is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-txt font-medium mb-3">5. Data Retention</h2>
            <p>
              We retain your account data and message history for as long as your account is active.
              You can request deletion of your account and associated data by contacting us or
              using the account deletion option in your settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg text-txt font-medium mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg text-txt font-medium mb-3">7. Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your data, contact us at{' '}
              <a href="mailto:privacy@clawwarriors.com" className="text-accent hover:underline">
                privacy@clawwarriors.com
              </a>
            </p>
          </section>

          <section>
            <p className="text-txt-dim text-xs mt-8">
              Last updated: February 2026
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-sm text-accent hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
