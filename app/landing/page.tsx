import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FineGuard</h1>
          <nav className="flex gap-6">
            <Link href="/check" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Check Company
            </Link>
            <Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Pricing
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Never miss a Companies House deadline again
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Instant alerts on director changes, annual filings, confirmation statements, and more. Stay compliant, stay ahead.
          </p>
          <Link
            href="/check"
            className="inline-block bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            Search Companies
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Why FineGuard?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real-time Alerts',
                description: 'Get notified instantly when changes happen to monitored companies.',
                icon: '⚡'
              },
              {
                title: 'Compliance Made Easy',
                description: 'Never miss a filing deadline or director change notification.',
                icon: '✓'
              },
              {
                title: 'Affordable Monitoring',
                description: 'Track unlimited companies for just £1/month per alert type.',
                icon: '£'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search', description: 'Find any UK company by name or number' },
              { step: '2', title: 'Select Alerts', description: 'Choose which changes you want to monitor' },
              { step: '3', title: 'Get Notified', description: 'Receive instant alerts via email and dashboard' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Simple Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Starter',
                price: 'Free',
                features: ['Monitor up to 2 companies', 'Email alerts only', 'Limited to 1 alert type']
              },
              {
                name: 'Professional',
                price: '£1/month',
                features: ['Unlimited companies', 'All alert types', 'Real-time notifications', 'Dashboard access'],
                highlighted: true
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-lg border-2 transition ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white border-blue-600 dark:border-blue-500'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-3">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2 rounded-lg font-semibold transition ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500'
                  }`}
                >
                  {plan.highlighted ? 'Get Started' : 'Learn More'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to stay compliant?</h2>
          <p className="text-lg mb-8 opacity-90">Start monitoring companies for free today</p>
          <Link
            href="/check"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Try Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">FineGuard</h4>
              <p className="text-sm">Companies House compliance made simple.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/check" className="hover:text-white">Search</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-sm text-center">
            <p>&copy; 2025 FineGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
