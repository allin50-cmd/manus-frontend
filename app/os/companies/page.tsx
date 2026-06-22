import Link from 'next/link'

// Shared gradient defs for company SVG icons
function CompanyGradDefs() {
  return (
    <svg style={{ display: 'none' }} aria-hidden>
      <defs>
        <linearGradient id="cc-fg" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#80F5C8" />
          <stop offset="50%" stopColor="#00C880" />
          <stop offset="100%" stopColor="#005C38" />
        </linearGradient>
        <linearGradient id="cc-bbj" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#FFE080" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#7C2800" />
        </linearGradient>
        <linearGradient id="cc-ut" x1="20%" y1="5%" x2="80%" y2="95%">
          <stop offset="0%" stopColor="#90C8FF" />
          <stop offset="50%" stopColor="#3D8BFF" />
          <stop offset="100%" stopColor="#003080" />
        </linearGradient>
        <radialGradient id="cc-acc" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#D4A8FF" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
      </defs>
    </svg>
  )
}

const COMPANIES = [
  {
    href: '/os/companies/fineguard',
    name: 'FineGuard',
    desc: 'Compliance monitoring SaaS',
    status: 'Active',
    statusBg: '#D1FAE5',
    statusColor: '#065F46',
    gradBg: 'linear-gradient(135deg,#064E3B,#065F46)',
    icon: (
      // Shield SVG
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
        <path
          d="M18 3L7 8V17C7 23 12 28.5 18 31C24 28.5 29 23 29 17V8L18 3Z"
          fill="url(#cc-fg)"
        />
        <path
          d="M14 18L17 21L23 14"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  },
  {
    href: '/os/companies/builder-big-jobs',
    name: 'Builder Big Jobs',
    desc: 'Construction leads pipeline',
    status: 'Active',
    statusBg: '#FFEDD5',
    statusColor: '#9A3412',
    gradBg: 'linear-gradient(135deg,#7C2D12,#C2410C)',
    icon: (
      // Crane SVG
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
        <rect x="16.5" y="5" width="3" height="17" rx="1.2" fill="url(#cc-bbj)" />
        <rect x="5" y="5.5" width="26" height="4" rx="2" fill="url(#cc-bbj)" />
        <line x1="28" y1="9.5" x2="28" y2="18" stroke="rgba(255,220,80,0.8)" strokeWidth="1.5" />
        <path d="M25.5 18C25.5 18 25.5 20.5 27.5 21.5" stroke="rgba(255,220,80,0.9)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <rect x="6" y="27" width="24" height="4" rx="2" fill="url(#cc-bbj)" opacity="0.65" />
      </svg>
    ),
  },
  {
    href: '/os/companies/ultratech',
    name: 'Ultratech',
    desc: 'Operations · Internal tools',
    status: 'Internal',
    statusBg: '#DBEAFE',
    statusColor: '#1E40AF',
    gradBg: 'linear-gradient(135deg,#1E3A5F,#1D4ED8)',
    icon: (
      // Lightning bolt SVG
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
        <path
          d="M21 4L8 20H18L15 32L28 16H18L21 4Z"
          fill="url(#cc-ut)"
        />
      </svg>
    ),
  },
  {
    href: '/os/companies/accuracy',
    name: 'Accuracy Developments',
    desc: 'Planning leads · Projects',
    status: 'Pipeline',
    statusBg: '#EDE9FE',
    statusColor: '#5B21B6',
    gradBg: 'linear-gradient(135deg,#4C1D95,#6D28D9)',
    icon: (
      // Target SVG
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="13" stroke="url(#cc-acc)" strokeWidth="2.5" fill="none" />
        <circle cx="18" cy="18" r="8" stroke="url(#cc-acc)" strokeWidth="2" fill="none" />
        <circle cx="18" cy="18" r="3.5" fill="url(#cc-acc)" />
        <line x1="18" y1="5" x2="18" y2="9" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="27" x2="18" y2="31" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="5" y1="18" x2="9" y2="18" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="27" y1="18" x2="31" y2="18" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function CompaniesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <CompanyGradDefs />

      {/* Header */}
      <div className="px-5 py-5">
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="text-slate-500 text-sm mt-1">Your operating entities</p>
      </div>

      <div className="px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMPANIES.map((co) => (
            <Link
              key={co.href}
              href={co.href}
              className="block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Gradient header bar */}
              <div
                className="flex items-center gap-4 px-4 py-4"
                style={{ background: co.gradBg }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {co.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base leading-tight">{co.name}</div>
                  <div className="text-xs text-white opacity-70 mt-0.5 truncate">{co.desc}</div>
                </div>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-xs text-slate-500">Workspace</div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: co.statusBg, color: co.statusColor }}
                >
                  {co.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
