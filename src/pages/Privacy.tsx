export default function Privacy() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: May 2025</p>

        <div className="space-y-10 text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Who we are</h2>
            <p className="text-sm leading-relaxed">
              Accuracy Developments Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a company registered in England &amp; Wales. We operate the UltAi Group platform, including the FineGuard, VaultLine, and UltAi products. Our registered office is in England &amp; Wales.
            </p>
            <p className="text-sm leading-relaxed mt-2">
              For data protection enquiries, contact us at{' '}
              <a href="mailto:privacy@ultai.group" className="text-[#5A4BFF] hover:underline">
                privacy@ultai.group
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. What data we collect</h2>
            <p className="text-sm leading-relaxed mb-3">We collect the following categories of personal data:</p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>
                <strong className="text-white">Form submissions:</strong> name, email address, company name, Companies House registration number, telephone number, and any message you provide.
              </li>
              <li>
                <strong className="text-white">Account data:</strong> email address, password (hashed), and product subscription details.
              </li>
              <li>
                <strong className="text-white">Usage data:</strong> pages visited, features used, browser type, and IP address (collected via server logs).
              </li>
              <li>
                <strong className="text-white">Payment data:</strong> processed by Stripe. We do not store card details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. How we use your data</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>To deliver our compliance monitoring, document storage, and intake services.</li>
              <li>To send compliance alerts and deadline notifications for monitored companies.</li>
              <li>To respond to sales, demo, and support enquiries.</li>
              <li>To process subscription payments via Stripe.</li>
              <li>To improve and secure our platform.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              Our lawful basis for processing is: contract performance (subscriptions), legitimate interests (sales follow-up), and consent (marketing, where applicable).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Data retention</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>Contact form data: retained for 2 years from submission.</li>
              <li>Lead and audit data: retained until you request deletion or opt out.</li>
              <li>Active subscription data: retained for the duration of your subscription plus 6 years (legal obligation).</li>
              <li>Server logs: retained for 90 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Your rights (GDPR Articles 15–20)</h2>
            <p className="text-sm leading-relaxed mb-3">
              Under the UK GDPR, you have the following rights:
            </p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li><strong className="text-white">Access (Art. 15):</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-white">Rectification (Art. 16):</strong> Request correction of inaccurate data.</li>
              <li><strong className="text-white">Erasure (Art. 17):</strong> Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
              <li><strong className="text-white">Restriction (Art. 18):</strong> Request restriction of processing in certain circumstances.</li>
              <li><strong className="text-white">Portability (Art. 20):</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong className="text-white">Objection (Art. 21):</strong> Object to processing based on legitimate interests.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              To exercise any right, contact{' '}
              <a href="mailto:privacy@ultai.group" className="text-[#5A4BFF] hover:underline">
                privacy@ultai.group
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Third parties</h2>
            <p className="text-sm leading-relaxed mb-3">We share data with the following processors, all of whom are GDPR-compliant:</p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li><strong className="text-white">Companies House API:</strong> We query the public Companies House register on your behalf. No personal data is sent; only company numbers.</li>
              <li><strong className="text-white">Stripe:</strong> Payment processing. Subject to Stripe&rsquo;s privacy policy and PCI-DSS compliance.</li>
              <li><strong className="text-white">Resend / email provider:</strong> Transactional email delivery (compliance alerts, confirmations).</li>
              <li><strong className="text-white">OpenAI:</strong> Powers AI intake and classification features. Data processed under OpenAI&rsquo;s data processing agreement.</li>
              <li><strong className="text-white">Neon / PostgreSQL:</strong> Hosted database in the EU/EEA.</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Cookies</h2>
            <p className="text-sm leading-relaxed">
              We use essential cookies only — those required for the platform to function (session management, CSRF protection). We do not use advertising, analytics, or tracking cookies. No cookie consent banner is required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Data requests</h2>
            <p className="text-sm leading-relaxed">
              For all data protection requests, contact us at{' '}
              <a href="mailto:privacy@ultai.group" className="text-[#5A4BFF] hover:underline">
                privacy@ultai.group
              </a>
              . You also have the right to lodge a complaint with the Information Commissioner&rsquo;s Office (ICO) at{' '}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5A4BFF] hover:underline"
              >
                ico.org.uk
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Changes to this policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated to active subscribers by email. Continued use of our services after changes take effect constitutes acceptance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
