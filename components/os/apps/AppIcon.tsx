const FALLBACK_ICONS: Record<string, string> = {
  fineguard: '🛡️',
  property: '🏠',
  vaultline: '🔒',
  autolawclerk: '⚖️',
  'smart-receptionist': '🎤',
}

interface AppIconProps {
  appId: string
  iconUrl?: string | null
  size?: number
}

export default function AppIcon({ appId, iconUrl, size = 40 }: AppIconProps) {
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  const emoji = FALLBACK_ICONS[appId] ?? '🧩'

  return (
    <div
      className="flex items-center justify-center rounded-xl bg-white/10"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  )
}
