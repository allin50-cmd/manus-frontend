export type WorkspaceStatus = 'ready' | 'loading' | 'error'

export interface WorkspaceDefinition {
  id: string
  label: string
  href: string
  icon: string
  status: WorkspaceStatus
  commands: string[]
  publishes: string[]
  subscribes: string[]
  checklist: string[]
}

export const WORKSPACES: WorkspaceDefinition[] = [
  {
    id: 'todays-work',
    label: "Today's Work",
    href: '/workspace/todays-work',
    icon: '✅',
    status: 'ready',
    commands: ['start-job', 'complete-job'],
    publishes: ['JobStarted', 'JobCompleted', 'MaintenanceCompleted'],
    subscribes: ['JobAssigned', 'MaintenanceRaised', 'RentOverdue'],
    checklist: [
      'Loads workspace',
      'Receives MaintenanceRaised',
      'Receives RentOverdue',
      'Can start job',
      'Can complete job',
    ],
  },
  {
    id: 'property-management',
    label: 'Property Management',
    href: '/workspace/property-management',
    icon: '🏠',
    status: 'ready',
    commands: [
      'property.add',
      'tenant.add',
      'maintenance.raise',
      'rent.record',
      'document.upload',
      'inspection.book',
      'compliance.check',
      'rent.check',
      'tenant.onboard',
      'landlord.onboard',
      'reference.check',
      'tenancy.generate',
      'inventory.create',
      'legal.add',
    ],
    publishes: [
      'PropertyCreated',
      'TenantAdded',
      'MaintenanceRaised',
      'RentRecorded',
      'DocumentUploaded',
      'InspectionBooked',
      'ComplianceWarningCreated',
      'TenantOnboarded',
      'TenantReferenceChecked',
      'LandlordOnboarded',
      'TenancyAgreementGenerated',
      'InventoryCreated',
      'LegalDocumentAdded',
      'PDFGenerated',
    ],
    subscribes: ['DocumentExpiring', 'MaintenanceCompleted', 'RentOverdue'],
    checklist: [
      'Loads workspace',
      'Can raise maintenance',
      'Can check overdue rent',
      'Can generate forms',
      'Can print documents',
    ],
  },
  {
    id: 'white-label-services',
    label: 'White Label Services',
    href: '/workspace/white-label-services',
    icon: '🎨',
    status: 'ready',
    commands: [
      'whitelabel.client.create',
      'whitelabel.package.create',
      'whitelabel.branding.save',
      'whitelabel.legal.add',
      'whitelabel.deployment.save',
      'whitelabel.billing.save',
    ],
    publishes: [
      'WhiteLabelClientCreated',
      'WhiteLabelPackageCreated',
      'WhiteLabelBrandingSaved',
      'WhiteLabelLegalPackAdded',
      'WhiteLabelDeploymentSaved',
      'WhiteLabelBillingSaved',
      'WhiteLabelPackPrinted',
    ],
    subscribes: [],
    checklist: [
      'Loads workspace',
      'Can create client',
      'Can create package',
      'Can save branding',
      'Can print client/legal/deployment/billing packs',
    ],
  },
]

export function getWorkspace(id: string) {
  return WORKSPACES.find((workspace) => workspace.id === id)
}
