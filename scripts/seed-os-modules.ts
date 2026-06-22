/**
 * Seed script: populate Ultratech OS module tables with realistic initial data.
 * Run once after schema push: npx tsx scripts/seed-os-modules.ts
 */
import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema'

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL not set'); process.exit(1) }

const client = postgres(url, { max: 1 })
const db = drizzle(client, { schema })

const {
  osInvoices,
  osCallLogs,
  osMessageThreads,
  osMessages,
  osPeople,
  osAlerts,
  osDocuments,
  osTasks,
} = schema

async function seed() {
  console.log('Seeding OS module tables…')

  // ── People ────────────────────────────────────────────────────────────────
  await db.insert(osPeople).values([
    { name: 'George', phone: '07700900001', email: 'george@ultratech.co.uk', company: 'Ultratech', role: 'Director', category: 'Team', avatarInitials: 'GE' },
    { name: 'Dagon', phone: '07700900002', email: 'dagon@ultratech.co.uk', company: 'Ultratech', role: 'Operations', category: 'Team', avatarInitials: 'DA' },
    { name: 'Alissa', phone: '07700900003', email: 'alissa@ultratech.co.uk', company: 'Ultratech', role: 'Admin', category: 'Team', avatarInitials: 'AL' },
    { name: 'Marcus Webb', phone: '07700900010', email: 'm.webb@fineguard.co.uk', company: 'FineGuard', role: 'Legal Director', category: 'Client', avatarInitials: 'MW' },
    { name: 'Sarah Tilbury', phone: '07700900011', email: 'sarah@builderbig.co.uk', company: 'Builder Big Jobs', role: 'MD', category: 'Client', avatarInitials: 'ST' },
    { name: 'James Accuracy', phone: '07700900012', email: 'james@accuracy.co.uk', company: 'Accuracy Ltd', role: 'CEO', category: 'Client', avatarInitials: 'JA' },
    { name: 'Priya Singh', phone: '07700900013', email: 'priya@accsupplier.co.uk', company: 'AccountSup', role: 'Account Manager', category: 'Supplier', avatarInitials: 'PS' },
    { name: 'Tom Hartley', phone: '07700900014', email: 'tom@techpartner.co.uk', company: 'TechPartner Ltd', role: 'CTO', category: 'Partner', avatarInitials: 'TH' },
  ]).onConflictDoNothing()
  console.log('  ✓ osPeople')

  // ── Invoices ──────────────────────────────────────────────────────────────
  const now = new Date()
  const ago = (days: number) => new Date(now.getTime() - days * 86_400_000)
  const fwd = (days: number) => new Date(now.getTime() + days * 86_400_000)

  await db.insert(osInvoices).values([
    { number: 'INV-001', clientName: 'FineGuard Ltd', amountPence: 250000, status: 'Paid', issuedAt: ago(30), dueAt: ago(16), paidAt: ago(15) },
    { number: 'INV-002', clientName: 'Builder Big Jobs', amountPence: 150000, status: 'Paid', issuedAt: ago(25), dueAt: ago(11), paidAt: ago(10) },
    { number: 'INV-003', clientName: 'Accuracy Ltd', amountPence: 320000, status: 'Overdue', issuedAt: ago(40), dueAt: ago(10) },
    { number: 'INV-004', clientName: 'FineGuard Ltd', amountPence: 250000, status: 'Sent', issuedAt: ago(5), dueAt: fwd(25) },
    { number: 'INV-005', clientName: 'Accuracy Ltd', amountPence: 180000, status: 'Sent', issuedAt: ago(3), dueAt: fwd(27) },
    { number: 'INV-006', clientName: 'Builder Big Jobs', amountPence: 95000, status: 'Draft', issuedAt: ago(1), dueAt: fwd(29) },
  ]).onConflictDoNothing()
  console.log('  ✓ osInvoices')

  // ── Call Logs ─────────────────────────────────────────────────────────────
  await db.insert(osCallLogs).values([
    { callerName: 'Marcus Webb', callerPhone: '07700900010', direction: 'Inbound', outcome: 'Answered', durationSeconds: 487, calledAt: ago(0) },
    { callerName: 'Sarah Tilbury', callerPhone: '07700900011', direction: 'Outbound', outcome: 'Answered', durationSeconds: 310, calledAt: ago(0) },
    { callerName: 'Unknown', callerPhone: '02071234567', direction: 'Inbound', outcome: 'Missed', durationSeconds: 0, calledAt: ago(0) },
    { callerName: 'James Accuracy', callerPhone: '07700900012', direction: 'Inbound', outcome: 'Voicemail', durationSeconds: 62, calledAt: ago(1) },
    { callerName: 'Priya Singh', callerPhone: '07700900013', direction: 'Outbound', outcome: 'Answered', durationSeconds: 245, calledAt: ago(1) },
    { callerName: 'Tom Hartley', callerPhone: '07700900014', direction: 'Outbound', outcome: 'NoAnswer', durationSeconds: 0, calledAt: ago(2) },
    { callerName: 'Marcus Webb', callerPhone: '07700900010', direction: 'Inbound', outcome: 'Answered', durationSeconds: 720, calledAt: ago(3) },
    { callerName: 'Unknown', callerPhone: '01612345678', direction: 'Inbound', outcome: 'Missed', durationSeconds: 0, calledAt: ago(3) },
  ])
  console.log('  ✓ osCallLogs')

  // ── Message Threads ───────────────────────────────────────────────────────
  const threads = await db.insert(osMessageThreads).values([
    { subject: 'FineGuard — INV-004 payment terms', participantNames: ['Marcus Webb', 'George'], unreadCount: 2, isPinned: true, lastMessageAt: ago(0) },
    { subject: 'Builder Big Jobs — New lead pipeline', participantNames: ['Sarah Tilbury', 'George'], unreadCount: 1, lastMessageAt: ago(1) },
    { subject: 'Accuracy proposal follow-up', participantNames: ['James Accuracy', 'George'], unreadCount: 0, lastMessageAt: ago(2) },
    { subject: 'AccountSup — onboarding docs', participantNames: ['Priya Singh', 'Alissa'], unreadCount: 3, lastMessageAt: ago(0) },
    { subject: 'TechPartner integration spec', participantNames: ['Tom Hartley', 'Dagon'], unreadCount: 0, lastMessageAt: ago(5) },
  ]).returning({ id: schema.osMessageThreads.id })
  console.log('  ✓ osMessageThreads')

  // ── Messages ──────────────────────────────────────────────────────────────
  if (threads[0]) {
    await db.insert(osMessages).values([
      { threadId: threads[0].id, fromName: 'Marcus Webb', body: 'Hi George, just checking on the payment terms for INV-004.', isRead: true, sentAt: ago(3) },
      { threadId: threads[0].id, fromName: 'George', body: 'Net 30, as agreed. Chasing if not received by the 25th.', isRead: true, sentAt: ago(3) },
      { threadId: threads[0].id, fromName: 'Marcus Webb', body: 'Actually can we discuss moving to net 45 for future invoices?', isRead: false, sentAt: ago(1) },
      { threadId: threads[0].id, fromName: 'Marcus Webb', body: 'Let me know when you have 10 mins.', isRead: false, sentAt: ago(0) },
    ])
  }
  if (threads[1]) {
    await db.insert(osMessages).values([
      { threadId: threads[1].id, fromName: 'Sarah Tilbury', body: 'George, we had 3 new leads come in from the platform this week.', isRead: false, sentAt: ago(1) },
    ])
  }
  console.log('  ✓ osMessages')

  // ── Alerts ────────────────────────────────────────────────────────────────
  await db.insert(osAlerts).values([
    { severity: 'Critical', title: 'INV-003 overdue — £3,200 outstanding', body: 'Accuracy Ltd invoice overdue by 10 days. Action required.', source: 'Money', isRead: false },
    { severity: 'Warning', title: '2 missed calls today', body: 'Unknown caller (0207) and voicemail from James at Accuracy.', source: 'Calls', isRead: false },
    { severity: 'Warning', title: 'FineGuard subscription renewal in 7 days', body: 'FineGuard Ltd subscription expires 2026-06-29. Send renewal invoice.', source: 'Money', isRead: false },
    { severity: 'Info', title: '3 new messages unread', body: 'Marcus Webb (2), Priya Singh (1).', source: 'Messages', isRead: false },
    { severity: 'Info', title: 'AccountSup onboarding docs requested', body: 'Priya Singh sent 3 messages re: onboarding documents.', source: 'Messages', isRead: false },
  ])
  console.log('  ✓ osAlerts')

  // ── Documents ─────────────────────────────────────────────────────────────
  await db.insert(osDocuments).values([
    { filename: 'FineGuard_SLA_v2.pdf', mimeType: 'application/pdf', fileSizeBytes: 243800, source: 'Received', status: 'PendingReview', linkedCompany: 'FineGuard', uploadedBy: 'Marcus Webb' },
    { filename: 'BuilderBigJobs_Contract_2026.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSizeBytes: 87600, source: 'Upload', status: 'Approved', linkedCompany: 'Builder Big Jobs', uploadedBy: 'George' },
    { filename: 'Accuracy_Proposal_v3.pdf', mimeType: 'application/pdf', fileSizeBytes: 512000, source: 'Generated', status: 'Approved', linkedCompany: 'Accuracy Ltd', uploadedBy: 'George' },
    { filename: 'AccountSup_Onboarding_Checklist.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSizeBytes: 45200, source: 'Received', status: 'PendingReview', linkedCompany: 'AccountSup', uploadedBy: 'Priya Singh' },
    { filename: 'TechPartner_Integration_Spec.pdf', mimeType: 'application/pdf', fileSizeBytes: 1240000, source: 'Received', status: 'Approved', linkedCompany: 'TechPartner Ltd', uploadedBy: 'Tom Hartley' },
  ])
  console.log('  ✓ osDocuments')

  // ── Tasks ─────────────────────────────────────────────────────────────────
  await db.insert(osTasks).values([
    { title: 'Chase INV-003 — Accuracy Ltd', assignedTo: 'George', priority: 'Urgent', status: 'Open', dueAt: fwd(1) },
    { title: 'Call Marcus Webb re: net 45 request', assignedTo: 'George', priority: 'High', status: 'Open', dueAt: fwd(2) },
    { title: 'Send FineGuard renewal invoice (INV-007)', assignedTo: 'George', priority: 'High', status: 'Open', dueAt: fwd(5) },
    { title: 'Review FineGuard SLA v2 document', assignedTo: 'George', priority: 'Medium', status: 'Open', dueAt: fwd(3) },
    { title: 'Review AccountSup onboarding checklist', assignedTo: 'Alissa', priority: 'Medium', status: 'Open', dueAt: fwd(4) },
    { title: 'Follow up Tom Hartley — integration spec call', assignedTo: 'Dagon', priority: 'Low', status: 'Open', dueAt: fwd(7) },
    { title: 'Draft INV-006 for Builder Big Jobs', assignedTo: 'George', priority: 'Medium', status: 'InProgress' },
  ])
  console.log('  ✓ osTasks')

  console.log('✅ Seed complete')
  await client.end()
}

seed().catch((e) => { console.error(e); process.exit(1) })
