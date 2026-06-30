interface WorkspaceMessagesProps {
  companyName: string
}

export default function WorkspaceMessages({ companyName }: WorkspaceMessagesProps) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        This section will be available in Phase 4 Sprint 2+.
      </p>
    </div>
  )
}
