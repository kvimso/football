import type { Metadata } from 'next'
import { getServerT } from '@/lib/server-translations'

export const metadata: Metadata = {
  title: 'Privacy Policy | GFT',
  description:
    'Privacy Policy for the Georgian Football Talent Platform — how we collect, use, and protect your data.',
}

export default async function PrivacyPage() {
  const { t } = await getServerT()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">{t('privacy.title')}</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        {t('privacy.lastUpdated')}: March 25, 2026
      </p>

      {/* DRAFT — replace with legal review before launch */}
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground-secondary">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
          <p className="mt-2">
            Georgian Football Talent Platform (&quot;GFT&quot;, &quot;we&quot;, &quot;us&quot;)
            operates the web application at gft.ge. We are the data controller responsible for your
            personal data. This policy explains how we collect, use, and protect information when
            you use our platform for scouting, managing, or discovering Georgian youth football
            talent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
          <p className="mt-2">
            <strong>Account data:</strong> Name, email address, organization, country, and role when
            you register or request a demo.
          </p>
          <p className="mt-2">
            <strong>Usage data:</strong> Pages visited, search queries, players viewed, watchlist
            activity, and messaging interactions — collected automatically to improve the platform.
          </p>
          <p className="mt-2">
            <strong>Camera and analytics data:</strong> Match footage, player statistics, and
            performance metrics collected by Pixellot cameras operated by our partner Starlive at
            participating academies. This data is linked to player profiles on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
          <p className="mt-2">We use your information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Operate and maintain the scouting platform</li>
            <li>Connect scouts with academies and facilitate player discovery</li>
            <li>Display verified player statistics and match analytics</li>
            <li>Process demo requests and manage subscriptions</li>
            <li>Send platform-related communications</li>
            <li>Improve platform features and user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Data Sharing</h2>
          <p className="mt-2">We may share your data with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Academies and scouts:</strong> Profile information visible to other platform
              users according to their role permissions
            </li>
            <li>
              <strong>Starlive / Pixellot:</strong> Our camera technology partner that provides
              match footage and player statistics
            </li>
            <li>
              <strong>Supabase:</strong> Our database and authentication provider (data processed in
              EU)
            </li>
            <li>
              <strong>Vercel:</strong> Our hosting provider for the web application
            </li>
          </ul>
          <p className="mt-2">We do not sell personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
          <p className="mt-2">
            Account data is retained for the duration of your active subscription. Player career
            history is preserved indefinitely to maintain statistical records. You may request
            deletion of your account data at any time (see Section 6).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
          <p className="mt-2">
            Under the General Data Protection Regulation (GDPR) and the Law of Georgia on Personal
            Data Protection, you have the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
          </ul>
          <p className="mt-2">
            We will respond to data subject requests within 10 working days, in compliance with
            Georgian data protection law. The supervisory authority is the Personal Data Protection
            Service of Georgia (PDPS).
          </p>
          <p className="mt-2">
            <strong>Youth player data:</strong> For players under 16, parental or guardian consent
            is required for data collection and processing. Academy administrators are responsible
            for obtaining this consent before registering players on the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Cookies</h2>
          <p className="mt-2">We use the following cookies:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Authentication session:</strong> Required for login functionality (Supabase
              Auth)
            </li>
            <li>
              <strong>Language preference:</strong> Stores your English/Georgian language choice
            </li>
            <li>
              <strong>Theme preference:</strong> Stores your light/dark mode choice
            </li>
          </ul>
          <p className="mt-2">We do not use third-party tracking or advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
          <p className="mt-2">
            For privacy inquiries or data subject requests, contact us at{' '}
            <a href="mailto:info@gft.ge" className="text-primary hover:underline">
              info@gft.ge
            </a>
            .
          </p>
          <p className="mt-1">Georgian Football Talent Platform, Tbilisi, Georgia.</p>
        </section>
      </div>
    </div>
  )
}
