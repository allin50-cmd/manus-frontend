import React from 'react';
import { useLocation } from 'wouter';
import { Shield, Github, Twitter, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingFooterProps {
  theme?: 'dark' | 'light';
}

export default function LandingFooter({ theme = 'dark' }: LandingFooterProps) {
  const [, setLocation] = useLocation();
  const isDark = theme === 'dark';

  const bg        = isDark ? 'bg-[#080A10] border-white/10' : 'bg-gray-100 border-gray-200';
  const headText  = isDark ? 'text-white'    : 'text-gray-900';
  const bodyText  = isDark ? 'text-gray-400' : 'text-gray-500';
  const linkText  = isDark ? 'text-gray-400 hover:text-white'  : 'text-gray-500 hover:text-gray-900';
  const divider   = isDark ? 'border-white/10' : 'border-gray-200';
  const iconBtn   = isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700';

  const col = (title: string, links: { label: string; href: string }[]) => (
    <div>
      <p className={cn('text-xs font-semibold uppercase tracking-wider mb-3', isDark ? 'text-gray-500' : 'text-gray-400')}>{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <button
              onClick={() => setLocation(l.href)}
              className={cn('text-sm transition-colors', linkText)}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className={cn('border-t', bg)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2">
            <button
              onClick={() => setLocation('/vaultline')}
              className={cn('flex items-center gap-2 font-bold text-lg mb-3', headText)}
            >
              <Shield className="w-5 h-5 text-[#5A4BFF]" />
              VaultLine Brand Suite
            </button>
            <p className={cn('text-sm leading-relaxed mb-4 max-w-xs', bodyText)}>
              Enterprise compliance and AI-powered legal solutions for modern law firms and businesses.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Github,   href: 'https://github.com' },
                { Icon: Twitter,  href: 'https://twitter.com' },
                { Icon: Linkedin, href: 'https://linkedin.com' },
              ].map(({ Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('transition-colors', iconBtn)}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {col('Products', [
            { label: 'VaultLine Cloud', href: '/vaultline' },
            { label: 'UltAi Intake',   href: '/ult-ai' },
            { label: 'FineGuard',      href: '/fineguard' },
          ])}

          {col('Company', [
            { label: 'About',     href: '/about' },
            { label: 'Team',      href: '/team' },
            { label: 'Pricing',   href: '/pricing' },
            { label: 'Book Demo', href: '/book-demo' },
          ])}

          {col('Resources', [
            { label: 'Dashboard',          href: '/dashboard' },
            { label: 'Audit Log',          href: '/audit-log' },
            { label: 'Compliance Bundle',  href: '/compliance-bundle' },
            { label: 'Intake Sheet',       href: '/intake-sheet' },
          ])}
        </div>

        <div className={cn('mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3', divider)}>
          <p className={cn('text-xs', bodyText)}>
            © {new Date().getFullYear()} VaultLine Brand Suite. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Privacy Policy', 'Terms of Service', 'Security'].map((item) => (
              <button key={item} className={cn('text-xs transition-colors', linkText)}>{item}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
