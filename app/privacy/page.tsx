import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — FineGuard',
  description: 'How FineGuard collects, uses and protects your personal data.',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: June 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Who we are</h2>
            <p>FineGuard Limited is a company registered in England and Wales. We operate the FineGuard compliance monitoring service at this website. You can contact us at <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">What data we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Company information:</strong> company name and company number you enter when checking or subscribing.</li>
              <li><strong>Email address:</strong> provided during subscription checkout via Stripe, used to send you deadline alerts.</li>
              <li><strong>Payment information:</strong> handled entirely by Stripe. FineGuard never stores your card details.</li>
              <li><strong>Usage data:</strong> standard server logs (IP address, browser type, pages visited) retained for up to 90 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To monitor your Companies House deadlines and send you email alerts.</li>
              <li>To process your subscription payment via Stripe.</li>
              <li>To contact you directly if your company status requires urgent attention.</li>
              <li>To improve the reliability and accuracy of the FineGuard service.</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Legal basis for processing</h2>
            <p>We process your data on the basis of contract performance (to deliver the service you have subscribed to) and legitimate interests (to improve service reliability). Where you have provided explicit consent, we rely on that consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Data retention</h2>
            <p>We retain your subscription data for as long as your subscription is active and for up to 2 years after cancellation for legal compliance purposes. You may request deletion at any time by emailing <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Your rights</h2>
            <p>Under UK GDPR, you have the right to access, correct, delete, or restrict processing of your personal data. You also have the right to data portability and to object to processing. To exercise any of these rights, contact us at <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>.</p>
            <p className="mt-3">You have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk" className="text-[#00A86B] hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Cookies</h2>
            <p>FineGuard uses a single session cookie to keep you signed in to your account. We do not use third-party tracking cookies or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Stripe:</strong> payment processing. See <a href="https://stripe.com/gb/privacy" className="text-[#00A86B] hover:underline" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.</li>
              <li><strong>Companies House:</strong> we query the public Companies House API to retrieve filing deadline data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Contact</h2>
            <p>For any privacy-related questions, email <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/" className="text-[#00A86B] hover:underline text-sm">← Back to FineGuard</Link>
        </div>
      </main>
    </div>
  )
}
