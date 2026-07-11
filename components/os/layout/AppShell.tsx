'use client'

import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-[#0b1020] text-white overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 pb-20 sm:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}

