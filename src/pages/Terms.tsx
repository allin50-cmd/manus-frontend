export default function Terms() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-12">Last updated: May 2025</p>

        <div className="space-y-10 text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using any service operated by Accuracy Developments Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;), including FineGuard, VaultLine, and UltAi (collectively, the &ldquo;Services&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Service description</h2>
            <p className="text-sm leading-relaxed mb-3">
              Accuracy Developments Ltd provides three software-as-a-service products:
            </p>
            <ul className="text-sm leading-relaxed space-y-3 list-disc list-inside">
              <li>
                <strong className="text-white">FineGuard:</strong> Automated Companies House compliance monitoring. We retrieve publicly available filing data and send deadline alerts. We do not provide legal advice.
              </li>
              <li>
                <strong className="text-white">VaultLine:</strong> Secure document storage for law firms. We provide encrypted storage infrastructure. You remain responsible for the content you store.
              </li>
              <li>
                <strong className="text-white">UltAi:</strong> AI-powered client intake for law chambers. We classify and route intake data. AI outputs should be reviewed by a qualified professional before being relied upon.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Account registration and responsibilities</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>You must provide accurate and complete registration information.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must notify us immediately of any unauthorised use of your account.</li>
              <li>Accounts are for business use only and must not be shared across organisations.</li>
              <li>You must be at least 18 years of age and authorised to enter contracts on behalf of your organisation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Payment terms</h2>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>Subscriptions are billed monthly or annually via Stripe, as selected at checkout.</li>
              <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
              <li>To cancel, use the account settings or contact{' '}
                <a href="mailto:hello@ultai.group" className="text-[#5A4BFF] hover:underline">hello@ultai.group</a>.
                Cancellation takes effect at the end of the current billing period.
              </li>
              <li>We do not offer refunds for partial billing periods, except as required by law.</li>
              <li>We reserve the right to change pricing with 30 days&rsquo; notice to active subscribers.</li>
              <li>All prices are in GBP and exclusive of VAT unless stated otherwise.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Data and privacy</h2>
            <p className="text-sm leading-relaxed">
              Your use of the Services is also governed by our{' '}
              <a href="/privacy" className="text-[#5A4BFF] hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Services, you consent to our processing of your data as described therein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Acceptable use policy</h2>
            <p className="text-sm leading-relaxed mb-3">You agree not to:</p>
            <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>Use the Services for any unlawful purpose or in violation of any regulation.</li>
              <li>Attempt to gain unauthorised access to any system or account.</li>
              <li>Scrape, copy, or resell any data obtained through the Services.</li>
              <li>Introduce malicious code, viruses, or disruptive software.</li>
              <li>Use the Services to harass, defame, or harm any individual or organisation.</li>
              <li>Circumvent any security, rate-limiting, or access controls.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Intellectual property</h2>
            <p className="text-sm leading-relaxed">
              All software, branding, designs, algorithms, and content comprising the Services are owned by or licensed to Accuracy Developments Ltd. No licence is granted to copy, reverse-engineer, or create derivative works. Your data remains yours; you grant us a limited licence to process it solely for the purpose of delivering the Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Limitation of liability</h2>
            <p className="text-sm leading-relaxed">
              To the maximum extent permitted by law, Accuracy Developments Ltd shall not be liable for indirect, incidental, or consequential damages arising from your use of the Services. Our total aggregate liability shall not exceed the fees paid by you in the 12 months preceding the claim. Nothing in these Terms excludes liability for death or personal injury caused by negligence, or for fraud.
            </p>
            <p className="text-sm leading-relaxed mt-3">
              FineGuard compliance alerts are informational only. You remain solely responsible for ensuring your filings are made on time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Governing law</h2>
            <p className="text-sm leading-relaxed">
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Contact</h2>
            <p className="text-sm leading-relaxed">
              For legal and contractual enquiries, contact us at{' '}
              <a href="mailto:legal@ultai.group" className="text-[#5A4BFF] hover:underline">
                legal@ultai.group
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
