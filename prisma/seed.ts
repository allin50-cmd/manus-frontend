import { PrismaClient, WorkItemType, WorkItemStatus, Priority } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding work items...')

  const items = [
    {
      type: WorkItemType.Partnership,
      title: 'EasyEstimate partnership target',
      company: 'EasyEstimate',
      contactName: 'Paul Gosden',
      owner: 'Dagon',
      status: WorkItemStatus.Captured,
      priority: Priority.High,
      nextAction: 'Send soft partnership outreach',
      decisionNeeded: false,
    },
    {
      type: WorkItemType.Partnership,
      title: 'Price A Job partnership target',
      company: 'Price A Job',
      contactName: 'Vasyl Mateychuk',
      owner: 'Dagon',
      status: WorkItemStatus.Captured,
      priority: Priority.High,
      nextAction: 'Send soft integration pilot outreach',
      decisionNeeded: false,
    },
    {
      type: WorkItemType.Partnership,
      title: 'HBXL benchmark trial',
      company: 'HBXL',
      owner: 'George',
      status: WorkItemStatus.Controlled,
      priority: Priority.Medium,
      nextAction: 'Run one Accuracy quote through HBXL trial',
      decisionNeeded: false,
    },
    {
      type: WorkItemType.ConstructionLead,
      title: 'Local builder test',
      company: 'Local Builder Example',
      owner: 'Dagon',
      status: WorkItemStatus.Captured,
      priority: Priority.Medium,
      nextAction: 'Ask how many quotes they produce per month',
      decisionNeeded: false,
    },
    {
      type: WorkItemType.ConstructionLead,
      title: 'Accuracy Havelock Walk quote',
      company: 'Accuracy Developments Ltd',
      owner: 'Alissa',
      status: WorkItemStatus.Controlled,
      priority: Priority.High,
      nextAction: 'Clean quote figures and prepare review',
      decisionNeeded: false,
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'FineGuard alert workflow',
      company: 'FineGuard',
      owner: 'George',
      status: WorkItemStatus.Captured,
      priority: Priority.High,
      nextAction: 'Define alert recipient workflow',
      decisionNeeded: false,
    },
  ]

  for (const item of items) {
    const created = await db.workItem.create({ data: item })
    await db.activityLog.create({
      data: {
        workItemId: created.id,
        person: 'System',
        eventType: 'Created',
        summary: `Work item "${created.title}" created`,
        newStatus: created.status,
      },
    })
  }

  console.log('Seeding templates...')

  const templates = [
    {
      name: 'EasyEstimate outreach',
      useCase: 'Partnership outreach',
      body: `Hi Paul, we are testing a planning-lead-to-quote workflow for UK residential builders. We identify planning-approved jobs and help builders move from opportunity to priced quote faster. EasyEstimate looks like it could be a strong quoting engine in that chain. Would you be open to a short conversation about a referral, reseller or light integration pilot?`,
    },
    {
      name: 'Price A Job outreach',
      useCase: 'Partnership outreach',
      body: `Hi Vasyl, we are building a planning-to-quote workflow for UK residential builders. We already have planning-led opportunities and contractors who need faster pricing. Price A Job's estimating and compliance calculator suite looks like a strong fit. Would you be open to a short conversation about a referral or integration pilot?`,
    },
    {
      name: 'Builder outreach',
      useCase: 'Construction lead outreach',
      body: `We are testing a system that helps builders find suitable planning-approved jobs and turn them into quotes faster. We are not asking you to change how you work overnight. We would like to test one real job and see whether the workflow saves time.`,
    },
    {
      name: 'Architect outreach',
      useCase: 'Architect outreach',
      body: `We work with residential builders who need planning-approved job opportunities and faster quoting. We are testing a referral model with architects. Would you be open to a short conversation about how we could work together?`,
    },
    {
      name: 'Merchant outreach',
      useCase: 'Merchant outreach',
      body: `We are building a planning-to-quote workflow for UK residential builders. Builders in our network will be pricing live jobs. We would like to understand whether a merchant supply relationship could be built into that workflow.`,
    },
    {
      name: 'Handoff to George',
      useCase: 'Internal escalation',
      body: `Company:
Contact:
What happened:
What they need:
Commercial opportunity:
Risk:
Recommended next step:
Decision needed:
Follow-up date:`,
    },
    {
      name: 'No-go checklist',
      useCase: 'Qualification',
      body: `- unclear IP ownership
- no export/API path
- founder unwilling to support integration
- high support burden
- pricing data cannot be verified
- customer contracts prohibit resale/embedding
- unresolved shareholder dispute
- no GDPR/data-processing clarity`,
    },
    {
      name: 'Follow-up message',
      useCase: 'Follow-up',
      body: `Hi [name], following up on our conversation about [topic]. We are still interested and wanted to check whether you had any questions or whether the timing works for a next step.`,
    },
    {
      name: 'Call note format',
      useCase: 'Note taking',
      body: `Date:
Called:
Duration:
What they said:
What we said:
Their concern:
Our response:
Agreed next step:
Follow-up date:`,
    },
  ]

  for (const template of templates) {
    await db.template.create({ data: template })
  }

  console.log(`Seeded ${items.length} work items and ${templates.length} templates.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
