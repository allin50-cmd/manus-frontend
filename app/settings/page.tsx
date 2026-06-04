import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import ChangePasswordForm from './ChangePasswordForm'

export default async function SettingsPage() {
  const { person } = await requireAuth()

  return (
    <div className="space-y-5 max-w-sm">
      <div>
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Signed in as <strong>{person}</strong></p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Change password</h2>
        <ChangePasswordForm person={person} />
      </div>
    </div>
  )
}
