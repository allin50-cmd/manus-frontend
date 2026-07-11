export default function AppPermissionList({ permissions }: { permissions: string[] }) {
  if (permissions.length === 0) {
    return <p className="text-sm text-white/40">No permissions granted.</p>
  }

  return (
    <ul className="space-y-1.5">
      {permissions.map((permission) => (
        <li key={permission} className="flex items-center gap-2 text-sm text-white/70">
          <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
          <code className="font-mono text-xs">{permission}</code>
        </li>
      ))}
    </ul>
  )
}
