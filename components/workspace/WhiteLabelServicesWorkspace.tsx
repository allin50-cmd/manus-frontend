'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'

type ClientStatus = 'lead' | 'onboarding' | 'active' | 'paused' | 'cancelled'
type LegalStatus = 'missing' | 'partial' | 'complete' | 'expired'
type DeploymentStatus = 'not started' | 'in progress' | 'ready' | 'live'
type BillingStatus = 'pending' | 'active' | 'overdue' | 'cancelled'

type Section = 'dashboard' | 'clients' | 'packages' | 'branding' | 'legal' | 'deployment' | 'billing' | 'documents'

interface WhiteLabelClient {
  id: string
  clientName: string
  companyName: string
  contactName: string
  email: string
  phone: string
  website: string
  address: string
  industry: string
  status: ClientStatus
  notes: string
  createdAt: string
}

interface WhiteLabelPackage {
  id: string
  clientId: string
  packageName: string
  monthlyFee: number
  setupFee: number
  includedUsers: number
  includedWorkspaces: number
  customDomainEnabled: boolean
  brandedPdfsEnabled: boolean
  clientPortalEnabled: boolean
  supportLevel: string
  notes: string
  createdAt: string
}

interface BrandingSettings {
  id: string
  clientId: string
  productName: string
  logoFilename: string
  primaryColour: string
  secondaryColour: string
  pdfHeaderText: string
  pdfFooterText: string
  hideUltraTechBranding: boolean
  showPoweredByUltraTechOS: boolean
  createdAt: string
}

interface LegalPack {
  id: string
  clientId: string
  resellerAgreement: boolean
  dataProcessingAgreement: boolean
  termsUploaded: boolean
  privacyPolicyUploaded: boolean
  slaUploaded: boolean
  insuranceUploaded: boolean
  renewalDate: string
  status: LegalStatus
  createdAt: string
}

interface DeploymentChecklist {
  id: string
  clientId: string
  domain: string
  vercelProjectName: string
  supabaseProjectName: string
  environmentVariablesReady: boolean
  brandingApplied: boolean
  emailTemplatesReady: boolean
  testUserCreated: boolean
  qaPassed: boolean
  goLiveDate: string
  status: DeploymentStatus
  createdAt: string
}

interface BillingSetup {
  id: string
  clientId: string
  packageId: string
  monthlyFee: number
  setupFee: number
  billingStartDate: string
  paymentMethod: string
  invoiceContact: string
  status: BillingStatus
  createdAt: string
}

interface Activity {
  id: string
  type: string
  timestamp: string
  description: string
}

interface WorkspaceState {
  clients: WhiteLabelClient[]
  packages: WhiteLabelPackage[]
  brands: BrandingSettings[]
  legalPacks: LegalPack[]
  deployments: DeploymentChecklist[]
  billings: BillingSetup[]
  activities: Activity[]
}

const STORAGE_KEY = 'ultratech:white-label-services-state'

const seedState: WorkspaceState = {
  clients: [
    {
      id: 'wl-client-1',
      clientName: 'BuildRight Ltd',
      companyName: 'BuildRight Construction',
      contactName: 'Alice Johnson',
      email: 'alice@buildright.co.uk',
      phone: '020 7946 0001',
      website: 'https://buildright.co.uk',
      address: '10 Canary Wharf, London E14',
      industry: 'Construction',
      status: 'active',
      notes: 'UltraTech OS white-label pilot client.',
      createdAt: new Date().toISOString(),
    },
  ],
  packages: [
    {
      id: 'wl-pkg-1',
      clientId: 'wl-client-1',
      packageName: 'BuildRight Platform',
      monthlyFee: 1500,
      setupFee: 3000,
      includedUsers: 50,
      includedWorkspaces: 10,
      customDomainEnabled: true,
      brandedPdfsEnabled: true,
      clientPortalEnabled: true,
      supportLevel: 'Priority',
      notes: 'Construction operations bundle.',
      createdAt: new Date().toISOString(),
    },
  ],
  brands: [
    {
      id: 'wl-brand-1',
      clientId: 'wl-client-1',
      productName: 'BuildRight Workspace',
      logoFilename: 'buildright-logo.png',
      primaryColour: '#003366',
      secondaryColour: '#ff6600',
      pdfHeaderText: 'BuildRight Platform',
      pdfFooterText: 'Powered by UltraTech OS',
      hideUltraTechBranding: false,
      showPoweredByUltraTechOS: true,
      createdAt: new Date().toISOString(),
    },
  ],
  legalPacks: [
    {
      id: 'wl-leg-1',
      clientId: 'wl-client-1',
      resellerAgreement: true,
      dataProcessingAgreement: true,
      termsUploaded: true,
      privacyPolicyUploaded: true,
      slaUploaded: false,
      insuranceUploaded: true,
      renewalDate: '2027-12-31',
      status: 'partial',
      createdAt: new Date().toISOString(),
    },
  ],
  deployments: [
    {
      id: 'wl-deploy-1',
      clientId: 'wl-client-1',
      domain: 'workspace.buildright.co.uk',
      vercelProjectName: 'buildright-platform',
      supabaseProjectName: 'buildright-db',
      environmentVariablesReady: true,
      brandingApplied: true,
      emailTemplatesReady: false,
      testUserCreated: true,
      qaPassed: false,
      goLiveDate: '2026-08-01',
      status: 'in progress',
      createdAt: new Date().toISOString(),
    },
  ],
  billings: [
    {
      id: 'wl-bill-1',
      clientId: 'wl-client-1',
      packageId: 'wl-pkg-1',
      monthlyFee: 1500,
      setupFee: 3000,
      billingStartDate: '2026-07-01',
      paymentMethod: 'Direct Debit',
      invoiceContact: 'finance@buildright.co.uk',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  activities: [],
}

function loadState(): WorkspaceState {
  if (typeof window === 'undefined') return seedState
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState
    return { ...seedState, ...JSON.parse(raw) }
  } catch {
    return seedState
  }
}

function text(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}

function money(value: FormDataEntryValue | null) {
  return Number(text(value)) || 0
}

function checked(form: FormData, name: string) {
  return form.get(name) === 'true'
}

function Field({ name, label, type = 'text', required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      <input name={name} type={type} required={required} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" />
    </label>
  )
}

function Checkbox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/70">
      <input name={name} value="true" type="checkbox" />
      {label}
    </label>
  )
}

function Select({ name, label, children }: { name: string; label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      <select name={name} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white">
        {children}
      </select>
    </label>
  )
}

function PrintButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20">
      {children}
    </button>
  )
}

export default function WhiteLabelServicesWorkspace() {
  const [section, setSection] = useState<Section>('dashboard')
  const [state, setState] = useState<WorkspaceState>(seedState)

  useEffect(() => {
    setState(loadState())
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  function update(mutator: (current: WorkspaceState) => WorkspaceState, activityType: string, description: string) {
    setState((current) => {
      const next = mutator(current)
      return {
        ...next,
        activities: [
          ...next.activities,
          { id: `act-${Date.now()}`, type: activityType, timestamp: new Date().toISOString(), description },
        ].slice(-50),
      }
    })
  }

  const clientsById = useMemo(() => new Map(state.clients.map((client) => [client.id, client])), [state.clients])
  const packagesById = useMemo(() => new Map(state.packages.map((pkg) => [pkg.id, pkg])), [state.packages])

  const metrics = {
    totalClients: state.clients.length,
    activeClients: state.clients.filter((client) => client.status === 'active').length,
    mrr: state.billings.filter((billing) => billing.status === 'active').reduce((sum, billing) => sum + billing.monthlyFee, 0),
    setupFees: state.billings.reduce((sum, billing) => sum + billing.setupFee, 0),
    deploymentsReady: state.deployments.filter((deployment) => deployment.status === 'ready').length,
    legalComplete: state.legalPacks.filter((legal) => legal.status === 'complete').length,
    overdueBilling: state.billings.filter((billing) => billing.status === 'overdue').length,
    pendingOnboarding: state.clients.filter((client) => client.status === 'onboarding').length,
  }

  function printHtml(title: string, id: string, body: string) {
    const popup = window.open('', '_blank', 'width=900,height=700')
    if (!popup) {
      window.alert('Popup blocked. Please allow popups for this site to view the document.')
      return
    }
    popup.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:auto;padding:40px;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}.muted{color:#666}</style></head><body>${body}<hr/><p class="muted"><em>Generated for operational setup. Legal review recommended before use.</em></p></body></html>`)
    popup.document.close()
    popup.print()
    update((current) => current, 'WhiteLabelPackPrinted', `Printed ${title} (${id})`)
  }

  function printClientPack(clientId: string) {
    const client = clientsById.get(clientId)
    if (!client) return
    const brand = state.brands.find((item) => item.clientId === clientId)
    const pkg = state.packages.find((item) => item.clientId === clientId)
    const legal = state.legalPacks.find((item) => item.clientId === clientId)
    const deployment = state.deployments.find((item) => item.clientId === clientId)
    const billing = state.billings.find((item) => item.clientId === clientId)
    printHtml(
      'White Label Client Pack',
      clientId,
      `<h1>UltraTech OS</h1><h2>White Label Client Pack</h2><p><strong>Client:</strong> ${client.clientName}</p><p><strong>Company:</strong> ${client.companyName}</p><p><strong>Contact:</strong> ${client.contactName}</p><p><strong>Email:</strong> ${client.email}</p><p><strong>Website:</strong> ${client.website}</p><h3>Package</h3><p>${pkg?.packageName ?? 'Not configured'} — £${pkg?.monthlyFee ?? 0}/month</p><h3>Branding</h3><p>${brand?.productName ?? 'Not configured'}</p><h3>Legal</h3><p>${legal?.status ?? 'Not configured'}</p><h3>Deployment</h3><p>${deployment?.domain ?? 'Not configured'} — ${deployment?.status ?? ''}</p><h3>Billing</h3><p>${billing?.status ?? 'Not configured'}</p><p>Signature: ______________________________</p>`,
    )
  }

  function printDeploymentChecklist(id: string) {
    const deployment = state.deployments.find((item) => item.id === id)
    if (!deployment) return
    const client = clientsById.get(deployment.clientId)
    printHtml(
      'Deployment Checklist',
      id,
      `<h1>UltraTech OS</h1><h2>Deployment Checklist</h2><p><strong>Client:</strong> ${client?.clientName ?? deployment.clientId}</p><p><strong>Domain:</strong> ${deployment.domain}</p><p><strong>Vercel:</strong> ${deployment.vercelProjectName}</p><p><strong>Supabase:</strong> ${deployment.supabaseProjectName}</p><ul><li>Environment variables ready: ${deployment.environmentVariablesReady ? 'Yes' : 'No'}</li><li>Branding applied: ${deployment.brandingApplied ? 'Yes' : 'No'}</li><li>Email templates ready: ${deployment.emailTemplatesReady ? 'Yes' : 'No'}</li><li>Test user created: ${deployment.testUserCreated ? 'Yes' : 'No'}</li><li>QA passed: ${deployment.qaPassed ? 'Yes' : 'No'}</li></ul><p><strong>Go live:</strong> ${deployment.goLiveDate}</p><p><strong>Status:</strong> ${deployment.status}</p><p>Signature: ______________________________</p>`,
    )
  }

  function printLegalPackChecklist() {
    const rows = state.legalPacks.map((legal) => `<tr><td>${clientsById.get(legal.clientId)?.clientName ?? legal.clientId}</td><td>${legal.status}</td><td>${legal.resellerAgreement ? 'Yes' : 'No'}</td><td>${legal.dataProcessingAgreement ? 'Yes' : 'No'}</td><td>${legal.slaUploaded ? 'Yes' : 'No'}</td><td>${legal.renewalDate}</td></tr>`).join('')
    printHtml('Legal Pack Checklist', 'all', `<h1>UltraTech OS</h1><h2>Legal Pack Checklist</h2><table><thead><tr><th>Client</th><th>Status</th><th>Reseller</th><th>DPA</th><th>SLA</th><th>Renewal</th></tr></thead><tbody>${rows}</tbody></table>`)
  }

  function printBillingSummary(id: string) {
    const billing = state.billings.find((item) => item.id === id)
    if (!billing) return
    const client = clientsById.get(billing.clientId)
    const pkg = packagesById.get(billing.packageId)
    printHtml('Billing Summary', id, `<h1>UltraTech OS</h1><h2>Billing Summary</h2><p><strong>Client:</strong> ${client?.clientName ?? billing.clientId}</p><p><strong>Package:</strong> ${pkg?.packageName ?? billing.packageId}</p><p><strong>Monthly fee:</strong> £${billing.monthlyFee}</p><p><strong>Setup fee:</strong> £${billing.setupFee}</p><p><strong>Billing start:</strong> ${billing.billingStartDate}</p><p><strong>Payment method:</strong> ${billing.paymentMethod}</p><p><strong>Invoice contact:</strong> ${billing.invoiceContact}</p><p><strong>Status:</strong> ${billing.status}</p><p>Signature: ______________________________</p>`)
  }

  function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const client: WhiteLabelClient = {
      id: `wl-client-${Date.now()}`,
      clientName: text(form.get('clientName')),
      companyName: text(form.get('companyName')),
      contactName: text(form.get('contactName')),
      email: text(form.get('email')),
      phone: text(form.get('phone')),
      website: text(form.get('website')),
      address: text(form.get('address')),
      industry: text(form.get('industry')),
      status: text(form.get('status')) as ClientStatus,
      notes: text(form.get('notes')),
      createdAt: new Date().toISOString(),
    }
    update((current) => ({ ...current, clients: [...current.clients, client] }), 'WhiteLabelClientCreated', `Created client ${client.clientName}`)
    event.currentTarget.reset()
  }

  function addPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const pkg: WhiteLabelPackage = {
      id: `wl-pkg-${Date.now()}`,
      clientId: text(form.get('clientId')),
      packageName: text(form.get('packageName')),
      monthlyFee: money(form.get('monthlyFee')),
      setupFee: money(form.get('setupFee')),
      includedUsers: money(form.get('includedUsers')),
      includedWorkspaces: money(form.get('includedWorkspaces')),
      customDomainEnabled: checked(form, 'customDomainEnabled'),
      brandedPdfsEnabled: checked(form, 'brandedPdfsEnabled'),
      clientPortalEnabled: checked(form, 'clientPortalEnabled'),
      supportLevel: text(form.get('supportLevel')),
      notes: text(form.get('notes')),
      createdAt: new Date().toISOString(),
    }
    update((current) => ({ ...current, packages: [...current.packages, pkg] }), 'WhiteLabelPackageCreated', `Created package ${pkg.packageName}`)
    event.currentTarget.reset()
  }

  function saveBranding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const clientId = text(form.get('clientId'))
    const brand: BrandingSettings = {
      id: state.brands.find((item) => item.clientId === clientId)?.id ?? `wl-brand-${Date.now()}`,
      clientId,
      productName: text(form.get('productName')),
      logoFilename: text(form.get('logoFilename')),
      primaryColour: text(form.get('primaryColour')) || '#000000',
      secondaryColour: text(form.get('secondaryColour')) || '#ffffff',
      pdfHeaderText: text(form.get('pdfHeaderText')),
      pdfFooterText: text(form.get('pdfFooterText')),
      hideUltraTechBranding: checked(form, 'hideUltraTechBranding'),
      showPoweredByUltraTechOS: checked(form, 'showPoweredByUltraTechOS'),
      createdAt: new Date().toISOString(),
    }
    update((current) => ({ ...current, brands: [...current.brands.filter((item) => item.clientId !== clientId), brand] }), 'WhiteLabelBrandingSaved', `Saved branding for ${clientId}`)
    event.currentTarget.reset()
  }

  function addLegal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const legal: LegalPack = {
      id: `wl-leg-${Date.now()}`,
      clientId: text(form.get('clientId')),
      resellerAgreement: checked(form, 'resellerAgreement'),
      dataProcessingAgreement: checked(form, 'dataProcessingAgreement'),
      termsUploaded: checked(form, 'termsUploaded'),
      privacyPolicyUploaded: checked(form, 'privacyPolicyUploaded'),
      slaUploaded: checked(form, 'slaUploaded'),
      insuranceUploaded: checked(form, 'insuranceUploaded'),
      renewalDate: text(form.get('renewalDate')),
      status: text(form.get('status')) as LegalStatus,
      createdAt: new Date().toISOString(),
    }
    update((current) => ({ ...current, legalPacks: [...current.legalPacks, legal] }), 'WhiteLabelLegalPackAdded', `Added legal pack for ${legal.clientId}`)
    event.currentTarget.reset()
  }

  function addDeployment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const deployment: DeploymentChecklist = {
      id: `wl-deploy-${Date.now()}`,
      clientId: text(form.get('clientId')),
      domain: text(form.get('domain')),
      vercelProjectName: text(form.get('vercelProjectName')),
      supabaseProjectName: text(form.get('supabaseProjectName')),
      environmentVariablesReady: checked(form, 'environmentVariablesReady'),
      brandingApplied: checked(form, 'brandingApplied'),
      emailTemplatesReady: checked(form, 'emailTemplatesReady'),
      testUserCreated: checked(form, 'testUserCreated'),
      qaPassed: checked(form, 'qaPassed'),
      goLiveDate: text(form.get('goLiveDate')),
      status: text(form.get('status')) as DeploymentStatus,
      createdAt: new Date().toISOString(),
    }
    update((current) => ({ ...current, deployments: [...current.deployments, deployment] }), 'WhiteLabelDeploymentSaved', `Saved deployment for ${deployment.domain}`)
    event.currentTarget.reset()
  }

  function addBilling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const billing: BillingSetup = {
      id: `wl-bill-${Date.now()}`,
      clientId: text(form.get('clientId')),
      packageId: text(form.get('packageId')),
      monthlyFee: money(form.get('monthlyFee')),
      setupFee: money(form.get('setupFee')),
      billingStartDate: text(form.get('billingStartDate')),
      paymentMethod: text(form.get('paymentMethod')),
      invoiceContact: text(form.get('invoiceContact')),
      status: text(form.get('status')) as BillingStatus,
      createdAt: new Date().toISOString(),
    }
    update((current) => ({ ...current, billings: [...current.billings, billing] }), 'WhiteLabelBillingSaved', `Saved billing for ${billing.invoiceContact}`)
    event.currentTarget.reset()
  }

  const clientOptions = state.clients.map((client) => <option key={client.id} value={client.id}>{client.clientName}</option>)
  const packageOptions = state.packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.packageName}</option>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">White Label Services</h1>
        <p className="mt-2 text-white/60">Package, brand, deploy and bill UltraTech OS for clients and resellers.</p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-2">
        {(['dashboard', 'clients', 'packages', 'branding', 'legal', 'deployment', 'billing', 'documents'] as Section[]).map((item) => (
          <button key={item} onClick={() => setSection(item)} className={`rounded-full px-4 py-2 text-sm capitalize ${section === item ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
            {item}
          </button>
        ))}
      </nav>

      {section === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ['Total Clients', metrics.totalClients],
              ['Active Clients', metrics.activeClients],
              ['Monthly Recurring Revenue', `£${metrics.mrr}`],
              ['Setup Fees', `£${metrics.setupFees}`],
              ['Deployments Ready', metrics.deploymentsReady],
              ['Legal Packs Complete', metrics.legalComplete],
              ['Overdue Billing', metrics.overdueBilling],
              ['Pending Onboarding', metrics.pendingOnboarding],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold text-white">Activity</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {state.activities.slice(-6).reverse().map((activity) => <li key={activity.id}>{activity.description}</li>)}
              {state.activities.length === 0 && <li>No recent activity</li>}
            </ul>
          </div>
        </div>
      )}

      {section === 'clients' && (
        <WorkspaceSection title="Clients" form={<form onSubmit={addClient} className="grid gap-3"><Field name="clientName" label="Client name" required /><Field name="companyName" label="Company name" /><Field name="contactName" label="Contact name" /><Field name="email" label="Email" type="email" /><Field name="phone" label="Phone" /><Field name="website" label="Website" /><Field name="address" label="Address" /><Field name="industry" label="Industry" /><Select name="status" label="Status"><option value="lead">Lead</option><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></Select><label className="text-sm text-white/70">Notes<textarea name="notes" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" /></label><SubmitButton>Create client</SubmitButton></form>}>
          {state.clients.map((client) => <Card key={client.id} title={client.clientName} meta={`${client.companyName} · ${client.status}`} action={<PrintButton onClick={() => printClientPack(client.id)}>Print Client Pack</PrintButton>} />)}
        </WorkspaceSection>
      )}

      {section === 'packages' && (
        <WorkspaceSection title="Packages" form={<form onSubmit={addPackage} className="grid gap-3"><Select name="clientId" label="Client"><option value="">Select client</option>{clientOptions}</Select><Field name="packageName" label="Package name" required /><Field name="monthlyFee" label="Monthly fee" type="number" /><Field name="setupFee" label="Setup fee" type="number" /><Field name="includedUsers" label="Included users" type="number" /><Field name="includedWorkspaces" label="Included workspaces" type="number" /><Checkbox name="customDomainEnabled" label="Custom domain enabled" /><Checkbox name="brandedPdfsEnabled" label="Branded PDFs enabled" /><Checkbox name="clientPortalEnabled" label="Client portal enabled" /><Field name="supportLevel" label="Support level" /><label className="text-sm text-white/70">Notes<textarea name="notes" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white" /></label><SubmitButton>Create package</SubmitButton></form>}>
          {state.packages.map((pkg) => <Card key={pkg.id} title={pkg.packageName} meta={`£${pkg.monthlyFee}/mo · Setup £${pkg.setupFee} · ${clientsById.get(pkg.clientId)?.clientName ?? pkg.clientId}`} />)}
        </WorkspaceSection>
      )}

      {section === 'branding' && (
        <WorkspaceSection title="Branding" form={<form onSubmit={saveBranding} className="grid gap-3"><Select name="clientId" label="Client"><option value="">Select client</option>{clientOptions}</Select><Field name="productName" label="Product name" /><Field name="logoFilename" label="Logo filename" /><Field name="primaryColour" label="Primary colour" type="color" /><Field name="secondaryColour" label="Secondary colour" type="color" /><Field name="pdfHeaderText" label="PDF header text" /><Field name="pdfFooterText" label="PDF footer text" /><Checkbox name="hideUltraTechBranding" label="Hide UltraTech branding" /><Checkbox name="showPoweredByUltraTechOS" label="Show Powered by UltraTech OS" /><SubmitButton>Save branding</SubmitButton></form>}>
          {state.brands.map((brand) => <Card key={brand.id} title={brand.productName} meta={`${clientsById.get(brand.clientId)?.clientName ?? brand.clientId} · ${brand.primaryColour}`} />)}
        </WorkspaceSection>
      )}

      {section === 'legal' && (
        <WorkspaceSection title="Legal" form={<form onSubmit={addLegal} className="grid gap-3"><Select name="clientId" label="Client"><option value="">Select client</option>{clientOptions}</Select><Checkbox name="resellerAgreement" label="Reseller agreement uploaded" /><Checkbox name="dataProcessingAgreement" label="Data processing agreement uploaded" /><Checkbox name="termsUploaded" label="Terms uploaded" /><Checkbox name="privacyPolicyUploaded" label="Privacy policy uploaded" /><Checkbox name="slaUploaded" label="SLA uploaded" /><Checkbox name="insuranceUploaded" label="Insurance uploaded" /><Field name="renewalDate" label="Renewal date" type="date" /><Select name="status" label="Status"><option value="missing">Missing</option><option value="partial">Partial</option><option value="complete">Complete</option><option value="expired">Expired</option></Select><SubmitButton>Add legal pack</SubmitButton></form>} extra={<PrintButton onClick={printLegalPackChecklist}>Print Legal Pack Checklist</PrintButton>}>
          {state.legalPacks.map((legal) => <Card key={legal.id} title={clientsById.get(legal.clientId)?.clientName ?? legal.clientId} meta={`Legal pack: ${legal.status} · Renewal ${legal.renewalDate}`} />)}
        </WorkspaceSection>
      )}

      {section === 'deployment' && (
        <WorkspaceSection title="Deployment" form={<form onSubmit={addDeployment} className="grid gap-3"><Select name="clientId" label="Client"><option value="">Select client</option>{clientOptions}</Select><Field name="domain" label="Domain" /><Field name="vercelProjectName" label="Vercel project name" /><Field name="supabaseProjectName" label="Supabase project name" /><Checkbox name="environmentVariablesReady" label="Environment variables ready" /><Checkbox name="brandingApplied" label="Branding applied" /><Checkbox name="emailTemplatesReady" label="Email templates ready" /><Checkbox name="testUserCreated" label="Test user created" /><Checkbox name="qaPassed" label="QA passed" /><Field name="goLiveDate" label="Go-live date" type="date" /><Select name="status" label="Status"><option value="not started">Not started</option><option value="in progress">In progress</option><option value="ready">Ready</option><option value="live">Live</option></Select><SubmitButton>Save deployment</SubmitButton></form>}>
          {state.deployments.map((deployment) => <Card key={deployment.id} title={deployment.domain} meta={`${deployment.status} · ${clientsById.get(deployment.clientId)?.clientName ?? deployment.clientId}`} action={<PrintButton onClick={() => printDeploymentChecklist(deployment.id)}>Print Checklist</PrintButton>} />)}
        </WorkspaceSection>
      )}

      {section === 'billing' && (
        <WorkspaceSection title="Billing" form={<form onSubmit={addBilling} className="grid gap-3"><Select name="clientId" label="Client"><option value="">Select client</option>{clientOptions}</Select><Select name="packageId" label="Package"><option value="">Select package</option>{packageOptions}</Select><Field name="monthlyFee" label="Monthly fee" type="number" /><Field name="setupFee" label="Setup fee" type="number" /><Field name="billingStartDate" label="Billing start date" type="date" /><Field name="paymentMethod" label="Payment method" /><Field name="invoiceContact" label="Invoice contact" /><Select name="status" label="Status"><option value="pending">Pending</option><option value="active">Active</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></Select><SubmitButton>Save billing</SubmitButton></form>}>
          {state.billings.map((billing) => <Card key={billing.id} title={clientsById.get(billing.clientId)?.clientName ?? billing.clientId} meta={`£${billing.monthlyFee}/mo · ${billing.status}`} action={<PrintButton onClick={() => printBillingSummary(billing.id)}>Print Billing Summary</PrintButton>} />)}
        </WorkspaceSection>
      )}

      {section === 'documents' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">Documents</h2>
          <p className="mt-2 text-sm text-white/60">Printable packs for white-label onboarding and setup.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.clients.map((client) => <PrintButton key={client.id} onClick={() => printClientPack(client.id)}>Client Pack: {client.clientName}</PrintButton>)}
            <PrintButton onClick={printLegalPackChecklist}>Legal Pack Checklist</PrintButton>
            {state.deployments.map((deployment) => <PrintButton key={deployment.id} onClick={() => printDeploymentChecklist(deployment.id)}>Deployment: {deployment.domain}</PrintButton>)}
            {state.billings.map((billing) => <PrintButton key={billing.id} onClick={() => printBillingSummary(billing.id)}>Billing: {clientsById.get(billing.clientId)?.clientName ?? billing.clientId}</PrintButton>)}
          </div>
        </div>
      )}
    </div>
  )
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/85">{children}</button>
}

function Card({ title, meta, action }: { title: string; meta: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/60">{meta}</p>
        </div>
        {action}
      </div>
    </div>
  )
}

function WorkspaceSection({ title, form, children, extra }: { title: string; form: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <div className="mt-4">{form}</div>
        {extra && <div className="mt-4">{extra}</div>}
      </section>
      <section className="space-y-3">{children}</section>
    </div>
  )
}
