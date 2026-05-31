import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-[#07091a] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Brand + tagline */}
        <div className="mb-10">
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xl font-bold text-[#5A4BFF]">UltAi</span>
            <span className="text-xl font-bold text-gray-400">Group</span>
          </div>
          <p className="text-sm text-gray-500 max-w-md">
            AI-powered compliance, intake and document intelligence for UK professional services
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/fineguard" className="text-sm text-gray-500 hover:text-white transition-colors">
                  FineGuard
                </Link>
              </li>
              <li>
                <Link href="/vaultline" className="text-sm text-gray-500 hover:text-white transition-colors">
                  VaultLine
                </Link>
              </li>
              <li>
                <Link href="/ultai" className="text-sm text-gray-500 hover:text-white transition-colors">
                  UltAi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-500 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/team" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">
            © 2025 Accuracy Developments Ltd. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Registered in England &amp; Wales
          </p>
        </div>
      </div>
    </footer>
  );
}
