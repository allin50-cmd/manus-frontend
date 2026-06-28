import { redirect } from 'next/navigation'

export default function WorkspaceAppsPage({
  params,
}: {
  params: { companyId: string }
}) {
  redirect(`/os/workspace/${params.companyId}`)
}
