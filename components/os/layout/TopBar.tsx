'use client'

export default function TopBar() {
  return (
    <header className="h-16 border-b border-white/10 bg-[#111827] flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold">
          UltraTech OS
        </h1>
      </div>

      <div className="text-sm text-white/60">
        AI Workspace
      </div>
    </header>
  )
}

