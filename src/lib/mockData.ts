import type {
  Company, VATReturn, LedgerEntry, Receipt, StagingItem,
  BankTransaction, VaultDocument, ComplianceAlert, AuditLog,
  DashboardStats, SupplierMemory, User
} from '@/types/fineguard';

// ============================================================================
// MOCK USERS
// ============================================================================
export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'partner@fineguard.co.uk',
    name: 'Sarah Thompson',
    role: 'partner',
    companyIds: ['c1', 'c2', 'c3'],
    mfaEnabled: true,
    createdAt: '2023-01-15',
  },
  {
    id: 'u2',
    email: 'accountant@fineguard.co.uk',
    name: 'James Wilson',
    role: 'senior_accountant',
    companyIds: ['c1', 'c2'],
    mfaEnabled: true,
    createdAt: '2023-03-10',
  },
];

// ============================================================================
// MOCK COMPANIES
// ============================================================================
export const mockCompanies: Company[] = [
  {
    id: 'c1',
    name: 'Apex Digital Solutions Ltd',
    companyNumber: '12345678',
    vrn: 'GB123456789',
    vatScheme: 'standard',
    status: 'active',
    registeredAddress: '123 Tech Street, London, EC1A 1BB',
    directors: ['James Carter', 'Emma Williams'],
    nextFilingDate: '2025-09-30',
    nextVATReturn: '2025-04-07',
    filingStatus: 'due_soon',
    syncStatus: 'in_sync',
    lastSynced: '2025-03-06T09:00:00Z',
  },
  {
    id: 'c2',
    name: 'Green Valley Retail Ltd',
    companyNumber: '87654321',
    vrn: 'GB987654321',
    vatScheme: 'flat_rate',
    status: 'active',
    registeredAddress: '45 High Street, Manchester, M1 2AB',
    directors: ['Robert Green'],
    nextFilingDate: '2025-06-30',
    nextVATReturn: '2025-04-30',
    filingStatus: 'compliant',
    syncStatus: 'variance_detected',
    lastSynced: '2025-03-05T14:30:00Z',
  },
  {
    id: 'c3',
    name: 'Northern Construction Services Ltd',
    companyNumber: '11223344',
    vrn: 'GB112233445',
    vatScheme: 'cash_accounting',
    status: 'active',
    registeredAddress: '78 Builder Lane, Leeds, LS1 3CD',
    directors: ['Patricia North', 'David Mills'],
    nextFilingDate: '2025-12-31',
    nextVATReturn: '2025-05-07',
    filingStatus: 'compliant',
    syncStatus: 'in_sync',
    lastSynced: '2025-03-06T08:45:00Z',
  },
];

// ============================================================================
// MOCK VAT RETURN
// ============================================================================
export const mockVATReturn: VATReturn = {
  id: 'vr1',
  companyId: 'c1',
  periodStart: '2025-01-01',
  periodEnd: '2025-03-31',
  dueDate: '2025-05-07',
  status: 'draft',
  boxes: {
    box1: 24750.00,
    box2: 0,
    box3: 24750.00,
    box4: 8320.50,
    box5: 16429.50,
    box6: 123750.00,
    box7: 41602.50,
    box8: 0,
    box9: 0,
  },
  createdAt: '2025-03-01T00:00:00Z',
  updatedAt: '2025-03-06T09:00:00Z',
};

// ============================================================================
// MOCK LEDGER ENTRIES
// ============================================================================
export const mockLedgerEntries: LedgerEntry[] = [
  {
    id: 'l1',
    companyId: 'c1',
    date: '2025-03-05',
    description: 'Cloud hosting services - March 2025',
    supplier: 'Azure Cloud Services',
    net: 4500.00,
    vat: 900.00,
    gross: 5400.00,
    type: 'purchase',
    verifiedBy: 'James Wilson',
    verifiedAt: '2025-03-06T09:30:00Z',
    source: 'manual',
    status: 'verified',
    invoiceNumber: 'AZR-2025-0234',
    vatRate: 20,
    createdAt: '2025-03-06T09:00:00Z',
  },
  {
    id: 'l2',
    companyId: 'c1',
    date: '2025-03-04',
    description: 'Web development services',
    supplier: 'DevStudio Agency',
    net: 8000.00,
    vat: 1600.00,
    gross: 9600.00,
    type: 'sales',
    verifiedBy: 'Sarah Thompson',
    verifiedAt: '2025-03-05T11:00:00Z',
    source: 'manual',
    status: 'locked',
    invoiceNumber: 'INV-2025-0089',
    vatRate: 20,
    createdAt: '2025-03-04T15:00:00Z',
  },
  {
    id: 'l3',
    companyId: 'c1',
    date: '2025-03-03',
    description: 'Office supplies',
    supplier: 'Staples Business Direct',
    net: 250.00,
    vat: 50.00,
    gross: 300.00,
    type: 'purchase',
    source: 'ocr',
    status: 'unverified',
    invoiceNumber: 'STB-20250303',
    vatRate: 20,
    createdAt: '2025-03-03T14:00:00Z',
  },
  {
    id: 'l4',
    companyId: 'c1',
    date: '2025-03-01',
    description: 'Marketing consultancy Q1',
    supplier: 'BrandWave Marketing',
    net: 3200.00,
    vat: 640.00,
    gross: 3840.00,
    type: 'purchase',
    verifiedBy: 'James Wilson',
    verifiedAt: '2025-03-02T10:00:00Z',
    source: 'import',
    status: 'verified',
    invoiceNumber: 'BWM-Q1-2025',
    vatRate: 20,
    createdAt: '2025-03-01T09:00:00Z',
  },
];

// ============================================================================
// MOCK RECEIPTS
// ============================================================================
export const mockReceipts: Receipt[] = [
  {
    id: 'r1',
    companyId: 'c1',
    fileName: 'azure-invoice-march-2025.pdf',
    fileType: 'pdf',
    fileUrl: '/documents/azure-invoice.pdf',
    uploadedAt: '2025-03-06T08:30:00Z',
    uploadedBy: 'James Wilson',
    status: 'verified',
    extractedFields: {
      supplier: 'Azure Cloud Services',
      date: '2025-03-01',
      net: 4500.00,
      vat: 900.00,
      gross: 5400.00,
      invoiceNumber: 'AZR-2025-0234',
      vatRate: 20,
      confidence: 99.2,
    },
    isDuplicate: false,
    fingerprint: 'abc123def456',
  },
  {
    id: 'r2',
    companyId: 'c1',
    fileName: 'staples-receipt-03032025.jpg',
    fileType: 'image',
    fileUrl: '/documents/staples-receipt.jpg',
    uploadedAt: '2025-03-03T16:00:00Z',
    uploadedBy: 'James Wilson',
    status: 'extracted',
    extractedFields: {
      supplier: 'Staples Business Direct',
      date: '2025-03-03',
      net: 250.00,
      vat: 50.00,
      gross: 300.00,
      invoiceNumber: 'STB-20250303',
      vatRate: 20,
      confidence: 94.5,
    },
    isDuplicate: false,
    fingerprint: 'xyz789ghi012',
  },
  {
    id: 'r3',
    companyId: 'c1',
    fileName: 'office-lunch-receipt.jpg',
    fileType: 'image',
    fileUrl: '/documents/lunch-receipt.jpg',
    uploadedAt: '2025-03-05T13:00:00Z',
    uploadedBy: 'James Wilson',
    status: 'duplicate',
    extractedFields: {
      supplier: 'Costa Coffee',
      date: '2025-03-05',
      net: 45.00,
      vat: 9.00,
      gross: 54.00,
      invoiceNumber: '',
      vatRate: 20,
      confidence: 96.8,
    },
    isDuplicate: true,
    originalReceiptId: 'r4',
    fingerprint: 'dup456abc789',
  },
];

// ============================================================================
// MOCK STAGING ITEMS
// ============================================================================
export const mockStagingItems: StagingItem[] = [
  {
    id: 's1',
    receiptId: 'r2',
    companyId: 'c1',
    receipt: mockReceipts[1],
    extractedFields: mockReceipts[1].extractedFields!,
    status: 'pending',
    createdAt: '2025-03-03T16:00:00Z',
  },
];

// ============================================================================
// MOCK BANK TRANSACTIONS
// ============================================================================
export const mockBankTransactions: BankTransaction[] = [
  {
    id: 'bt1',
    companyId: 'c1',
    date: '2025-03-05',
    description: 'AZURE CLOUD SERVICES',
    amount: 5400.00,
    type: 'debit',
    reference: 'AZR20250301',
    reconciliationStatus: 'matched',
    matchedLedgerIds: ['l1'],
  },
  {
    id: 'bt2',
    companyId: 'c1',
    date: '2025-03-04',
    description: 'DEVSTUDIO AGENCY INVOICE',
    amount: 9600.00,
    type: 'credit',
    reference: 'DS20250304',
    reconciliationStatus: 'matched',
    matchedLedgerIds: ['l2'],
  },
  {
    id: 'bt3',
    companyId: 'c1',
    date: '2025-03-06',
    description: 'OFFICE SUPPLIES PURCHASE',
    amount: 185.00,
    type: 'debit',
    reference: 'MISC20250306',
    reconciliationStatus: 'unmatched',
    matchedLedgerIds: [],
  },
  {
    id: 'bt4',
    companyId: 'c1',
    date: '2025-03-06',
    description: 'CLIENT PAYMENT - SMITHCO',
    amount: 15600.00,
    type: 'credit',
    reference: 'SMI20250306',
    reconciliationStatus: 'pending_receipt',
    matchedLedgerIds: [],
  },
];

// ============================================================================
// MOCK DOCUMENTS
// ============================================================================
export const mockDocuments: VaultDocument[] = [
  {
    id: 'd1',
    companyId: 'c1',
    name: 'Annual Accounts 2024',
    category: 'accounts',
    fileType: 'pdf',
    fileUrl: '/vault/accounts-2024.pdf',
    fileSize: 2457600,
    uploadedAt: '2025-01-15T10:00:00Z',
    uploadedBy: 'Sarah Thompson',
    year: 2024,
    tags: ['annual_accounts', 'statutory'],
    description: 'Filed annual accounts for year ending 31 Dec 2024',
  },
  {
    id: 'd2',
    companyId: 'c1',
    name: 'VAT Return Q4 2024',
    category: 'tax_filings',
    fileType: 'pdf',
    fileUrl: '/vault/vat-q4-2024.pdf',
    fileSize: 512000,
    uploadedAt: '2025-02-07T14:00:00Z',
    uploadedBy: 'James Wilson',
    year: 2024,
    tags: ['vat_return', 'q4_2024'],
  },
  {
    id: 'd3',
    companyId: 'c1',
    name: 'Certificate of Incorporation',
    category: 'company_documents',
    fileType: 'pdf',
    fileUrl: '/vault/cert-incorporation.pdf',
    fileSize: 1024000,
    uploadedAt: '2023-01-15T09:00:00Z',
    uploadedBy: 'Sarah Thompson',
    year: 2023,
    tags: ['incorporation', 'legal'],
  },
];

// ============================================================================
// MOCK COMPLIANCE ALERTS
// ============================================================================
export const mockComplianceAlerts: ComplianceAlert[] = [
  {
    id: 'a1',
    companyId: 'c1',
    companyName: 'Apex Digital Solutions Ltd',
    type: 'vat_due',
    severity: 'warning',
    title: 'VAT Return Due in 32 Days',
    message: 'Q1 2025 VAT return (Jan-Mar) is due for submission by 7 May 2025. Current status: Draft.',
    dueDate: '2025-05-07',
    isRead: false,
    isResolved: false,
    createdAt: '2025-03-05T09:00:00Z',
  },
  {
    id: 'a2',
    companyId: 'c2',
    companyName: 'Green Valley Retail Ltd',
    type: 'data_mismatch',
    severity: 'critical',
    title: 'VAT Variance Detected',
    message: 'Bank feed total (£8,450.00) does not match ledger total (£7,920.00). Variance of £530.00 requires investigation.',
    isRead: false,
    isResolved: false,
    createdAt: '2025-03-06T07:30:00Z',
  },
  {
    id: 'a3',
    companyId: 'c3',
    companyName: 'Northern Construction Services Ltd',
    type: 'confirmation_statement',
    severity: 'info',
    title: 'Confirmation Statement Due',
    message: 'Annual confirmation statement due for filing with Companies House by 30 June 2025.',
    dueDate: '2025-06-30',
    isRead: true,
    isResolved: false,
    createdAt: '2025-03-01T09:00:00Z',
  },
];

// ============================================================================
// MOCK AUDIT LOGS
// ============================================================================
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'al1',
    companyId: 'c1',
    userId: 'u2',
    userName: 'James Wilson',
    action: 'LEDGER_ENTRY_VERIFIED',
    entityType: 'LedgerEntry',
    entityId: 'l1',
    beforeValue: { status: 'unverified' },
    afterValue: { status: 'verified', verifiedBy: 'James Wilson' },
    timestamp: '2025-03-06T09:30:00Z',
    ipAddress: '192.168.1.50',
  },
  {
    id: 'al2',
    companyId: 'c1',
    userId: 'u1',
    userName: 'Sarah Thompson',
    action: 'VAT_RETURN_VALIDATED',
    entityType: 'VATReturn',
    entityId: 'vr1',
    beforeValue: { status: 'draft' },
    afterValue: { status: 'validated' },
    timestamp: '2025-03-05T16:45:00Z',
    ipAddress: '192.168.1.10',
  },
  {
    id: 'al3',
    companyId: 'c1',
    userId: 'u2',
    userName: 'James Wilson',
    action: 'RECEIPT_UPLOADED',
    entityType: 'Receipt',
    entityId: 'r1',
    afterValue: { fileName: 'azure-invoice-march-2025.pdf', status: 'uploaded' },
    timestamp: '2025-03-06T08:30:00Z',
    ipAddress: '192.168.1.50',
  },
];

// ============================================================================
// MOCK SUPPLIER MEMORY
// ============================================================================
export const mockSupplierMemory: SupplierMemory[] = [
  {
    id: 'sm1',
    companyId: 'c1',
    supplierName: 'Azure Cloud Services',
    defaultVatRate: 20,
    transactionType: 'purchase',
    lastSeen: '2025-03-05',
    transactionCount: 24,
  },
  {
    id: 'sm2',
    companyId: 'c1',
    supplierName: 'Staples Business Direct',
    defaultVatRate: 20,
    transactionType: 'purchase',
    lastSeen: '2025-03-03',
    transactionCount: 8,
  },
  {
    id: 'sm3',
    companyId: 'c1',
    supplierName: 'BrandWave Marketing',
    defaultVatRate: 20,
    transactionType: 'purchase',
    lastSeen: '2025-03-01',
    transactionCount: 4,
  },
];

// ============================================================================
// MOCK DASHBOARD STATS
// ============================================================================
export const mockDashboardStats: DashboardStats = {
  nextVATDeadline: '2025-05-07',
  vatReturnStatus: 'draft',
  recentReceiptsCount: 3,
  unreadAlerts: 2,
  vatLiabilityEstimate: 16429.50,
  vatBoxes: mockVATReturn.boxes,
  syncStatus: 'in_sync',
  pendingStaging: 1,
  pendingOfflineUploads: 0,
};
