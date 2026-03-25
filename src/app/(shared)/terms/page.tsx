import type { Metadata } from 'next'
import { getServerT } from '@/lib/server-translations'

export const metadata: Metadata = {
  title: 'Terms of Service | GFT',
  description:
    'Terms of Service for the Georgian Football Talent Platform — rules and conditions for using our scouting platform.',
}

export default async function TermsPage() {
  const { t } = await getServerT()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">{t('terms.title')}</h1>
      <p className="mt-2 text-sm text-foreground-muted">{t('terms.lastUpdated')}: March 25, 2026</p>

      {/* DRAFT — replace with legal review before launch */}
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground-secondary">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using the Georgian Football Talent Platform (&quot;GFT&quot;, &quot;the
            Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree,
            do not use the Platform. We may update these terms; continued use after changes
            constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Account Registration</h2>
          <p className="mt-2">
            <strong>Scouts:</strong> May register with an email and password. Access requires
            approval by platform administrators.
          </p>
          <p className="mt-2">
            <strong>Academy administrators:</strong> Are invited by platform administrators and
            assigned to their respective clubs. Academy admins are responsible for the accuracy of
            player data they submit.
          </p>
          <p className="mt-2">
            You are responsible for maintaining the security of your account credentials. You must
            provide accurate registration information and keep it up to date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Scrape, crawl, or systematically extract data from the Platform by automated means
            </li>
            <li>
              Use the Platform to harass, spam, or send unsolicited communications to academies or
              scouts
            </li>
            <li>
              Bypass the Platform to directly contact players, families, or academies discovered
              through GFT
            </li>
            <li>Share login credentials or allow unauthorized access to your account</li>
            <li>
              Upload false, misleading, or inappropriate content including player data or
              communications
            </li>
            <li>Attempt to gain unauthorized access to other accounts or platform systems</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Intellectual Property</h2>
          <p className="mt-2">
            The Platform, including its design, code, and branding, is owned by GFT. Player data
            submitted by academies remains the intellectual property of the respective clubs.
            Statistical data derived from camera systems is provided under license from
            Starlive/Pixellot. You may not reproduce, distribute, or create derivative works from
            Platform content without written permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Camera Data Disclaimer</h2>
          <p className="mt-2">
            Player statistics and match analytics displayed on the Platform are provided by Pixellot
            camera systems operated by our partner Starlive. While we strive for accuracy, GFT does
            not independently verify camera-generated statistics and cannot guarantee their
            accuracy. Statistics are provided &quot;as is&quot; for informational purposes and
            should not be the sole basis for scouting or transfer decisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, GFT&apos;s total liability for any claims
            arising from your use of the Platform is limited to the total fees you have paid to GFT
            in the 12 months preceding the claim. GFT is not liable for indirect, incidental, or
            consequential damages, including lost profits or data loss.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Termination</h2>
          <p className="mt-2">
            We may suspend or terminate your account at any time for violation of these terms or for
            any reason with reasonable notice. Upon termination, your access to the Platform will be
            revoked. Provisions that by their nature should survive termination will remain in
            effect.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Governing Law</h2>
          <p className="mt-2">
            These terms are governed by the laws of Georgia. Any disputes shall be resolved in the
            courts of Tbilisi, Georgia. In the event of any conflict between the English and
            Georgian versions of these terms, the English version shall prevail.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
          <p className="mt-2">
            For questions about these terms, contact us at{' '}
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
