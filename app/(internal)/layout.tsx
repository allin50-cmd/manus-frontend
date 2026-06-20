import NavBar from '@/components/NavBar'

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">{children}</main>
    </div>
  )
}
