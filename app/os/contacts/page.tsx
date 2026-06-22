import Link from 'next/link'

const TEAM = [
  {
    name: 'George Thomas',
    initials: 'GT',
    role: 'Founder',
    avatarGrad: 'linear-gradient(135deg,#FFC145,#FF8A34)',
    messageHref: '/os/messages',
  },
  {
    name: 'Dagon Kalev',
    initials: 'DK',
    role: 'Sales',
    avatarGrad: 'linear-gradient(135deg,#20AFFF,#7A5AF8)',
    messageHref: '/os/messages',
  },
  {
    name: 'Alissa Marsh',
    initials: 'AM',
    role: 'Operations',
    avatarGrad: 'linear-gradient(135deg,#28C76F,#00A86B)',
    messageHref: '/os/messages',
  },
]

const KEY_CLIENTS = [
  {
    name: 'Clare Webb',
    company: 'FineGuard Ltd',
    initials: 'CW',
    dotColor: '#065F46',
    email: 'mailto:clare@fineguard.co.uk',
    phone: 'tel:+441234567890',
  },
  {
    name: 'James Hawkins',
    company: 'Hawk Construction',
    initials: 'JH',
    dotColor: '#C2410C',
    email: 'mailto:james@hawkconst.co.uk',
    phone: 'tel:+441234567892',
  },
  {
    name: 'Sarah Thornton',
    company: 'Accuracy Developments',
    initials: 'ST',
    dotColor: '#6D28D9',
    email: 'mailto:sarah@accuracy.co.uk',
    phone: 'tel:+441234567893',
  },
]

export default function ContactsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#4C1D95,#6D28D9)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <circle cx="23" cy="13" r="4.5" fill="rgba(255,255,255,0.5)" />
            <path d="M14 30C14 25.5 18 22.5 23 22.5C28 22.5 32 25.5 32 30" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="14" cy="14" r="5.5" fill="rgba(255,255,255,0.9)" />
            <path d="M4 30C4 25 8.5 21.5 14 21.5C19.5 21.5 24 25 24 30" fill="rgba(255,255,255,0.85)" />
          </svg>
        </div>
        <div>
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Module</div>
          <div className="text-2xl font-bold tracking-tight">Contacts</div>
          <div className="text-sm opacity-60 mt-0.5">Team · Clients · Partners</div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-8">
        {/* Team */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Team</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {TEAM.map((person, i) => (
              <div
                key={person.name}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < TEAM.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: person.avatarGrad }}
                >
                  {person.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900">{person.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{person.role}</div>
                </div>
                <Link
                  href={person.messageHref}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                  style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                >
                  ✉️ Message
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Key Clients */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Key Clients</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {KEY_CLIENTS.map((client, i) => (
              <div
                key={client.name}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < KEY_CLIENTS.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: client.dotColor }}
                >
                  {client.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900">{client.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{client.company}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a
                    href={client.phone}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                    style={{ background: '#D1FAE5', color: '#065F46' }}
                  >
                    📞 Call
                  </a>
                  <a
                    href={client.email}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                    style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                  >
                    ✉️ Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/os" className="block text-center text-xs text-slate-400 py-2">
          ← Back to Ultratech OS
        </Link>
      </div>
    </div>
  )
}
