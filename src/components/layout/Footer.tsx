import { Link } from 'wouter';
import { Shield, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { href: '/', label: 'FineGuard' },
    { href: '/vaultline', label: 'VaultLine Cloud' },
    { href: '/ultai', label: 'UltAi Intake' },
    { href: '/compliance-bundle', label: 'Compliance Bundle' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const companyLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/team', label: 'Our Team' },
    { href: '/contact', label: 'Contact' },
    { href: '/book-demo', label: 'Book a Demo' },
  ];

  const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/help', label: 'Help Center' },
  ];

  return (
    <footer className="bg-[#0A0B14] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-7 h-7 text-[#5A4BFF]" />
              <span className="text-lg font-black text-white">FineGuard</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
              Enterprise compliance monitoring and protection for UK businesses. Never miss a filing deadline again.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Github className="w-4 h-4" /></a>
              <a href="mailto:hello@fineguard.co.uk" className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Products</h3>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal & Support</h3>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">&copy; {currentYear} FineGuard Ltd. All rights reserved. Registered in England & Wales.</p>
          <p className="text-xs text-slate-600">Part of the VaultLine Brand Suite</p>
        </div>
      </div>
    </footer>
  );
}
