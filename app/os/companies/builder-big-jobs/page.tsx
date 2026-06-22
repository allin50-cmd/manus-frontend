import Link from 'next/link'

const COLOR = '#F97316'
const GRAD_FROM = '#FDB97A'
const GRAD_TO = '#C2410C'
const GLOW = 'rgba(249,115,22,0.45)'

const STATS = [
  { label: 'New Leads', value: '18', urgent: false, accent: COLOR },
  { label: 'Qualified', value: '7', urgent: false, accent: null },
  { label: 'Pipeline Value', value: '£124,000', urgent: false, accent: null },
  { label: 'Closed', value: '3', urgent: false, accent: null },
]

const SECTIONS = [
  {
    label: 'Leads',
    desc: '18 new this week',
    color: '#F97316',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    desc: '2 unread',
    color: '#20AFFF',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Tasks',
    desc: '5 pending',
    color: '#3D8BFF',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Documents',
    desc: '12 files',
    color: '#818CF8',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    desc: '1 warning',
    color: '#FF9F0A',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: 'Revenue',
    desc: '£1,400/mo',
    color: '#FFC145',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const ACTIVITY = [
  { text: 'New lead: 12-unit residential development, Manchester', color: COLOR, time: '1h ago' },
  { text: 'Lead qualified: Commercial extension, Birmingham', color: '#28C76F', time: '3h ago' },
  { text: 'Follow-up scheduled: Lonsdale Builders', color: '#3D8BFF', time: 'Yesterday' },
  { text: '2 new leads from Accuracy intake form', color: COLOR, time: '2d ago' },
  { text: 'Invoice raised: Roofing project referral', color: '#FFC145', time: '3d ago' },
]

export default function BuilderBigJobsPage() {
  return (
    <div className="space-y-6">
      {/* Company header card */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center gap-4 mb-4">
          {/* Company icon */}
          <div
            className="relative w-[56px] h-[56px] rounded-[18px] overflow-hidden flex items-center justify-center shrink-0"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${GRAD_FROM} 0%, ${COLOR} 50%, ${GRAD_TO} 100%)`,
              boxShadow: `0 12px 32px -6px ${GLOW}, inset 0 1.5px 0 rgba(255,255,255,0.45)`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0"
              style={{ height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)', borderRadius: '18px 18px 0 0' }}
            />
            <svg className="relative z-20 w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Builder Big Jobs</h1>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(40,199,111,0.15)', color: '#28C76F', border: '1px solid rgba(40,199,111,0.25)' }}
              >
                Active
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(249,115,22,0.15)', color: COLOR, border: `1px solid rgba(249,115,22,0.25)` }}
              >
                18 new leads this week
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Construction Leads</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="font-bold text-lg"
                style={{ color: stat.accent ? stat.accent : stat.urgent ? '#FF3B30' : 'rgba(255,255,255,0.9)' }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace sections */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>WORKSPACE</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {SECTIONS.map((section, i) => (
            <div
              key={section.label}
              className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${section.color}15`, border: `1px solid ${section.color}25`, color: section.color }}
              >
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>{section.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{section.desc}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>RECENT ACTIVITY</p>
        <div className="space-y-2">
          {ACTIVITY.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <div className="flex-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.text}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${GRAD_FROM}, ${GRAD_TO})` }}
        >
          View Leads
        </button>
        <button
          className="px-5 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }}
        >
          Add Lead
        </button>
      </div>
    </div>
  )
}
