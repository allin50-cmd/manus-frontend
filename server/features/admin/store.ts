// ============================================================================
// Admin Store
// Holds leads, intake forms, compliance bundles, and contacts.
// Persists to .data/admin.json on every write; loads on startup.
// Falls back to empty state if the file is missing or unreadable.
// ============================================================================

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '../../../.data/admin.json');

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

interface PersistedData {
  leads: Lead[];
  intakeForms: IntakeForm[];
  complianceBundles: ComplianceBundle[];
  contacts: Contact[];
}

function load(): PersistedData {
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as PersistedData;
  } catch {
    return { leads: [], intakeForms: [], complianceBundles: [], contacts: [] };
  }
}

class AdminStore {
  private leads: Lead[];
  private intakeForms: IntakeForm[];
  private complianceBundles: ComplianceBundle[];
  private contacts: Contact[];

  constructor() {
    const data = load();
    this.leads = data.leads;
    this.intakeForms = data.intakeForms;
    this.complianceBundles = data.complianceBundles;
    this.contacts = data.contacts;
  }

  private persist(): void {
    try {
      mkdirSync(dirname(DATA_FILE), { recursive: true });
      writeFileSync(
        DATA_FILE,
        JSON.stringify(
          {
            leads: this.leads,
            intakeForms: this.intakeForms,
            complianceBundles: this.complianceBundles,
            contacts: this.contacts,
          },
          null,
          2,
        ),
        'utf-8',
      );
    } catch (err) {
      console.error('[admin-store] Failed to persist data:', err);
    }
  }

  // ─── Leads ───────────────────────────────────────────────────────────────

  addLead(data: Omit<Lead, 'id' | 'leadId' | 'createdAt'>): Lead {
    const lead: Lead = {
      id: randomUUID(),
      leadId: `LEAD-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.leads.unshift(lead);
    this.persist();
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
    this.persist();
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
    this.persist();
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
    this.persist();
    return contact;
  }

  getContacts(): Contact[] {
    return this.contacts;
  }
}

// Singleton — shared across all imports in the same process
export const adminStore = new AdminStore();
