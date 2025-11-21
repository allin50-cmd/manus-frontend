import dotenv from 'dotenv';
import { db } from './index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts } from './schema';

// Load environment variables
dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Seed deployment status
    console.log('📝 Seeding deployment status...');
    await db.insert(deploymentStatus).values([
      {
        environment: 'dev',
        status: 'success',
        commit: 'abc123def456',
        workflowRun: '1234567890',
      },
      {
        environment: 'staging',
        status: 'success',
        commit: 'def456abc123',
        workflowRun: '1234567891',
      },
      {
        environment: 'prod',
        status: 'success',
        commit: 'ghi789jkl012',
        workflowRun: '1234567892',
      },
    ]);

    // Seed leads
    console.log('📝 Seeding leads...');
    await db.insert(leads).values([
      {
        leadId: 'LEAD-1704000000001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        product: 'vaultline',
        phone: '+1-555-0100',
        message: 'Interested in VaultLine Cloud for our compliance needs',
      },
      {
        leadId: 'LEAD-1704000000002',
        name: 'Jane Smith',
        email: 'jane.smith@lawfirm.com',
        company: 'Smith & Associates',
        product: 'ultai',
        phone: '+1-555-0101',
        message: 'Need secure client intake solution',
      },
      {
        leadId: 'LEAD-1704000000003',
        name: 'Bob Johnson',
        email: 'bob@propertyco.uk',
        company: 'Property Management Ltd',
        product: 'fineguard',
        phone: '+44-20-1234-5678',
        message: 'Looking for Companies House compliance automation',
      },
    ]);

    // Seed intake forms
    console.log('📝 Seeding intake forms...');
    await db.insert(intakeForms).values([
      {
        matterRef: 'MAT-1704000000001',
        clientName: 'Alice Williams',
        clientEmail: 'alice@example.com',
        clientPhone: '+1-555-0102',
        matterType: 'Corporate',
        urgency: 'high',
        description: 'Merger and acquisition consultation',
        claimValue: '$500,000',
      },
      {
        matterRef: 'MAT-1704000000002',
        clientName: 'Charlie Brown',
        clientEmail: 'charlie@example.com',
        clientPhone: '+1-555-0103',
        matterType: 'Litigation',
        urgency: 'medium',
        description: 'Contract dispute case',
        claimValue: '$250,000',
      },
    ]);

    // Seed compliance bundles
    console.log('📝 Seeding compliance bundles...');
    await db.insert(complianceBundles).values([
      {
        bundleId: 'BUNDLE-1704000000001',
        companyName: 'Tech Innovations Ltd',
        companyNumber: '12345678',
        requestorName: 'Sarah Davis',
        requestorEmail: 'sarah@techinnovations.com',
        bundleType: 'full',
        estimatedTime: '2-3 business days',
      },
      {
        bundleId: 'BUNDLE-1704000000002',
        companyName: 'Green Energy Solutions',
        companyNumber: '87654321',
        requestorName: 'Michael Green',
        requestorEmail: 'michael@greenenergy.co.uk',
        bundleType: 'full',
        estimatedTime: '2-3 business days',
      },
    ]);

    // Seed contacts
    console.log('📝 Seeding contacts...');
    await db.insert(contacts).values([
      {
        ticketId: 'TICKET-1704000000001',
        name: 'Emma Thompson',
        email: 'emma@example.com',
        subject: 'Partnership Inquiry',
        message: 'I would like to discuss a potential partnership opportunity.',
        status: 'new',
      },
      {
        ticketId: 'TICKET-1704000000002',
        name: 'David Wilson',
        email: 'david@example.com',
        subject: 'Technical Support',
        message: 'Having issues with the compliance bundle download.',
        status: 'read',
      },
    ]);

    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
