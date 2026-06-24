import Link from 'next/link'

const PRIORITIES = [
  { label: 'FineGuard renewal call overdue', tag: 'Money', tagColor: '#FFC145', href: '/os/money' },
  { label: 'BBJ pipeline review due today', tag: 'Work', tagColor: '#3D8BFF', href: '/os/tasks' },
  { label: 'Accuracy Ltd proposal to send', tag: 'Work', tagColor: '#3D8BFF', href: '/os/tasks' },
]

const ACTIVITY = [
  { time: '9:14 am', text: 'Clare Webb replied to renewal quote', area: 'Messages', href: '/os/messages' },
  { time: '8:50 am', text: 'BBJ lead James Hartley — new enquiry', area: 'Companies', href: '/os/companies' },
  { time: 'Yesterday', text: 'FineGuard invoice £4,800 unpaid (14 days)', area: 'Money', href: '/os/money' },
]

const QUICK_LINKS = [
  { label: 'Money', href: '/os/money', color: '#FFC145' },
  { label: 'Companies', href: '/os/companies', color: '#7A5AF8' },
  { label: 'Contacts', href: '/os/contacts', color: '#A855F7' },
  { label: 'Work', href: '/os/tasks', color: '#3D8BFF' },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-widest mb-2"
      style={{ color: 'rgba(255,255,255,0.28)' }}
    >
      {children}
    </p>
  )
}

export default function TodayPage() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{dateStr}</p>
        <h1 className="text-xl font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.92)' }}>
          Today
        </h1>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: q.color, boxShadow: `0 0 6px ${q.color}80` }}
            />
            <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {q.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Priorities */}
      <div>
        <SectionLabel>Priorities</SectionLabel>
        <Card>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {PRIORITIES.map((p, i) => (
              <Link
                key={i}
                href={p.href}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 transition-opacity hover:opacity-75"
              >
                <span className="text-sm font-medium pr-3" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  {p.label}
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: `${p.tagColor}22`, color: p.tagColor }}
                >
                  {p.tag}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity */}
      <div>
        <SectionLabel>Activity</SectionLabel>
        <Card>
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {ACTIVITY.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 transition-opacity hover:opacity-75"
              >
                <span
                  className="text-[10px] shrink-0 mt-0.5 w-14 text-right"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {a.time}
                </span>
                <div className="min-w-0">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>{a.text}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.area}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* OS link */}
      <div className="pt-1">
        <Link
          href="/os"
          className="text-xs transition-colors"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          onMouseOver={undefined}
        >
          ← Ultratech OS Home
        </Link>
      </div>
    </div>
  )
}
