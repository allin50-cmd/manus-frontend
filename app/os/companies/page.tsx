import Link from 'next/link'

const COMPANIES = [
  {
    href: '/os/companies/fineguard',
    name: 'FineGuard',
    emoji: '🛡',
    desc: 'Compliance protection · Monitoring · Alerts',
    color: '#00A86B',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  {
    href: '/os/companies/builder-big-jobs',
    name: 'Builder Big Jobs',
    emoji: '🏗',
    desc: 'Construction leads · Qualified prospects',
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  {
    href: '/os/companies/ultratech',
    name: 'Ultratech',
    emoji: '⚙',
    desc: 'Operations · Projects · Communications',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    href: '/os/companies/accuracy',
    name: 'Accuracy Developments',
    emoji: '🏢',
    desc: 'Planning leads · Projects · Site Visits',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
]

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
        <p className="text-slate-500 text-sm mt-1">Your operating entities</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COMPANIES.map((co) => (
          <Link
            key={co.href}
            href={co.href}
            className="block rounded-2xl p-6 border transition-all hover:shadow-md hover:scale-[1.01]"
            style={{ background: co.bg, borderColor: co.border }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: `${co.color}15` }}
              >
                {co.emoji}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">{co.name}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{co.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
