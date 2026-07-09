const fs = require('fs');
const path = require('path');

// ---------- PASTE YOUR DATA ARRAYS HERE ----------
// Extracted from prototype.html / live session
const companies = [
  { id: 'c1', name: 'Acme Manufacturing Ltd', route: 'sc-aa', status: 'active' },
  { id: 'c2', name: 'Bright Futures Consulting Ltd', route: 'sc-bb', status: 'active' },
  { id: 'c3', name: 'Tech Corp Solutions Ltd', route: 'sc-cc', status: 'active' },
  { id: 'c4', name: 'Sunset Retail Group Ltd', route: 'sc-dd', status: 'active' },
  { id: 'c5', name: 'Northern Properties Ltd', route: 'sc-ee', status: 'active' },
  { id: 'c6', name: 'GreenLeaf Catering Ltd', route: 'sc-ff', status: 'active' },
  { id: 'c7', name: 'Harbor Logistics Ltd', route: 'sc-gg', status: 'active' },
];

const deadlines = [
  { id: 'd1', companyId: 'c1', type: 'accounts', dueDate: '2026-06-01', status: 'overdue', filedAt: null, ref: 'AA', notes: 'FY ended 31 Mar 2025' },
  { id: 'd2', companyId: 'c2', type: 'confirmation', dueDate: '2026-06-15', status: 'overdue', filedAt: null, ref: 'CS01', notes: '' },
  { id: 'd3', companyId: 'c3', type: 'accounts', dueDate: '2026-04-30', status: 'filed', filedAt: '2026-04-25', ref: 'AA', notes: 'FY ended 31 Dec 2025' },
  { id: 'd4', companyId: 'c3', type: 'director', dueDate: '2026-06-20', status: 'due-soon', filedAt: null, ref: 'AP01', notes: 'Director appointment filed' },
  { id: 'd5', companyId: 'c6', type: 'confirmation', dueDate: '2026-07-13', status: 'upcoming', filedAt: null, ref: 'CS01', notes: '' },
  { id: 'd6', companyId: 'c6', type: 'accounts', dueDate: '2026-10-31', status: 'upcoming', filedAt: null, ref: 'AA', notes: 'FY ended 31 Mar 2026' },
  { id: 'd7', companyId: 'c4', type: 'confirmation', dueDate: '2026-08-15', status: 'upcoming', filedAt: null, ref: 'CS01', notes: '' },
  { id: 'd8', companyId: 'c5', type: 'accounts', dueDate: '2026-11-30', status: 'ok', filedAt: null, ref: 'AA', notes: 'FY ended 28 Feb 2026' },
  { id: 'd9', companyId: 'c7', type: 'confirmation', dueDate: '2026-12-20', status: 'ok', filedAt: null, ref: 'CS01', notes: '' },
  { id: 'd10', companyId: 'c2', type: 'psc', dueDate: '2026-06-25', status: 'due-soon', filedAt: null, ref: 'PSC04', notes: 'PSC details updated. Filing required within 14 days.' },
  { id: 'd11', companyId: 'c1', type: 'confirmation', dueDate: '2026-09-12', status: 'upcoming', filedAt: null, ref: 'CS01', notes: '' },
  { id: 'd12', companyId: 'c5', type: 'confirmation', dueDate: '2026-07-05', status: 'upcoming', filedAt: null, ref: 'CS01', notes: '' },
];

const alerts = [
  { id: 'a1', companyId: 'c1', deadlineId: 'd1', type: 'overdue', channel: 'email', status: 'sent', recipient: 'george@firm.co.uk', sentAt: '2026-06-06T09:00:00Z', subject: 'OVERDUE: Annual Accounts — Acme Manufacturing Ltd' },
  { id: 'a2', companyId: 'c1', deadlineId: 'd1', type: 'overdue', channel: 'sms', status: 'sent', recipient: '+44 7700 900123', sentAt: '2026-06-06T09:01:00Z', subject: 'FineGuard: Acme Manufacturing annual accounts OVERDUE' },
  { id: 'a3', companyId: 'c2', deadlineId: 'd2', type: '14-day', channel: 'email', status: 'sent', recipient: 'george@firm.co.uk', sentAt: '2026-06-14T08:00:00Z', subject: '14 days: Confirmation Statement — Bright Futures Consulting Ltd' },
  { id: 'a4', companyId: 'c3', deadlineId: 'd4', type: '7-day', channel: 'email', status: 'sent', recipient: 'george@firm.co.uk', sentAt: '2026-06-13T08:00:00Z', subject: '7 days: Director Appointment — Tech Corp Solutions Ltd' },
  { id: 'a5', companyId: 'c4', deadlineId: 'd7', type: '60-day', channel: 'email', status: 'sent', recipient: 'george@firm.co.uk', sentAt: '2026-06-16T08:00:00Z', subject: '60 days: Confirmation Statement — Sunset Retail Group Ltd' },
  { id: 'a6', companyId: 'c2', deadlineId: 'd10', type: '14-day', channel: 'sms', status: 'sent', recipient: '+44 7700 900123', sentAt: '2026-06-11T08:05:00Z', subject: 'FineGuard: PSC change filing due in 14 days' },
  { id: 'a7', companyId: 'c6', deadlineId: 'd5', type: '30-day', channel: 'email', status: 'failed', recipient: 'contact@greenleaf.co.uk', sentAt: '2026-06-13T08:00:00Z', subject: '30 days: Confirmation Statement — GreenLeaf Catering Ltd' },
  { id: 'a8', companyId: 'c1', deadlineId: 'd1', type: '30-day', channel: 'email', status: 'sent', recipient: 'george@firm.co.uk', sentAt: '2026-05-06T09:00:00Z', subject: '30 days: Annual Accounts — Acme Manufacturing Ltd' },
];

const recipients = [
  { id: 'r1', companyId: 'all', name: 'George', email: 'george@firm.co.uk', phone: '+44 7700 900123', channels: ['email', 'sms'] },
  { id: 'r2', companyId: 'c2', name: 'Emma Wilson', email: 'emma@brightfutures.co.uk', phone: '', channels: ['email'] },
  { id: 'r3', companyId: 'c5', name: 'Priya Kumar', email: 'priya@northernproperties.co.uk', phone: '+44 7700 900456', channels: ['email', 'sms'] },
];

const settings = {
  alertDays: [90, 60, 30, 14, 7, 1],
  overdueRepeat: 7,
  channels: { email: true, sms: true, whatsapp: false },
};

// ---------- WRITE JSON FILES ----------
const dataDir = path.join(__dirname, 'data', 'seed');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const datasets = {
  companies,
  deadlines,
  alerts,
  recipients,
  settings,
};

for (const [name, data] of Object.entries(datasets)) {
  const filePath = path.join(dataDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Written ${Array.isArray(data) ? data.length : 1} items to ${name}.json`);
}

console.log('✅ All datasets saved to data/seed/');
