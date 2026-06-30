interface RecentActivityProps {
  companyId: string
  companyName: string
}

export default function RecentActivity({ companyId, companyName }: RecentActivityProps) {
  // Placeholder for future activity tracking
  // Shows empty state for now

  return (
    <section>
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.92)' }}>
        Recent Activity
      </h2>
      <div
        className="p-4 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>
          Activity tracking will appear here when workflow actions are logged.
        </p>
      </div>
    </section>
  )
}
