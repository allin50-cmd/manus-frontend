import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — FineGuard',
  description: 'Terms and conditions for using the FineGuard compliance monitoring service.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#00A86B] rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">FineGuard</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. The service</h2>
            <p>FineGuard Limited (&quot;FineGuard&quot;, &quot;we&quot;, &quot;us&quot;) provides a Companies House deadline monitoring service for UK company directors. We monitor publicly available Companies House data and send you email alerts before filing deadlines.</p>
            <p className="mt-3">FineGuard is an informational service. We are not a law firm, accountant, or regulated financial adviser. Our alerts do not constitute legal or accountancy advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Subscription and payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Subscriptions are charged at £4.99 per company per month.</li>
              <li>Payment is processed by Stripe. By subscribing, you agree to Stripe&apos;s terms of service.</li>
              <li>Subscriptions renew automatically each month until cancelled.</li>
              <li>You may cancel at any time. Cancellation takes effect at the end of your current billing period.</li>
              <li>We do not offer refunds for partial months unless required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. What we provide</h2>
            <p>When you subscribe, FineGuard will:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Monitor your company&apos;s Companies House filing deadlines.</li>
              <li>Send you email alerts approximately 30, 14 and 7 days before each deadline.</li>
              <li>Review Amber and Red status cases and contact you directly where required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Limitations</h2>
            <p>FineGuard monitors publicly available Companies House data. The accuracy of that data depends on Companies House. We are not liable for inaccuracies in the underlying Companies House register.</p>
            <p className="mt-3">FineGuard provides advance warnings. Meeting filing deadlines remains the legal responsibility of the company director. FineGuard is a monitoring and alert service, not a filing service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Liability</h2>
            <p>To the fullest extent permitted by law, FineGuard&apos;s liability for any claim arising from use of the service is limited to the total subscription fees paid by you in the 12 months preceding the claim.</p>
            <p className="mt-3">FineGuard is not liable for Companies House penalties incurred where we have sent timely alerts that were not acted upon.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Acceptable use</h2>
            <p>You may use FineGuard only for lawful purposes and in accordance with these terms. You agree not to use the service to monitor companies for which you have no legitimate interest.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Changes to these terms</h2>
            <p>We may update these terms from time to time. We will notify you by email before material changes take effect. Continued use of the service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Governing law</h2>
            <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Contact</h2>
            <p>FineGuard Limited · Registered in England and Wales</p>
            <p className="mt-1"><a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/" className="text-[#00A86B] hover:underline text-sm">← Back to FineGuard</Link>
        </div>
      </main>
    </div>
  )
}
