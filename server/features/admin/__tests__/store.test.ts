// ============================================================================
// Admin Store Unit Tests
// ============================================================================

import { describe, it, expect } from 'vitest';

// Re-import a fresh instance for each test by resetting module state
// Since adminStore is a singleton we test behaviour through the exported instance
// and reset state via the internal arrays — we do this by re-importing in isolation.

// We test the store's public API directly.
import { adminStore } from '../store.js';

// Helpers to drain the store between tests — we reach into the module's state
// by calling getters and filtering, but since there's no reset() method we
// run each describe block aware that state accumulates. Tests use unique IDs.

describe('AdminStore — leads', () => {
  it('adds a lead and returns it with generated ids', () => {
    const lead = adminStore.addLead({ name: 'Alice', email: 'alice@example.com' });
    expect(lead.id).toBeTruthy();
    expect(lead.leadId).toMatch(/^LEAD-[A-F0-9]+$/);
    expect(lead.name).toBe('Alice');
    expect(lead.email).toBe('alice@example.com');
    expect(lead.createdAt).toBeTruthy();
  });

  it('stores optional fields', () => {
    const lead = adminStore.addLead({
      name: 'Bob',
      email: 'bob@example.com',
      company: 'Acme',
      product: 'fineguard',
      phone: '07700900000',
      message: 'Hello',
    });
    expect(lead.company).toBe('Acme');
    expect(lead.product).toBe('fineguard');
    expect(lead.phone).toBe('07700900000');
    expect(lead.message).toBe('Hello');
  });

  it('getLeads returns newest first', () => {
    const before = adminStore.getLeads().length;
    adminStore.addLead({ name: 'First', email: 'first@example.com' });
    adminStore.addLead({ name: 'Second', email: 'second@example.com' });
    const leads = adminStore.getLeads();
    expect(leads.length).toBe(before + 2);
    expect(leads[0].name).toBe('Second');
  });

  it('each lead gets a unique id', () => {
    const a = adminStore.addLead({ name: 'A', email: 'a@example.com' });
    const b = adminStore.addLead({ name: 'B', email: 'b@example.com' });
    expect(a.id).not.toBe(b.id);
    expect(a.leadId).not.toBe(b.leadId);
  });
});

describe('AdminStore — intake forms', () => {
  it('adds an intake form with generated matterRef', () => {
    const form = adminStore.addIntakeForm({
      clientName: 'Charlie',
      matterType: 'litigation',
      urgency: 'high',
    });
    expect(form.matterRef).toMatch(/^MAT-[A-F0-9]+$/);
    expect(form.clientName).toBe('Charlie');
    expect(form.urgency).toBe('high');
  });

  it('stores optional intake fields', () => {
    const form = adminStore.addIntakeForm({
      clientName: 'Dana',
      matterType: 'contract',
      urgency: 'low',
      clientEmail: 'dana@example.com',
      clientPhone: '07700900001',
      description: 'Test matter',
      claimValue: '£10,000',
    });
    expect(form.clientEmail).toBe('dana@example.com');
    expect(form.claimValue).toBe('£10,000');
  });

  it('getIntakeForms returns newest first', () => {
    const before = adminStore.getIntakeForms().length;
    adminStore.addIntakeForm({ clientName: 'X', matterType: 'x', urgency: 'low' });
    adminStore.addIntakeForm({ clientName: 'Y', matterType: 'y', urgency: 'medium' });
    const forms = adminStore.getIntakeForms();
    expect(forms.length).toBe(before + 2);
    expect(forms[0].clientName).toBe('Y');
  });
});

describe('AdminStore — compliance bundles', () => {
  it('adds a bundle with generated bundleId', () => {
    const bundle = adminStore.addComplianceBundle({
      companyName: 'Test Co',
      companyNumber: '12345678',
      bundleType: 'full',
    });
    expect(bundle.bundleId).toMatch(/^BUNDLE-[A-F0-9]+$/);
    expect(bundle.companyName).toBe('Test Co');
    expect(bundle.bundleType).toBe('full');
  });

  it('defaults bundleType to "full"', () => {
    const bundle = adminStore.addComplianceBundle({
      companyName: 'Co',
      companyNumber: '99999999',
      bundleType: undefined as unknown as string,
    });
    expect(bundle.bundleType).toBe('full');
  });
});

describe('AdminStore — contacts', () => {
  it('adds a contact with generated ticketId and status "new"', () => {
    const contact = adminStore.addContact({
      name: 'Eve',
      email: 'eve@example.com',
      message: 'Query',
    });
    expect(contact.ticketId).toMatch(/^TICKET-[A-F0-9]+$/);
    expect(contact.status).toBe('new');
    expect(contact.name).toBe('Eve');
  });

  it('stores optional subject', () => {
    const contact = adminStore.addContact({
      name: 'Frank',
      email: 'frank@example.com',
      message: 'Hi',
      subject: 'Billing',
    });
    expect(contact.subject).toBe('Billing');
  });

  it('getContacts returns newest first', () => {
    const before = adminStore.getContacts().length;
    adminStore.addContact({ name: 'P', email: 'p@example.com', message: 'P' });
    adminStore.addContact({ name: 'Q', email: 'q@example.com', message: 'Q' });
    const contacts = adminStore.getContacts();
    expect(contacts.length).toBe(before + 2);
    expect(contacts[0].name).toBe('Q');
  });
});
