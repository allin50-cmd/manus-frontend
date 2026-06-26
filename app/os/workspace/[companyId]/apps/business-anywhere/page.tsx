import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'
import BusinessAnywhereContent from '@/components/BusinessAnywhereContent'

export default function BusinessAnywhereWorkspacePage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  return <BusinessAnywhereContent companyId={params.companyId} companyName={company.name} />
}
