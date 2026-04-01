// ============================================================================
// Admin In-Memory Store
// Holds leads, intake forms, compliance bundles, and contacts.
// Survives for the lifetime of the process; no DB required.
// ============================================================================

import { randomUUID } from 'crypto';

export interface Lead {
  id: string;
  leadId: string;
  name: string;
  email: string;
  company?: string;
  product?: string;
  phone?: string;
  message?: string;
  createdAt: string;
}

export interface IntakeForm {
  id: string;
  matterRef: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  matterType: string;
  urgency: string;
  description?: string;
  claimValue?: string;
  createdAt: string;
}

export interface ComplianceBundle {
  id: string;
  bundleId: string;
  companyName: string;
  companyNumber: string;
  requestorName?: string;
  requestorEmail?: string;
  bundleType: string;
  estimatedTime?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: string;
  createdAt: string;
}

class AdminStore {
  private leads: Lead[] = [];
  private intakeForms: IntakeForm[] = [];
  private complianceBundles: ComplianceBundle[] = [];
  private contacts: Contact[] = [];

  // ─── Leads ───────────────────────────────────────────────────────────────

  addLead(data: Omit<Lead, 'id' | 'leadId' | 'createdAt'>): Lead {
    const lead: Lead = {
      id: randomUUID(),
      leadId: `LEAD-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.leads.unshift(lead);
    return lead;
  }

  getLeads(): Lead[] {
    return this.leads;
  }

  // ─── Intake Forms ─────────────────────────────────────────────────────────

  addIntakeForm(data: Omit<IntakeForm, 'id' | 'matterRef' | 'createdAt'>): IntakeForm {
    const form: IntakeForm = {
      id: randomUUID(),
      matterRef: `MAT-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.intakeForms.unshift(form);
    return form;
  }

  getIntakeForms(): IntakeForm[] {
    return this.intakeForms;
  }

  // ─── Compliance Bundles ───────────────────────────────────────────────────

  addComplianceBundle(data: Omit<ComplianceBundle, 'id' | 'bundleId' | 'createdAt'>): ComplianceBundle {
    const bundle: ComplianceBundle = {
      id: randomUUID(),
      bundleId: `BUNDLE-${Date.now()}`,
      bundleType: data.bundleType ?? 'full',
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.complianceBundles.unshift(bundle);
    return bundle;
  }

  getComplianceBundles(): ComplianceBundle[] {
    return this.complianceBundles;
  }

  // ─── Contacts ─────────────────────────────────────────────────────────────

  addContact(data: Omit<Contact, 'id' | 'ticketId' | 'status' | 'createdAt'>): Contact {
    const contact: Contact = {
      id: randomUUID(),
      ticketId: `TICKET-${Date.now()}`,
      status: 'new',
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.contacts.unshift(contact);
    return contact;
  }

  getContacts(): Contact[] {
    return this.contacts;
  }
}

// Singleton — shared across all imports in the same process
export const adminStore = new AdminStore();
