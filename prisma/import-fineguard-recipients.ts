import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface FirmRecord {
  name: string
  mlro: string | null
  email: string | null
  phone: string | null
  module: string
}

function cleanContact(raw: string | null): string | null {
  if (!raw) return null
  if (raw.startsWith('(') && raw.endsWith(')')) return null
  return raw
}

// Same firm list as import-fineguard.ts — source of truth for MLRO/contact data
const firms: FirmRecord[] = [
  // ── Accountancy Tier 1 ──────────────────────────────────────────────
  { name: 'PwC', mlro: '(Risk & Quality Div.)', email: 'newsdesk@accountancytoday.co.uk', phone: '020 7066 1000', module: 'Senior Manager Monitoring' },
  { name: 'Deloitte', mlro: '(Multiple Partners)', email: 'info@deloitte.co.uk', phone: '020 7007 0800', module: 'Senior Manager Monitoring' },
  { name: 'EY', mlro: '(Multiple Partners)', email: 'info@ey.com', phone: '020 7951 2000', module: 'Senior Manager Monitoring' },
  { name: 'KPMG', mlro: '(Multiple Partners)', email: 'info@kpmg.co.uk', phone: '020 7311 1000', module: 'Senior Manager Monitoring' },
  { name: 'BDO', mlro: '(Multiple Partners)', email: 'enquiries@bdo.co.uk', phone: '020 7486 5888', module: 'Audit Quality & Monitoring' },
  { name: 'Grant Thornton', mlro: '(Internal ACSP Team)', email: 'enquiries@uk.gt.com', phone: '020 7383 5100', module: 'ACSP Identity Verification' },
  { name: 'RSM', mlro: '(Partner Led)', email: 'info@rsmuk.com', phone: '020 7601 1842', module: 'Efficiency Maximizer' },
  { name: 'Forvis Mazars', mlro: '(Partner Led)', email: 'info@mazars.co.uk', phone: '020 7377 4786', module: 'Senior Manager Monitoring' },
  { name: 'Xeinadin Group', mlro: '(Partner Led)', email: 'info@xeinadin.com', phone: '020 7600 0000', module: 'SME Fraud Defense' },
  { name: 'PKF Littlejohn', mlro: '(Partner Led)', email: 'info@pkf-littlejohn.com', phone: '020 7516 2200', module: 'International Audit' },

  // ── Accountancy Tier 2 ──────────────────────────────────────────────
  { name: 'Blick Rothenberg', mlro: 'Nimesh Shah', email: 'info@blickrothenberg.com', phone: '020 7486 0111', module: 'UBO/KYC Monitoring' },
  { name: 'BKL (incl. Wilson Wright)', mlro: 'Karen Spencer-Smith', email: 'info@bkl.co.uk', phone: '020 8922 9222', module: 'Transaction Monitoring' },
  { name: 'AAB', mlro: '(Internal ACSP Team)', email: 'enquiries@aab.uk', phone: '020 3709 9061', module: 'ACSP Identity Verification' },
  { name: 'Haines Watts', mlro: '(Partner Led)', email: 'info@hwca.com', phone: '020 7309 3800', module: 'SME Fraud Defense' },
  { name: 'CFOLogic', mlro: '(Partner Led)', email: 'contact@cfologic.co.uk', phone: '07460 032400', module: 'Digital Filing Module' },

  // ── Accountancy Tier 3 ──────────────────────────────────────────────
  { name: 'CIGMA Accounting', mlro: '(Partner Led)', email: 'info@cigma.co.uk', phone: '020 7000 0000', module: 'KYC Automation' },

  // ── Law Firms ───────────────────────────────────────────────────────
  { name: 'Clifford Chance', mlro: '(Compliance Team)', email: 'info@cliffordchance.com', phone: '020 7006 1000', module: 'AML/Sanctions' },
  { name: 'A&O Shearman', mlro: 'Bob Penn', email: 'bob.penn@aoshearman.com', phone: '020 3088 3000', module: 'Financial Regulatory' },
  { name: 'Linklaters', mlro: 'Richard Cumbley', email: 'info@linklaters.com', phone: '020 7456 2000', module: 'Data Protection/AML' },
  { name: 'BSB Solicitors', mlro: 'Jonathan Black', email: 'jonathanb@bsbsolicitors.co.uk', phone: '020 7837 3456', module: 'AML Compliance' },
  { name: 'Corker Binning', mlro: 'Peter Binning', email: 'pb@corkerbinning.com', phone: '020 7353 6000', module: 'Economic Crime' },
  { name: 'Howard Kennedy', mlro: 'Ian Ryan', email: 'ian.ryan@howardkennedy.com', phone: '020 3755 5691', module: 'Regulatory Defense' },
  { name: 'Weightmans LLP', mlro: 'Michael Balmer', email: 'michael.balmer@weightmans.com', phone: '0345 073 9900', module: 'Legal Monitoring' },
  { name: 'HCR Law', mlro: 'Ben Ticehurst', email: 'bticehurst@hcrlaw.com', phone: '020 3949 8297', module: 'AML Risk Specialist' },
  { name: 'Doyle Clayton', mlro: 'Piers Leigh-Pollitt', email: 'info@doyleclayton.co.uk', phone: '0118 951 6761', module: 'GDPR/Compliance' },

  // ── Wealth Management ───────────────────────────────────────────────
  { name: "St James's Place", mlro: '(Compliance Team)', email: 'info@sjp.co.uk', phone: '01285 640302', module: 'Wealth Protection' },
  { name: 'Rathbones', mlro: 'Aaron Thomas Guilder', email: 'invest@rathbones.com', phone: '020 7399 0000', module: 'Trust & Tax' },
  { name: 'Evelyn Partners', mlro: '(Compliance Team)', email: 'contact@evelyn.com', phone: '020 7131 4000', module: 'Compliance Hygiene' },
  { name: 'JTC Group', mlro: 'Lloyd Collier', email: 'info@jtcgroup.com', phone: '020 7408 9200', module: 'AML Officer Services' },
  { name: 'MET Capital', mlro: 'Abhishek Praful Shah', email: 'info@metcapital.co.uk', phone: '020 3000 0000', module: 'Asset Compliance' },
  { name: 'Willow Financial', mlro: 'Aaron John Mears', email: 'contact@willowfp.co.uk', phone: '020 7000 0000', module: 'Onboarding/KYC' },
]

async function main() {
  console.log(`Importing alert recipients for ${firms.length} FineGuard firms...`)
  let created = 0
  let skipped = 0

  for (const firm of firms) {
    const existing = await db.alertRecipient.findFirst({
      where: { company: firm.name, role: 'ComplianceManager' },
    })

    if (existing) {
      console.log(`  SKIP  ${firm.name} (already has a ComplianceManager recipient)`)
      skipped++
      continue
    }

    const namedMlro = cleanContact(firm.mlro)
    // For generic placeholders, derive a readable name from the placeholder text
    const recipientName = namedMlro ?? deriveGenericName(firm.mlro ?? '', firm.name)

    const channel = firm.email ? 'Email' : 'Dashboard'

    await db.alertRecipient.create({
      data: {
        company: firm.name,
        name: recipientName,
        email: firm.email ?? null,
        phone: firm.phone ?? null,
        role: 'ComplianceManager',
        preferredChannel: channel,
        alertCategories: [],   // empty = receives all alert categories
        escalationLevel: 1,
        isActive: true,
        isSuppressed: false,
      },
    })

    const indicator = namedMlro ? `named: ${namedMlro}` : `generic: ${firm.mlro}`
    console.log(`  OK    ${firm.name} → ${recipientName} (${indicator}, ${channel})`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped (already existed): ${skipped}`)
}

function deriveGenericName(placeholder: string, firmName: string): string {
  if (placeholder.includes('Compliance Team')) return 'Compliance Team'
  if (placeholder.includes('Multiple Partners')) return 'Compliance Partners'
  if (placeholder.includes('Partner Led')) return 'Partner-Led Compliance'
  if (placeholder.includes('Internal ACSP')) return 'Internal ACSP Team'
  if (placeholder.includes('Risk & Quality')) return 'Risk & Quality Division'
  return `${firmName} Compliance`
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
