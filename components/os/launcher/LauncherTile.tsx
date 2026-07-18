'use client'

import Link from 'next/link'
import LauncherIcon, { type ModuleId } from '../icons/LauncherIcon'

interface LauncherTileProps {
  module: ModuleId
  title: string
  subtitle: string
  href: string
}

export default function LauncherTile({
  module,
  title,
  subtitle,
  href,
}: LauncherTileProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
    >
      <LauncherIcon module={module} size={48} />

      <h2 className="mt-4 text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-white/60">
        {subtitle}
      </p>
    </Link>
  )
}
