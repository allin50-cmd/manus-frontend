'use client'

import Link from 'next/link'

interface LauncherTileProps {
  title: string
  subtitle: string
  href: string
}

export default function LauncherTile({
  title,
  subtitle,
  href,
}: LauncherTileProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
    >
      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-2 text-sm text-white/60">
        {subtitle}
      </p>
    </Link>
  )
}

