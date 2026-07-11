// Glossy gradient-tile icon system for the 8 fixed OS launcher modules.
// Reusable SVG, not screenshots — one definition per module id, referenced
// from both the Home Launcher tiles and (smaller) from module headers.
export type ModuleId =
  | 'money' | 'messages' | 'calls' | 'contacts'
  | 'alerts' | 'tasks' | 'companies' | 'documents'

const MODULE_STYLE: Record<ModuleId, { from: string; to: string; glyph: string }> = {
  money:     { from: '#F6C453', to: '#D9971F', glyph: '£' },
  messages:  { from: '#5AC8FA', to: '#2E86D6', glyph: '✉' },
  calls:     { from: '#4ADE80', to: '#1FA35A', glyph: '☎' },
  contacts:  { from: '#B18CFF', to: '#7C4FE0', glyph: '👤' },
  alerts:    { from: '#FFB454', to: '#E5811F', glyph: '!' },
  tasks:     { from: '#6EC1FF', to: '#2E7FD6', glyph: '✓' },
  companies: { from: '#7CA6E8', to: '#3E6BC2', glyph: '▦' },
  documents: { from: '#9AB4C9', to: '#5F7C93', glyph: '▤' },
}

export const MODULE_LABELS: Record<ModuleId, string> = {
  money: 'Money',
  messages: 'Messages',
  calls: 'Calls',
  contacts: 'Contacts',
  alerts: 'Alerts',
  tasks: 'Tasks',
  companies: 'Companies',
  documents: 'Documents',
}

interface LauncherIconProps {
  module: ModuleId
  size?: number
}

export default function LauncherIcon({ module, size = 56 }: LauncherIconProps) {
  const { from, to, glyph } = MODULE_STYLE[module]
  const gradientId = `grad-${module}`

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${gradientId}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="14" fill={`url(#${gradientId})`} />
      <rect width="56" height="28" rx="14" fill={`url(#${gradientId}-gloss)`} />
      <text
        x="28"
        y="36"
        textAnchor="middle"
        fontSize="24"
        fontWeight="600"
        fill="white"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {glyph}
      </text>
    </svg>
  )
}
