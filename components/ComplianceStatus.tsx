interface ComplianceStatusProps {
  companyId: string
}

export default function ComplianceStatus({ companyId }: ComplianceStatusProps) {
  // Placeholder for future FineGuard integration
  // Only show for FineGuard company
  if (companyId !== 'fineguard') return null

  return (
    <section>
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        Compliance Status
      </p>
      <div
        className="block p-4 rounded-2xl"
        style={{
          background: 'rgba(0,168,107,0.1)',
          border: '1px solid rgba(0,168,107,0.2)',
        }}
      >
        <p
          className="text-sm font-semibold"
          style={{ color: '#00A86B' }}
        >
          No pending deadlines
        </p>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          FineGuard monitoring will appear here when configured.
        </p>
      </div>
    </section>
  )
}
