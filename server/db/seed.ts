import dotenv from 'dotenv';
import crypto from 'crypto';
import { db } from './index';
import {
  deploymentStatus,
  leads,
  intakeForms,
  complianceBundles,
  contacts,
  users,
  monitoredCompanies,
  acspClients,
  acspFilings,
} from './schema';

// Load environment variables
dotenv.config();

// ── Same hashing logic as server/index.ts ────────────────────────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// ── Fixed seed IDs (deterministic so re-runs are safe) ───────────────────────
const DEMO_USER_ID   = '11111111-1111-1111-1111-111111111111';
const ACSP_CLIENT_1  = 'aaaaaaaa-0001-0001-0001-000000000001';
const ACSP_CLIENT_2  = 'aaaaaaaa-0002-0002-0002-000000000002';

// Due dates relative to today — keeps test data perennially relevant
const d = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
};

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // ── Deployment status ─────────────────────────────────────────────────────
    console.log('📝 Seeding deployment status...');
    await db.insert(deploymentStatus).values([
      { environment: 'dev',     status: 'success', commit: 'abc123def456', workflowRun: '1234567890' },
      { environment: 'staging', status: 'success', commit: 'def456abc123', workflowRun: '1234567891' },
      { environment: 'prod',    status: 'success', commit: 'ghi789jkl012', workflowRun: '1234567892' },
    ]).onConflictDoNothing();

    // ── Leads ─────────────────────────────────────────────────────────────────
    console.log('📝 Seeding leads...');
    await db.insert(leads).values([
      {
        leadId: 'LEAD-1704000000001',
        name: 'John Doe', email: 'john.doe@example.com',
        company: 'Acme Corp', product: 'vaultline', phone: '+1-555-0100',
        message: 'Interested in VaultLine Cloud for our compliance needs',
      },
      {
        leadId: 'LEAD-1704000000002',
        name: 'Jane Smith', email: 'jane.smith@lawfirm.com',
        company: 'Smith & Associates', product: 'ultai', phone: '+1-555-0101',
        message: 'Need secure client intake solution',
      },
      {
        leadId: 'LEAD-1704000000003',
        name: 'Bob Johnson', email: 'bob@propertyco.uk',
        company: 'Property Management Ltd', product: 'fineguard', phone: '+44-20-1234-5678',
        message: 'Looking for Companies House compliance automation',
      },
    ]).onConflictDoNothing();

    // ── Intake forms ──────────────────────────────────────────────────────────
    console.log('📝 Seeding intake forms...');
    await db.insert(intakeForms).values([
      {
        matterRef: 'MAT-1704000000001',
        clientName: 'Alice Williams', clientEmail: 'alice@example.com',
        clientPhone: '+1-555-0102', matterType: 'Corporate', urgency: 'high',
        description: 'Merger and acquisition consultation', claimValue: '$500,000',
      },
      {
        matterRef: 'MAT-1704000000002',
        clientName: 'Charlie Brown', clientEmail: 'charlie@example.com',
        clientPhone: '+1-555-0103', matterType: 'Litigation', urgency: 'medium',
        description: 'Contract dispute case', claimValue: '$250,000',
      },
    ]).onConflictDoNothing();

    // ── Compliance bundles ────────────────────────────────────────────────────
    console.log('📝 Seeding compliance bundles...');
    await db.insert(complianceBundles).values([
      {
        bundleId: 'BUNDLE-1704000000001',
        companyName: 'Tech Innovations Ltd', companyNumber: '12345678',
        requestorName: 'Sarah Davis', requestorEmail: 'sarah@techinnovations.com',
        bundleType: 'full', estimatedTime: '2-3 business days',
      },
      {
        bundleId: 'BUNDLE-1704000000002',
        companyName: 'Green Energy Solutions', companyNumber: '87654321',
        requestorName: 'Michael Green', requestorEmail: 'michael@greenenergy.co.uk',
        bundleType: 'full', estimatedTime: '2-3 business days',
      },
    ]).onConflictDoNothing();

    // ── Contacts ──────────────────────────────────────────────────────────────
    console.log('📝 Seeding contacts...');
    await db.insert(contacts).values([
      {
        ticketId: 'TICKET-1704000000001',
        name: 'Emma Thompson', email: 'emma@example.com',
        subject: 'Partnership Inquiry',
        message: 'I would like to discuss a potential partnership opportunity.',
        status: 'new',
      },
      {
        ticketId: 'TICKET-1704000000002',
        name: 'David Wilson', email: 'david@example.com',
        subject: 'Technical Support',
        message: 'Having issues with the compliance bundle download.',
        status: 'read',
      },
    ]).onConflictDoNothing();

    // ── Demo FineGuard user ───────────────────────────────────────────────────
    console.log('📝 Seeding demo FineGuard user...');
    await db.insert(users).values([
      {
        id: DEMO_USER_ID,
        email: 'demo@fineguard.com',
        name: 'Demo User',
        company: 'FineGuard Demo',
        passwordHash: hashPassword('Demo1234'),
        plan: 'pro',
        role: 'user',
        verified: true,
        onboardingComplete: true,
      },
    ]).onConflictDoNothing();
    console.log('   → demo@fineguard.com / Demo1234');

    // ── Monitored companies (6 companies, full risk spectrum) ─────────────────
    console.log('📝 Seeding monitored companies...');
    await db.insert(monitoredCompanies).values([
      {
        // Already overdue — Critical bucket
        userId: DEMO_USER_ID,
        companyNumber: 'SEED-0001', companyName: 'Overdue Logistics Ltd',
        complianceStatus: 'overdue', riskLevel: 'high',
        accountsNextDue: d(-38), confirmationNextDue: d(-10),
      },
      {
        // Warning + high risk — High bucket, filings due very soon (5 days)
        userId: DEMO_USER_ID,
        companyNumber: 'SEED-0002', companyName: 'Summit Ventures Ltd',
        complianceStatus: 'warning', riskLevel: 'high',
        accountsNextDue: d(5), confirmationNextDue: d(22),
      },
      {
        // Warning + medium risk — Medium bucket, filings due in ~3 weeks
        userId: DEMO_USER_ID,
        companyNumber: 'SEED-0003', companyName: 'Meridian Advisory Ltd',
        complianceStatus: 'warning', riskLevel: 'medium',
        accountsNextDue: d(18), confirmationNextDue: d(42),
      },
      {
        // Compliant + low risk — Low bucket, upcoming in ~2 months
        userId: DEMO_USER_ID,
        companyNumber: 'SEED-0004', companyName: 'Apex Holdings Ltd',
        complianceStatus: 'compliant', riskLevel: 'low',
        accountsNextDue: d(55), confirmationNextDue: d(78),
      },
      {
        // Compliant + none — Low bucket, near the 90-day boundary
        userId: DEMO_USER_ID,
        companyNumber: 'SEED-0005', companyName: 'Broadfield Partners Ltd',
        complianceStatus: 'compliant', riskLevel: 'none',
        accountsNextDue: d(88), confirmationNextDue: d(110), // 110 beyond window
      },
      {
        // Fully healthy — Low bucket, filings well beyond 90 days
        userId: DEMO_USER_ID,
        companyNumber: 'SEED-0006', companyName: 'Clearwater Solutions Ltd',
        complianceStatus: 'compliant', riskLevel: 'none',
        accountsNextDue: d(180), confirmationNextDue: d(200),
      },
    ]).onConflictDoNothing();

    // ── ACSP clients ──────────────────────────────────────────────────────────
    console.log('📝 Seeding ACSP clients...');
    await db.insert(acspClients).values([
      {
        id: ACSP_CLIENT_1,
        userId: DEMO_USER_ID,
        companyNumber: 'ACSP-C001', companyName: 'Thornton & Co Solicitors',
        clientRef: 'TCS-2024-001', serviceType: 'filing',
        status: 'active', acspRegNumber: 'ACSP-REG-001',
        identityVerified: true, amlChecked: true,
        nextFilingDue: d(12),
      },
      {
        id: ACSP_CLIENT_2,
        userId: DEMO_USER_ID,
        companyNumber: 'ACSP-C002', companyName: 'Harrow Business Services Ltd',
        clientRef: 'HBS-2024-002', serviceType: 'formation',
        status: 'active', acspRegNumber: 'ACSP-REG-002',
        identityVerified: true, amlChecked: false,
        nextFilingDue: d(65),
      },
    ]).onConflictDoNothing();

    // ── ACSP filings ──────────────────────────────────────────────────────────
    console.log('📝 Seeding ACSP filings...');
    await db.insert(acspFilings).values([
      {
        // Overdue filing
        acspClientId: ACSP_CLIENT_1, userId: DEMO_USER_ID,
        filingType: 'confirmation_statement', status: 'pending',
        dueDate: d(-5), referenceNumber: 'REF-CS-001',
        notes: 'Client unresponsive — chase required',
      },
      {
        // Urgent — due in 12 days
        acspClientId: ACSP_CLIENT_1, userId: DEMO_USER_ID,
        filingType: 'annual_accounts', status: 'pending',
        dueDate: d(12), referenceNumber: 'REF-AA-002',
      },
      {
        // Medium term — due in 65 days
        acspClientId: ACSP_CLIENT_2, userId: DEMO_USER_ID,
        filingType: 'change_of_director', status: 'pending',
        dueDate: d(65), referenceNumber: 'REF-CD-003',
      },
      {
        // Already filed — should appear as 'filed' in response
        acspClientId: ACSP_CLIENT_2, userId: DEMO_USER_ID,
        filingType: 'incorporation', status: 'accepted',
        dueDate: d(-90), referenceNumber: 'REF-INC-004',
        notes: 'Accepted by Companies House',
      },
    ]).onConflictDoNothing();

    console.log('✅ Seeding completed successfully');
    console.log('');
    console.log('   FineGuard demo login:');
    console.log('   Email:    demo@fineguard.com');
    console.log('   Password: Demo1234');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
