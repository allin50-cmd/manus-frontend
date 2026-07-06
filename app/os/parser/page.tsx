import AppShell from '@/components/os/layout/AppShell'
import ParserPlayground from '@/components/os/parser/ParserPlayground'

export default function ParserPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Parser Playground</h1>
          <p className="mt-2 text-white/60">
            Validate voice and text commands before connecting them to execution.
          </p>
        </div>

        <ParserPlayground />
      </div>
    </AppShell>
  )
}
