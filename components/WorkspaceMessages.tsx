interface WorkspaceMessagesProps {
  companyId: string
  companyName: string
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
}

export default function WorkspaceMessages({ companyName }: WorkspaceMessagesProps) {
  return (
    <div className="p-4 rounded-2xl" style={cardStyle}>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Messages for {companyName} aren&apos;t available yet — message threads
        aren&apos;t linked to a company in the data model, so there&apos;s
        nothing to scope this list to.
      </p>
    </div>
  )
}
