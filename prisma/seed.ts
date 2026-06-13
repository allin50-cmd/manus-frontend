import { PrismaClient, WorkItemType, WorkItemStatus, Priority, RecipientRole, DeliveryChannel, DecisionStatus, ActionType } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding FineGuard demo data...')

  // ── Companies ────────────────────────────────────────────────────────────────
  const companies = await Promise.all([
    db.company.upsert({ where: { name: 'Acme Manufacturing Ltd' }, update: {}, create: { name: 'Acme Manufacturing Ltd' } }),
    db.company.upsert({ where: { name: 'Bright Futures Consulting Ltd' }, update: {}, create: { name: 'Bright Futures Consulting Ltd' } }),
    db.company.upsert({ where: { name: 'Tech Corp Solutions Ltd' }, update: {}, create: { name: 'Tech Corp Solutions Ltd' } }),
    db.company.upsert({ where: { name: 'Sunset Retail Group Ltd' }, update: {}, create: { name: 'Sunset Retail Group Ltd' } }),
    db.company.upsert({ where: { name: 'Northern Properties Ltd' }, update: {}, create: { name: 'Northern Properties Ltd' } }),
    db.company.upsert({ where: { name: 'GreenLeaf Catering Ltd' }, update: {}, create: { name: 'GreenLeaf Catering Ltd' } }),
    db.company.upsert({ where: { name: 'Apex Legal Services Ltd' }, update: {}, create: { name: 'Apex Legal Services Ltd' } }),
    db.company.upsert({ where: { name: 'Blue Wave Digital Ltd' }, update: {}, create: { name: 'Blue Wave Digital Ltd' } }),
  ])

  const [acme, bright, tech, sunset, northern, greenleaf, apex, bluewave] = companies
  console.log(`  Created ${companies.length} companies`)

  // ── Contacts ─────────────────────────────────────────────────────────────────
  await db.contact.createMany({
    skipDuplicates: true,
    data: [
      { companyId: acme.id,      name: 'James Acton',     role: 'Director',    email: 'james@acme-mfg.co.uk',        phone: '+44 7700 900101', isPrimary: true },
      { companyId: acme.id,      name: 'Priya Sharma',    role: 'Accountant',  email: 'priya@acme-mfg.co.uk',        phone: '', isPrimary: false },
      { companyId: bright.id,    name: 'Emma Wilson',     role: 'Director',    email: 'emma@brightfutures.co.uk',    phone: '+44 7700 900202', isPrimary: true },
      { companyId: bright.id,    name: 'Tom Briggs',      role: 'Accountant',  email: 'tom@brightfutures.co.uk',     phone: '', isPrimary: false },
      { companyId: bright.id,    name: 'Sarah Chen',      role: 'Director',    email: 'sarah@brightfutures.co.uk',   phone: '+44 7700 900203', isPrimary: false },
      { companyId: tech.id,      name: 'Raj Patel',       role: 'Director',    email: 'raj@techcorpsolutions.co.uk', phone: '+44 7700 900303', isPrimary: true },
      { companyId: sunset.id,    name: 'Claire Hughes',   role: 'Director',    email: 'claire@sunsetretail.co.uk',   phone: '+44 7700 900401', isPrimary: true },
      { companyId: sunset.id,    name: 'David Moore',     role: 'Accountant',  email: 'david@sunsetretail.co.uk',    phone: '', isPrimary: false },
      { companyId: northern.id,  name: 'Fiona MacLeod',   role: 'Director',    email: 'fiona@northernprops.co.uk',   phone: '+44 7700 900501', isPrimary: true },
      { companyId: northern.id,  name: 'Liam Walsh',      role: 'Director',    email: 'liam@northernprops.co.uk',    phone: '+44 7700 900502', isPrimary: false },
      { companyId: greenleaf.id, name: 'Ana Costa',       role: 'Director',    email: 'ana@greenleafcatering.co.uk', phone: '+44 7700 900601', isPrimary: true },
      { companyId: apex.id,      name: 'Michael Okafor',  role: 'Director',    email: 'michael@apexlegal.co.uk',     phone: '+44 7700 900701', isPrimary: true },
      { companyId: apex.id,      name: 'Hannah Rees',     role: 'Accountant',  email: 'hannah@apexlegal.co.uk',      phone: '', isPrimary: false },
      { companyId: bluewave.id,  name: 'Zara Ahmed',      role: 'Director',    email: 'zara@bluewavedigital.co.uk',  phone: '+44 7700 900801', isPrimary: true },
    ],
  })
  console.log('  Created contacts')

  // ── Alert recipients ──────────────────────────────────────────────────────────
  const george = await db.alertRecipient.create({
    data: {
      company: 'ALL',
      name: 'George',
      email: 'george@firm.co.uk',
      phone: '+44 7700 900123',
      role: RecipientRole.ComplianceManager,
      preferredChannel: DeliveryChannel.Email,
      alertCategories: ['CompaniesHouseAccounts', 'CompaniesHouseConfirmation', 'GeneralCompliance'],
      escalationLevel: 1,
    },
  })

  await db.alertRecipient.createMany({
    data: [
      {
        company: 'Acme Manufacturing Ltd',
        name: 'James Acton',
        email: 'james@acme-mfg.co.uk',
        phone: '+44 7700 900101',
        role: RecipientRole.Director,
        preferredChannel: DeliveryChannel.Email,
        alertCategories: ['CompaniesHouseAccounts', 'CompaniesHouseConfirmation'],
        escalationLevel: 2,
      },
      {
        company: 'Bright Futures Consulting Ltd',
        name: 'Emma Wilson',
        email: 'emma@brightfutures.co.uk',
        role: RecipientRole.Director,
        preferredChannel: DeliveryChannel.Email,
        alertCategories: ['CompaniesHouseAccounts', 'CompaniesHouseConfirmation'],
        escalationLevel: 2,
      },
      {
        company: 'Northern Properties Ltd',
        name: 'Fiona MacLeod',
        email: 'fiona@northernprops.co.uk',
        phone: '+44 7700 900501',
        role: RecipientRole.Director,
        preferredChannel: DeliveryChannel.Email,
        alertCategories: ['CompaniesHouseAccounts'],
        escalationLevel: 2,
      },
    ],
  })
  console.log('  Created alert recipients')

  // ── Work items (compliance filings) ──────────────────────────────────────────
  const now = new Date()
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000)

  const workItems = [
    // Overdue
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Annual Accounts — Acme Manufacturing Ltd',
      company: 'Acme Manufacturing Ltd',
      owner: 'George',
      status: WorkItemStatus.Escalated,
      priority: Priority.Urgent,
      dueDate: daysFromNow(-8),
      decisionNeeded: false,
      notes: 'FY ended 31 Mar 2025. Accounts overdue — Companies House penalty risk.',
    },
    // Due soon
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Confirmation Statement — Bright Futures Consulting Ltd',
      company: 'Bright Futures Consulting Ltd',
      owner: 'George',
      status: WorkItemStatus.FollowUpDue,
      priority: Priority.High,
      dueDate: daysFromNow(15),
      decisionNeeded: false,
      notes: 'Annual review date 14 Jun. CS01 required.',
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Director Appointment (AP01) — Tech Corp Solutions Ltd',
      company: 'Tech Corp Solutions Ltd',
      owner: 'George',
      status: WorkItemStatus.FollowUpDue,
      priority: Priority.High,
      dueDate: daysFromNow(7),
      decisionNeeded: false,
      notes: 'New director Sarah Chen appointed 06 Jun. Must file AP01 within 14 days.',
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'PSC Change (PSC04) — Bright Futures Consulting Ltd',
      company: 'Bright Futures Consulting Ltd',
      owner: 'George',
      status: WorkItemStatus.InProgress,
      priority: Priority.High,
      dueDate: daysFromNow(12),
      decisionNeeded: true,
      notes: 'PSC details updated. Filing required within 14 days of change.',
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Annual Accounts — Tech Corp Solutions Ltd',
      company: 'Tech Corp Solutions Ltd',
      owner: 'George',
      status: WorkItemStatus.InProgress,
      priority: Priority.Medium,
      dueDate: daysFromNow(27),
      decisionNeeded: false,
      notes: 'FY ended 31 Oct 2025.',
    },
    // Upcoming
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Confirmation Statement — GreenLeaf Catering Ltd',
      company: 'GreenLeaf Catering Ltd',
      owner: 'George',
      status: WorkItemStatus.Captured,
      priority: Priority.Medium,
      dueDate: daysFromNow(45),
      decisionNeeded: false,
      notes: 'Annual review date 14 Jul.',
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Confirmation Statement — Sunset Retail Group Ltd',
      company: 'Sunset Retail Group Ltd',
      owner: 'George',
      status: WorkItemStatus.Captured,
      priority: Priority.Low,
      dueDate: daysFromNow(63),
      decisionNeeded: false,
      notes: '',
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Annual Accounts — Blue Wave Digital Ltd',
      company: 'Blue Wave Digital Ltd',
      owner: 'George',
      status: WorkItemStatus.Captured,
      priority: Priority.Low,
      dueDate: daysFromNow(110),
      decisionNeeded: false,
      notes: 'FY ended 31 Mar 2026. New client.',
    },
    // OK / on track
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Annual Accounts — Northern Properties Ltd',
      company: 'Northern Properties Ltd',
      owner: 'George',
      status: WorkItemStatus.Controlled,
      priority: Priority.Low,
      dueDate: daysFromNow(170),
      decisionNeeded: false,
      notes: 'FY ended 28 Feb 2026.',
    },
    {
      type: WorkItemType.ComplianceAlert,
      title: 'Confirmation Statement — Apex Legal Services Ltd',
      company: 'Apex Legal Services Ltd',
      owner: 'George',
      status: WorkItemStatus.Controlled,
      priority: Priority.Low,
      dueDate: daysFromNow(190),
      decisionNeeded: false,
      notes: '',
    },
  ]

  const created: { id: string; title: string; status: string }[] = []
  for (const item of workItems) {
    const wi = await db.workItem.create({ data: item })
    await db.activityLog.create({
      data: {
        workItemId: wi.id,
        person: 'System',
        eventType: 'Created',
        summary: `Compliance item "${wi.title}" created`,
        newStatus: wi.status,
      },
    })
    created.push(wi)
  }
  console.log(`  Created ${created.length} work items`)

  // ── Actions on the overdue item ───────────────────────────────────────────────
  const overdueWi = created[0]
  await db.action.create({
    data: {
      workItemId: overdueWi.id,
      actionType: ActionType.EscalateToGeorge,
      label: 'Escalate overdue accounts to George',
      status: 'Done',
      assignedTo: 'George',
      completedAt: daysFromNow(-7),
    },
  })
  await db.action.create({
    data: {
      workItemId: overdueWi.id,
      actionType: ActionType.CreateFollowUp,
      label: 'Chase accountant for signed accounts',
      status: 'Open',
      assignedTo: 'George',
      dueDate: daysFromNow(1),
    },
  })
  await db.activityLog.create({
    data: {
      workItemId: overdueWi.id,
      person: 'System',
      eventType: 'StatusChanged',
      summary: 'Status escalated to Escalated — accounts overdue',
      oldStatus: 'Captured',
      newStatus: 'Escalated',
    },
  })

  // ── Decision on PSC item ──────────────────────────────────────────────────────
  const pscWi = created[3]
  await db.decision.create({
    data: {
      workItemId: pscWi.id,
      question: 'Should we file the PSC04 directly with Companies House or engage the company\'s accountant to file?',
      options: 'Option A: File directly via our Companies House WebFiling account (faster, £0 cost)\nOption B: Instruct client accountant to file (slower, client pays their accountant fee)',
      recommendation: 'File directly — deadline is tight (12 days), accountant turnaround risk is high.',
      decisionBy: 'George',
      status: DecisionStatus.Open,
      dueDate: daysFromNow(5),
    },
  })
  console.log('  Created decision')

  // ── Alert deliveries (simulated history) ─────────────────────────────────────
  await db.alertDelivery.create({
    data: {
      workItemId: overdueWi.id,
      recipientId: george.id,
      channel: DeliveryChannel.Email,
      status: 'Sent',
      sentAt: daysFromNow(-7),
      escalationLevel: 1,
    },
  })
  await db.alertDelivery.create({
    data: {
      workItemId: overdueWi.id,
      recipientId: george.id,
      channel: DeliveryChannel.Email,
      status: 'Sent',
      sentAt: daysFromNow(-3),
      escalationLevel: 2,
    },
  })
  console.log('  Created alert deliveries')

  // ── Templates ─────────────────────────────────────────────────────────────────
  await db.template.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Annual Accounts reminder',
        useCase: 'Companies House — Annual Accounts',
        body: `Dear [Director name],

This is a reminder that the Annual Accounts for [Company name] are due for filing at Companies House by [due date].

Filing reference: AA
Companies House number: [CH number]

Please ensure your accountant submits the accounts before the deadline. Late filing will result in an automatic penalty starting at £150 for private companies.

If you have already filed or appointed an accountant to file, please confirm so we can update our records.

Kind regards
FineGuard Compliance`,
      },
      {
        name: 'Confirmation Statement reminder',
        useCase: 'Companies House — Confirmation Statement',
        body: `Dear [Director name],

Your annual Confirmation Statement (CS01) for [Company name] is due by [due date].

This is a free filing that confirms your company information on the Companies House register is up to date. Failure to file may result in Companies House striking off your company.

Filing reference: CS01
Companies House number: [CH number]

Please log in to your Companies House WebFiling account or contact us to file on your behalf.

Kind regards
FineGuard Compliance`,
      },
      {
        name: 'Director change (AP01)',
        useCase: 'Companies House — Director Change',
        body: `Dear [Director name],

We note that a new director has been appointed at [Company name]. Under the Companies Act 2006, you must notify Companies House within 14 days of the appointment.

Filing reference: AP01 (Appointment of Director)
New director: [Name]
Appointment date: [Date]
Filing deadline: [Due date]

Please file promptly to avoid late-filing issues.

Kind regards
FineGuard Compliance`,
      },
      {
        name: 'PSC change (PSC04)',
        useCase: 'Companies House — PSC Change',
        body: `Dear [Director name],

We understand that there has been a change to the Persons with Significant Control (PSC) register for [Company name]. This must be reported to Companies House within 14 days.

Filing reference: PSC04
Companies House number: [CH number]
Deadline: [Due date]

Failure to keep the PSC register up to date is a criminal offence. Please act promptly.

Kind regards
FineGuard Compliance`,
      },
      {
        name: 'Overdue escalation',
        useCase: 'Escalation — overdue filing',
        body: `URGENT: Filing overdue — [Company name]

Filing type: [Type]
Original due date: [Date]
Days overdue: [N]

Companies House penalty: £[amount]

Immediate action required. Please contact [company contact] today to resolve.

Action taken to date:
[Notes]

Recommended next step:
[ ] File immediately via WebFiling
[ ] Engage accountant urgently
[ ] Apply for extension (if applicable)`,
      },
      {
        name: 'Handoff to George',
        useCase: 'Internal escalation',
        body: `Company:
CH Number:
Filing type:
Due date:
Contact name:
Contact email:

What happened:
What they need:
Risk if not acted:
Recommended next step:
Decision needed from George:
Follow-up date:`,
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
    ],
  })
  console.log('  Created templates')

  console.log('\n✅ Seed complete — FineGuard demo data loaded')
  console.log(`   ${companies.length} companies, ${workItems.length} compliance items, 1 open decision`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
