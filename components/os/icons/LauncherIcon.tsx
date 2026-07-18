// Glossy gradient-tile icon system for the 8 fixed OS launcher modules.
// A self-hosted glass tile (gradient + top gloss) with a crisp lucide glyph —
// no emoji, no external assets (the app CSP blocks external images). Referenced
// from the Home Launcher tiles and reusable from module headers.
import type { LucideIcon } from 'lucide-react'
import {
  PoundSterling,
  Mail,
  Phone,
  Users,
  Bell,
  CheckSquare,
  Building2,
  FileText,
} from 'lucide-react'

export type ModuleId =
  | 'money' | 'messages' | 'calls' | 'contacts'
  | 'alerts' | 'tasks' | 'companies' | 'documents'

const MODULE_STYLE: Record<ModuleId, { from: string; to: string; icon: LucideIcon }> = {
  money:     { from: '#F6C453', to: '#D9971F', icon: PoundSterling },
  messages:  { from: '#5AC8FA', to: '#2E86D6', icon: Mail },
  calls:     { from: '#4ADE80', to: '#1FA35A', icon: Phone },
  contacts:  { from: '#B18CFF', to: '#7C4FE0', icon: Users },
  alerts:    { from: '#FFB454', to: '#E5811F', icon: Bell },
  tasks:     { from: '#6EC1FF', to: '#2E7FD6', icon: CheckSquare },
  companies: { from: '#7CA6E8', to: '#3E6BC2', icon: Building2 },
  documents: { from: '#9AB4C9', to: '#5F7C93', icon: FileText },
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
  const { from, to, icon: Glyph } = MODULE_STYLE[module]

  return (
    <div
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden rounded-2xl"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 6px 16px -6px ${to}80`,
      }}
    >
      {/* Top gloss highlight for the glass-tile look */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0))',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Glyph
          color="white"
          strokeWidth={2.25}
          style={{ width: size * 0.46, height: size * 0.46 }}
        />
      </div>
    </div>
  )
}
