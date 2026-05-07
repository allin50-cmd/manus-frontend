import { describe, it, expect } from 'vitest';
import {
  LeadSchema,
  IntakeSchema,
  ContactSchema,
  AuditSignupSchema,
  BarristerSchema,
  BriefSchema,
  NoteSchema,
} from '../server/schemas/index.js';

describe('LeadSchema', () => {
  it('passes with valid input', () => {
    const result = LeadSchema.safeParse({
      name: 'Alice Smith',
      email: 'alice@example.com',
      product: 'vaultline',
      company: 'ACME Ltd',
      phone: '+441234567890',
      message: 'Hello',
    });
    expect(result.success).toBe(true);
  });

  it('passes with only required fields', () => {
    const result = LeadSchema.safeParse({ name: 'Bob', email: 'bob@test.com' });
    expect(result.success).toBe(true);
  });

  it('fails with invalid email', () => {
    const result = LeadSchema.safeParse({ name: 'Alice', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('fails with invalid product enum', () => {
    const result = LeadSchema.safeParse({ name: 'Alice', email: 'a@b.com', product: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('fails when name is missing', () => {
    const result = LeadSchema.safeParse({ email: 'a@b.com' });
    expect(result.success).toBe(false);
  });
});

describe('IntakeSchema', () => {
  it('passes with valid input', () => {
    const result = IntakeSchema.safeParse({
      clientName: 'Jane Doe',
      clientEmail: 'jane@example.com',
      matterType: 'Litigation',
      urgency: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('passes with empty string clientEmail', () => {
    const result = IntakeSchema.safeParse({
      clientName: 'Jane Doe',
      clientEmail: '',
      matterType: 'Litigation',
      urgency: 'medium',
    });
    expect(result.success).toBe(true);
  });

  it('fails with invalid urgency', () => {
    const result = IntakeSchema.safeParse({
      clientName: 'Jane',
      matterType: 'Litigation',
      urgency: 'extreme',
    });
    expect(result.success).toBe(false);
  });

  it('fails when clientName is missing', () => {
    const result = IntakeSchema.safeParse({
      matterType: 'Litigation',
      urgency: 'low',
    });
    expect(result.success).toBe(false);
  });
});

describe('ContactSchema', () => {
  it('passes with valid input', () => {
    const result = ContactSchema.safeParse({
      name: 'Chris',
      email: 'chris@example.com',
      message: 'Hello there',
    });
    expect(result.success).toBe(true);
  });

  it('passes with optional subject', () => {
    const result = ContactSchema.safeParse({
      name: 'Chris',
      email: 'chris@example.com',
      message: 'Hello there',
      subject: 'Enquiry',
    });
    expect(result.success).toBe(true);
  });

  it('fails with invalid email', () => {
    const result = ContactSchema.safeParse({
      name: 'Chris',
      email: 'not-valid',
      message: 'Hi',
    });
    expect(result.success).toBe(false);
  });
});

describe('AuditSignupSchema', () => {
  it('passes with valid email', () => {
    const result = AuditSignupSchema.safeParse({ email: 'audit@example.com' });
    expect(result.success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = AuditSignupSchema.safeParse({
      email: 'audit@example.com',
      name: 'Chambers One',
      chamberSize: '20',
      painPoints: ['billing', 'scheduling'],
    });
    expect(result.success).toBe(true);
  });

  it('fails with invalid email', () => {
    const result = AuditSignupSchema.safeParse({ email: 'bad-email' });
    expect(result.success).toBe(false);
  });
});

describe('BarristerSchema', () => {
  it('passes with valid input', () => {
    const result = BarristerSchema.safeParse({
      fullName: 'John Wig',
      yearOfCall: 1998,
      specialisms: ['criminal', 'civil'],
      status: 'active',
      email: 'wig@chambers.com',
    });
    expect(result.success).toBe(true);
  });

  it('uses default status when not provided', () => {
    const result = BarristerSchema.safeParse({ fullName: 'John Wig' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
    }
  });

  it('fails with invalid status enum', () => {
    const result = BarristerSchema.safeParse({
      fullName: 'John Wig',
      status: 'retired',
    });
    expect(result.success).toBe(false);
  });
});

describe('BriefSchema', () => {
  it('passes with valid input', () => {
    const result = BriefSchema.safeParse({
      title: 'Case v Defendant',
      clientName: 'Client Co',
      matterType: 'Commercial',
      status: 'accepted',
    });
    expect(result.success).toBe(true);
  });

  it('uses default status when not provided', () => {
    const result = BriefSchema.safeParse({
      title: 'Case v Defendant',
      clientName: 'Client Co',
      matterType: 'Commercial',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('received');
    }
  });

  it('fails with invalid status', () => {
    const result = BriefSchema.safeParse({
      title: 'Case v Defendant',
      clientName: 'Client Co',
      matterType: 'Commercial',
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('fails when title is missing', () => {
    const result = BriefSchema.safeParse({
      clientName: 'Client Co',
      matterType: 'Commercial',
    });
    expect(result.success).toBe(false);
  });
});

describe('NoteSchema', () => {
  it('passes with a valid note', () => {
    const result = NoteSchema.safeParse({ note: 'This is a note.' });
    expect(result.success).toBe(true);
  });

  it('passes with optional uuid fields', () => {
    const result = NoteSchema.safeParse({
      note: 'Details here',
      briefId: '123e4567-e89b-12d3-a456-426614174000',
      barristerId: '123e4567-e89b-12d3-a456-426614174001',
      createdBy: 'admin',
    });
    expect(result.success).toBe(true);
  });

  it('fails when note is empty', () => {
    const result = NoteSchema.safeParse({ note: '' });
    expect(result.success).toBe(false);
  });
});
