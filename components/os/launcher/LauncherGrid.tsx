'use client'

import LauncherTile from './LauncherTile'

const modules = [
  {
    title: 'Workspaces',
    subtitle: 'Command Centre',
    href: '/workspace',
  },
  {
    title: 'White Label',
    subtitle: 'Clients & Resellers',
    href: '/workspace/white-label-services',
  },
  {
    title: 'Companies',
    subtitle: 'CRM & Compliance',
    href: '/portfolio',
  },
  {
    title: 'Tasks',
    subtitle: 'Today Workspace',
    href: '/today',
  },
  {
    title: 'Money',
    subtitle: 'Quotes & Invoices',
    href: '/os/money/quotes/new',
  },
  {
    title: 'Contacts',
    subtitle: 'People',
    href: '/contacts',
  },
  {
    title: 'Messages',
    subtitle: 'Inbox',
    href: '/os/messages/new',
  },
  {
    title: 'Calls',
    subtitle: 'Phone Log',
    href: '/os/calls/new',
  },
  {
    title: 'Documents',
    subtitle: 'Files',
    href: '/os/documents/upload',
  },
  {
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
