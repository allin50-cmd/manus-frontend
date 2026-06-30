'use client'

import { useRouter } from 'next/navigation'

export default function PortalNav() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="bg-[#0B1F3A] px-5 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <a href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-[#00A86B] rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">FineGuard</span>
      </a>
      <div className="flex items-center gap-5">
        <a href="/check" className="text-slate-300 hover:text-white text-sm font-medium transition-colors hidden sm:block">
          Check a Company
        </a>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  )
}
