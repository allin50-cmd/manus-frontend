import { useState } from 'react';
import { Link } from 'wouter';
import {
  HelpCircle, Search, Book, Shield, Bell, Building2, CreditCard,
  ChevronRight, ArrowRight, MessageSquare, Mail,
  Lock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePageTitle } from '../hooks/usePageTitle';

interface Article {
  title: string;
  snippet: string;
  category: string;
}

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: Book, color: 'text-blue-400' },
  { id: 'monitoring', label: 'Monitoring', icon: Shield, color: 'text-green-400' },
  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell, color: 'text-amber-400' },
  { id: 'companies', label: 'Companies', icon: Building2, color: 'text-purple-400' },
  { id: 'billing', label: 'Billing & Plans', icon: CreditCard, color: 'text-emerald-400' },
  { id: 'account', label: 'Account & Security', icon: Lock, color: 'text-red-400' },
];

const articles: Article[] = [
  { title: 'How to create your FineGuard account', snippet: 'Step-by-step guide to signing up and verifying your email address.', category: 'getting-started' },
  { title: 'Adding your first company to monitor', snippet: 'Learn how to add companies using their Companies House number.', category: 'getting-started' },
  { title: 'Understanding your compliance dashboard', snippet: 'A walkthrough of the main dashboard metrics and what they mean.', category: 'getting-started' },
  { title: 'How compliance monitoring works', snippet: 'FineGuard polls Companies House records multiple times daily to detect filing changes.', category: 'monitoring' },
  { title: 'What filings does FineGuard monitor?', snippet: 'We track annual accounts, confirmation statements, director changes, and more.', category: 'monitoring' },
  { title: 'Refreshing compliance data manually', snippet: 'How to trigger an on-demand compliance refresh for any monitored company.', category: 'monitoring' },
  { title: 'Setting up email alerts', snippet: 'Configure which compliance events trigger email notifications.', category: 'alerts' },
  { title: 'Understanding alert severity levels', snippet: 'Learn the difference between info, warning, and critical alerts.', category: 'alerts' },
  { title: 'Marking alerts as read', snippet: 'How to manage your alert inbox and mark items as read.', category: 'alerts' },
  { title: 'Looking up a company on Companies House', snippet: 'Use our built-in search to find any UK registered company.', category: 'companies' },
  { title: 'Removing a monitored company', snippet: 'How to stop monitoring a company and what happens to historical data.', category: 'companies' },
  { title: 'Understanding compliance status colours', snippet: 'Green means compliant, amber means warning, red means overdue or at risk.', category: 'companies' },
  { title: 'Adding or removing services', snippet: 'How to toggle individual alert services from the Billing page. Each service is £1/mo per company.', category: 'billing' },
  { title: 'Payment methods accepted', snippet: 'We accept all major credit/debit cards. Billing is managed through Stripe.', category: 'billing' },
  { title: 'Cancelling services', snippet: 'Remove any service at any time from the Billing page. Changes take effect immediately.', category: 'billing' },
  { title: 'Changing your password', snippet: 'Update your password from the Account Settings page.', category: 'account' },
  { title: 'Two-factor authentication', snippet: 'Enable 2FA for an additional layer of security on your account.', category: 'account' },
  { title: 'Managing team members', snippet: 'How to invite colleagues and assign roles within your account.', category: 'account' },
];

export default function Help() {
  usePageTitle('Help Centre');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = articles.filter((a) => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.snippet.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || a.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#5A4BFF]/10 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <HelpCircle className="w-12 h-12 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">Help Center</h1>
          <p className="text-lg text-slate-400 mb-10">Find answers to common questions about FineGuard</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5A4BFF]/50 focus:ring-2 focus:ring-[#5A4BFF]/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={clsx(
                  'flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center',
                  activeCategory === cat.id
                    ? 'bg-[#5A4BFF]/10 border-[#5A4BFF]/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/[0.07] hover:text-white'
                )}
              >
                <cat.icon className={clsx('w-6 h-6', activeCategory === cat.id ? 'text-[#5A4BFF]' : cat.color)} />
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-8 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-lg text-slate-400">No articles found matching your search.</p>
              <button onClick={() => { setSearch(''); setActiveCategory(null); }} className="text-[#5A4BFF] font-medium mt-2 hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((article) => {
                const cat = categories.find((c) => c.id === article.category);
                return (
                  <div key={article.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {cat && <cat.icon className={clsx('w-4 h-4', cat.color)} />}
                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{cat?.label}</span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#5A4BFF] transition-colors">{article.title}</h3>
                        <p className="text-sm text-slate-400">{article.snippet}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1 group-hover:text-[#5A4BFF] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <MessageSquare className="w-10 h-10 text-[#5A4BFF] mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-3">Still need help?</h2>
          <p className="text-slate-400 mb-8">Our support team is available Monday to Friday, 9am-6pm GMT.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A4BFF] text-white rounded-full font-bold hover:bg-[#6B5BFF] transition-colors">
              <Mail className="w-4 h-4" /> Contact Support
            </Link>
            <Link href="/book-demo" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/15 border border-white/20 transition-colors">
              Book a Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
