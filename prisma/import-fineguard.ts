import { PrismaClient, WorkItemStatus, Priority } from '@prisma/client'

const db = new PrismaClient()

interface FirmRecord {
  name: string
  tier: 1 | 2 | 3 | null
  address: string
  mlro: string | null
  email: string | null
  phone: string | null
  module: string
  firmNotes: string
}

function cleanContact(raw: string | null): string | null {
  if (!raw) return null
  if (raw.startsWith('(') && raw.endsWith(')')) return null
  return raw
}

function tierToPriority(tier: 1 | 2 | 3 | null): Priority {
  if (tier === 1) return Priority.Urgent
  if (tier === 2) return Priority.High
  return Priority.Medium
}

const firms: FirmRecord[] = [
  // ── Accountancy Tier 1 ──────────────────────────────────────────────
  { name: 'PwC', tier: 1, address: 'Embankment Place, London WC2N 6RH', mlro: '(Risk & Quality Div.)', email: 'newsdesk@accountancytoday.co.uk', phone: '020 7066 1000', module: 'Senior Manager Monitoring', firmNotes: 'Largest UK firm' },
  { name: 'Deloitte', tier: 1, address: '1 New Street Square, London EC4A 3HQ', mlro: '(Multiple Partners)', email: 'info@deloitte.co.uk', phone: '020 7007 0800', module: 'Senior Manager Monitoring', firmNotes: '1369 Partners' },
  { name: 'EY', tier: 1, address: '1 More London Place, London SE1 2AF', mlro: '(Multiple Partners)', email: 'info@ey.com', phone: '020 7951 2000', module: 'Senior Manager Monitoring', firmNotes: '1683 Partners' },
  { name: 'KPMG', tier: 1, address: '15 Canada Square, London E14 5GL', mlro: '(Multiple Partners)', email: 'info@kpmg.co.uk', phone: '020 7311 1000', module: 'Senior Manager Monitoring', firmNotes: '833 Partners' },
  { name: 'BDO', tier: 1, address: '55 Baker Street, London W1U 7EU', mlro: '(Multiple Partners)', email: 'enquiries@bdo.co.uk', phone: '020 7486 5888', module: 'Audit Quality & Monitoring', firmNotes: 'Statutory Auditor' },
  { name: 'Grant Thornton', tier: 1, address: '30 Finsbury Square, London EC2A 1AG', mlro: '(Internal ACSP Team)', email: 'enquiries@uk.gt.com', phone: '020 7383 5100', module: 'ACSP Identity Verification', firmNotes: 'Designated ACSP' },
  { name: 'RSM', tier: 1, address: '25 Farringdon Street, London EC4A 4AB', mlro: '(Partner Led)', email: 'info@rsmuk.com', phone: '020 7601 1842', module: 'Efficiency Maximizer', firmNotes: 'High revenue per partner' },
  { name: 'Forvis Mazars', tier: 1, address: '107 Cheapside, London EC2V 6DN', mlro: '(Partner Led)', email: 'info@mazars.co.uk', phone: '020 7377 4786', module: 'Senior Manager Monitoring', firmNotes: 'Large global presence' },
  { name: 'Xeinadin Group', tier: 1, address: '36-37 Old Jewry, London EC2R 8DD', mlro: '(Partner Led)', email: 'info@xeinadin.com', phone: '020 7600 0000', module: 'SME Fraud Defense', firmNotes: 'High SME client density' },
  { name: 'PKF Littlejohn', tier: 1, address: '15 Westferry Circus, London E14 4HD', mlro: '(Partner Led)', email: 'info@pkf-littlejohn.com', phone: '020 7516 2200', module: 'International Audit', firmNotes: 'High growth firm' },

  // ── Accountancy Tier 2 ──────────────────────────────────────────────
  { name: 'Blick Rothenberg', tier: 2, address: '16 Great Queen St, London WC2B 5AH', mlro: 'Nimesh Shah', email: 'info@blickrothenberg.com', phone: '020 7486 0111', module: 'UBO/KYC Monitoring', firmNotes: 'Specialist in HNW tax' },
  { name: 'BKL (incl. Wilson Wright)', tier: 2, address: '35 Ballards Lane, London N3 1XW', mlro: 'Karen Spencer-Smith', email: 'info@bkl.co.uk', phone: '020 8922 9222', module: 'Transaction Monitoring', firmNotes: 'Merged with Wilson Wright 2024' },
  { name: 'AAB', tier: 2, address: '131 Finsbury Pavement, London EC2A 1NT', mlro: '(Internal ACSP Team)', email: 'enquiries@aab.uk', phone: '020 3709 9061', module: 'ACSP Identity Verification', firmNotes: 'Established 1990' },
  { name: 'Haines Watts', tier: 2, address: 'London City HQ', mlro: '(Partner Led)', email: 'info@hwca.com', phone: '020 7309 3800', module: 'SME Fraud Defense', firmNotes: 'Wide London presence' },
  { name: 'CFOLogic', tier: 2, address: 'King Edwards Road, London E9', mlro: '(Partner Led)', email: 'contact@cfologic.co.uk', phone: '07460 032400', module: 'Digital Filing Module', firmNotes: 'Cloud-first firm' },

  // ── Accountancy Tier 3 ──────────────────────────────────────────────
  { name: 'CIGMA Accounting', tier: 3, address: 'Wimbledon / Farringdon', mlro: '(Partner Led)', email: 'info@cigma.co.uk', phone: '020 7000 0000', module: 'KYC Automation', firmNotes: 'Boutique firm leader' },

  // ── Law Firms ───────────────────────────────────────────────────────
  { name: 'Clifford Chance', tier: null, address: '10 Upper Bank St, London E14 5JJ', mlro: '(Compliance Team)', email: 'info@cliffordchance.com', phone: '020 7006 1000', module: 'AML/Sanctions', firmNotes: 'Large, Top tier global firm' },
  { name: 'A&O Shearman', tier: null, address: '65 Fleet St, London EC4Y 1HS', mlro: 'Bob Penn', email: 'bob.penn@aoshearman.com', phone: '020 3088 3000', module: 'Financial Regulatory', firmNotes: 'Large, Global Co-Head Regulatory' },
  { name: 'Linklaters', tier: null, address: '1 Silk Street, London EC2Y 8HQ', mlro: 'Richard Cumbley', email: 'info@linklaters.com', phone: '020 7456 2000', module: 'Data Protection/AML', firmNotes: 'Large, Band 1 Data Protection' },
  { name: 'BSB Solicitors', tier: null, address: '344-354 Gray\'s Inn Rd, London WC1X 8BP', mlro: 'Jonathan Black', email: 'jonathanb@bsbsolicitors.co.uk', phone: '020 7837 3456', module: 'AML Compliance', firmNotes: 'Boutique, Advise on POCA compliance' },
  { name: 'Corker Binning', tier: null, address: '30 Farringdon St, London EC4A 4AB', mlro: 'Peter Binning', email: 'pb@corkerbinning.com', phone: '020 7353 6000', module: 'Economic Crime', firmNotes: 'Boutique, Specialist AML firm' },
  { name: 'Howard Kennedy', tier: null, address: '1 London Bridge, London SE1 9BG', mlro: 'Ian Ryan', email: 'ian.ryan@howardkennedy.com', phone: '020 3755 5691', module: 'Regulatory Defense', firmNotes: 'Mid, Corporate sponsor for VCTs' },
  { name: 'Weightmans LLP', tier: null, address: '6 New Street Square, London EC4A 3BF', mlro: 'Michael Balmer', email: 'michael.balmer@weightmans.com', phone: '0345 073 9900', module: 'Legal Monitoring', firmNotes: 'Large, Regulation & Legal Director' },
  { name: 'HCR Law', tier: null, address: 'London Office', mlro: 'Ben Ticehurst', email: 'bticehurst@hcrlaw.com', phone: '020 3949 8297', module: 'AML Risk Specialist', firmNotes: 'Large, Regional powerhouse in London' },
  { name: 'Doyle Clayton', tier: null, address: 'Mary Sheridan House, London SE1', mlro: 'Piers Leigh-Pollitt', email: 'info@doyleclayton.co.uk', phone: '0118 951 6761', module: 'GDPR/Compliance', firmNotes: 'Mid, Compliance Officer Legal Practice' },

  // ── Wealth Management ───────────────────────────────────────────────
  { name: 'St James\'s Place', tier: null, address: 'London/Cirencester', mlro: '(Compliance Team)', email: 'info@sjp.co.uk', phone: '01285 640302', module: 'Wealth Protection', firmNotes: "UK's largest advice-led firm. AUM £179bn" },
  { name: 'Rathbones', tier: null, address: '8 Finsbury Circus, London EC2M 7AZ', mlro: 'Aaron Thomas Guilder', email: 'invest@rathbones.com', phone: '020 7399 0000', module: 'Trust & Tax', firmNotes: 'Merged with Brewin Dolphin. AUM £100bn' },
  { name: 'Evelyn Partners', tier: null, address: '45 Gresham St, London EC2V 7AY', mlro: '(Compliance Team)', email: 'contact@evelyn.com', phone: '020 7131 4000', module: 'Compliance Hygiene', firmNotes: 'High HNW tax focus. AUM £53bn' },
  { name: 'JTC Group', tier: null, address: 'London ICS Office', mlro: 'Lloyd Collier', email: 'info@jtcgroup.com', phone: '020 7408 9200', module: 'AML Officer Services', firmNotes: 'Senior Director UK/Ireland. AUM £50bn+' },
  { name: 'MET Capital', tier: null, address: 'London Office', mlro: 'Abhishek Praful Shah', email: 'info@metcapital.co.uk', phone: '020 3000 0000', module: 'Asset Compliance', firmNotes: 'Managing multiple fund entities' },
  { name: 'Willow Financial', tier: null, address: 'London Office', mlro: 'Aaron John Mears', email: 'contact@willowfp.co.uk', phone: '020 7000 0000', module: 'Onboarding/KYC', firmNotes: 'Client financial planning' },
]

async function main() {
  console.log(`Importing ${firms.length} FineGuard firms into SheetOps...`)
  let created = 0
  let skipped = 0

  for (const firm of firms) {
    const existing = await db.workItem.findFirst({ where: { company: firm.name } })
    if (existing) {
      console.log(`  SKIP  ${firm.name} (already exists)`)
      skipped++
      continue
    }

    const contact = cleanContact(firm.mlro)
    const priority = tierToPriority(firm.tier)
    const tierLabel = firm.tier ? `Tier ${firm.tier}` : 'Untiered'
    const notes = [
      `FineGuard module: ${firm.module}`,
      `${tierLabel}`,
      firm.address,
      firm.email ? `Email: ${firm.email}` : null,
      firm.phone ? `Phone: ${firm.phone}` : null,
      firm.firmNotes,
    ].filter(Boolean).join('\n')

    const item = await db.workItem.create({
      data: {
        type: 'Partnership',
        title: `${firm.name} — FineGuard outreach`,
        company: firm.name,
        contactName: contact,
        owner: 'Dagon',
        status: WorkItemStatus.Captured,
        priority,
        nextAction: `Send FineGuard outreach${contact ? ` to ${contact}` : ''} — ${firm.module}`,
        decisionNeeded: false,
        notes,
      },
    })

    await db.activityLog.create({
      data: {
        workItemId: item.id,
        person: 'System',
        eventType: 'Created',
        summary: `Imported from FineGuard Firms Database: ${firm.name}`,
        newStatus: WorkItemStatus.Captured,
      },
    })

    console.log(`  OK    ${firm.name} (${priority})`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped (already existed): ${skipped}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
