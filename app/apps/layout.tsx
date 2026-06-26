export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <a href="/apps" className="text-sm font-semibold text-gray-900">UltraTech Tools</a>
          <span className="text-xs text-gray-400">For UK Businesses</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <footer className="text-center py-6 text-xs text-gray-400">
        Powered by UltraTechOS
      </footer>
    </div>
  )
}
