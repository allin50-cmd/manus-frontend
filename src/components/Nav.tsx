import { useLocation } from 'wouter';

const links = [
  { href: '/fineguard', label: 'FineGuard' },
  { href: '/vaultline', label: 'VaultLine' },
  { href: '/ultai', label: 'UltAi' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export default function Nav() {
  const [location, setLocation] = useLocation();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => setLocation('/')}
          className="font-bold text-white text-lg tracking-tight"
        >
          VaultLine Suite
        </button>
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => setLocation(href)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location === href || (href === '/fineguard' && location === '/')
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setLocation('/book-demo')}
          className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          Book Demo
        </button>
      </div>
    </nav>
  );
}
