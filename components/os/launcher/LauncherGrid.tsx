'use client'

import LauncherTile from './LauncherTile'
import type { ModuleId } from '../icons/LauncherIcon'

const modules: {
  module: ModuleId
  title: string
  subtitle: string
  href: string
}[] = [
  {
    module: 'companies',
    title: 'Companies',
    subtitle: 'CRM & Compliance',
    href: '/portfolio',
  },
  {
    module: 'tasks',
    title: 'Tasks',
    subtitle: 'Today Workspace',
    href: '/today',
  },
  {
    module: 'money',
    title: 'Money',
    subtitle: 'Quotes & Invoices',
    href: '/os/money/quotes/new',
  },
  {
    module: 'contacts',
    title: 'Contacts',
    subtitle: 'People',
    href: '/contacts',
  },
  {
    module: 'messages',
    title: 'Messages',
    subtitle: 'Inbox',
    href: '/os/messages/new',
  },
  {
    module: 'calls',
    title: 'Calls',
    subtitle: 'Phone Log',
    href: '/os/calls/new',
  },
  {
    module: 'documents',
    title: 'Documents',
    subtitle: 'Files',
    href: '/os/documents/upload',
  },
  {
    module: 'alerts',
    title: 'Alerts',
    subtitle: 'Notifications',
    href: '/alerts',
  },
]

export default function LauncherGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {modules.map((module) => (
        <LauncherTile key={module.title} {...module} />
      ))}
    </div>
  )
}

