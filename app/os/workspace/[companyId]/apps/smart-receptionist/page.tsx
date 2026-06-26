import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import SmartReceptionistContent from '@/components/SmartReceptionistContent'

export default function SmartReceptionistWorkspacePage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  return <SmartReceptionistContent companyId={params.companyId} companyName={company.name} />
}
