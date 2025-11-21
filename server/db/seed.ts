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
        product: 'vaultline',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        phone: '+1-555-0100',
        message: 'Interested in VaultLine Cloud for our compliance needs',
      },
      {
        product: 'ultai',
        fullName: 'Jane Smith',
        email: 'jane.smith@lawfirm.com',
        company: 'Smith & Associates',
        phone: '+1-555-0101',
        message: 'Need secure client intake solution',
      },
      {
        product: 'fineguard',
        fullName: 'Bob Johnson',
        email: 'bob@propertyco.uk',
        company: 'Property Management Ltd',
        phone: '+44-20-1234-5678',
        message: 'Looking for Companies House compliance automation',
      },
    ]);

    // Seed intake forms
    console.log('📝 Seeding intake forms...');
    await db.insert(intakeForms).values([
      {
        clientName: 'Alice Williams',
        matterType: 'Corporate',
        email: 'alice@example.com',
        phone: '+1-555-0102',
        description: 'Merger and acquisition consultation',
        urgency: 'high',
      },
      {
        clientName: 'Charlie Brown',
        matterType: 'Litigation',
        email: 'charlie@example.com',
        phone: '+1-555-0103',
        description: 'Contract dispute case',
        urgency: 'medium',
      },
    ]);

    // Seed compliance bundles
    console.log('📝 Seeding compliance bundles...');
    await db.insert(complianceBundles).values([
      {
        companyName: 'Tech Innovations Ltd',
        contactName: 'Sarah Davis',
        email: 'sarah@techinnovations.com',
        phone: '+44-20-9876-5432',
        industry: 'Technology',
        employeeCount: '50-100',
      },
      {
        companyName: 'Green Energy Solutions',
        contactName: 'Michael Green',
        email: 'michael@greenenergy.co.uk',
        phone: '+44-161-234-5678',
        industry: 'Energy',
        employeeCount: '100-250',
      },
    ]);

    // Seed contacts
    console.log('📝 Seeding contacts...');
    await db.insert(contacts).values([
      {
        name: 'Emma Thompson',
        email: 'emma@example.com',
        subject: 'Partnership Inquiry',
        message: 'I would like to discuss a potential partnership opportunity.',
        status: 'new',
      },
      {
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
